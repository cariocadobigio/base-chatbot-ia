import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '../../../../lib/supabase'; // Ajuste de 4 níveis de pastas

const openai = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// Segurança de Enterprise: Token para impedir que hackers mandem dados falsos pro seu Webhook
const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'carioca-token-secreto-123';

// ----------------------------------------------------------------------
// MÉTODO GET: Validação do Webhook (Obrigatório pela API Oficial da Meta)
// ----------------------------------------------------------------------
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === WEBHOOK_VERIFY_TOKEN) {
    console.log('✅ Webhook do WhatsApp Verificado com Sucesso!');
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Acesso Negado (Forbidden)', { status: 403 });
}

// ----------------------------------------------------------------------
// MÉTODO POST: Recebendo mensagens do WhatsApp e processando com RAG
// ----------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // 1. Extração do Payload (Baseado no padrão Meta/WhatsApp Cloud API)
    // Se estiver usando Evolution API ou Z-API, os campos do JSON mudam levemente.
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const mensagemRecebida = changes?.messages?.[0]?.text?.body;
    const telefoneRemetente = changes?.messages?.[0]?.from;
    const nomeRemetente = changes?.contacts?.[0]?.profile?.name || 'Lead WhatsApp';

    // Fail-fast: Se não for uma mensagem de texto válida, retorna 200 pro WhatsApp não ficar reenviando.
    if (!mensagemRecebida || !telefoneRemetente) {
      return NextResponse.json({ status: 'Evento ignorado (não é texto)' }, { status: 200 });
    }

    // ====================================================================
    // 2. RAG (Retrieval-Augmented Generation) - Busca de Contexto Dinâmico
    // ====================================================================
    // Vamos no Supabase buscar o "documento" que ensina a IA a vender o seu serviço.
    const { data: conhecimento, error: ragError } = await supabase
      .from('conhecimento_empresa')
      .select('conteudo')
      .eq('ativo', true)
      .limit(1)
      .single();

    let contextoRAG = "Você é o assistente virtual do Carioca Dev. Venda sistemas web sob medida e direcione o cliente.";
    
    if (conhecimento && !ragError) {
      contextoRAG = conhecimento.conteudo;
    }

    // 3. Montagem do Prompt de Sistema com o RAG injetado
    const systemMessage = {
      role: 'system',
      content: `${contextoRAG}\n\nREGRA ESTRITA: Use SOMENTE as informações acima para basear sua resposta. Se o cliente perguntar algo fora deste contexto, diga de forma educada que apenas o especialista (humano) pode confirmar isso e encerre sugerindo um orçamento formal. Seja persuasivo e curto.`,
    };

    const conversationHistory = [
      systemMessage,
      { role: 'user', content: mensagemRecebida }
    ];

    // ====================================================================
    // 4. Engine de IA (Groq Llama 3.3)
    // ====================================================================
    // Reduzimos a 'temperature' para 0.3 para evitar que a IA invente informações (Alucinação)
    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: conversationHistory as any,
      temperature: 0.3, 
    });

    const aiResponse = completion.choices[0].message.content;

    // ====================================================================
    // 5. Database I/O (Omnichannel Analytics)
    // ====================================================================
    // Salvamos a interação na nossa tabela para aparecer no Painel Admin
    await supabase
      .from('leads_viagens') // Reaproveitando a tabela do MVP
      .insert([{
        nome_cliente: nomeRemetente,
        telefone: telefoneRemetente,
        historico_chat: conversationHistory.concat({ role: 'assistant', content: aiResponse || '' })
      }]);

    // ====================================================================
    // 6. Resposta Omnichannel (Saindo do código para o WhatsApp)
    // ====================================================================
    // Aqui nós devolvemos a resposta da IA para a API do WhatsApp.
    // Como você ainda vai escolher o seu provedor (Meta, Twilio, Evolution), eu deixei a estrutura Pronta para o Fetch.
    
    /*
    await fetch(`https://graph.facebook.com/v17.0/SEU_PHONE_NUMBER_ID/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: telefoneRemetente,
        type: 'text',
        text: { body: aiResponse },
      }),
    });
    */

    // Retorna status 200 obrigatório para a API não considerar o Webhook como falho.
    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Falha Crítica no Webhook:', error);
    // Em webhooks, sempre retornamos 200 mesmo com erro interno para não gerar loop de retry no provedor
    return NextResponse.json({ error: 'Erro processado internamente' }, { status: 200 });
  }
}