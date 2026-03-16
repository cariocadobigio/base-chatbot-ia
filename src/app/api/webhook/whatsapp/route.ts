import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '../../../../lib/supabase'; 

const openai = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

const WEBHOOK_VERIFY_TOKEN = process.env.WEBHOOK_VERIFY_TOKEN || 'carioca-token-secreto-123';

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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const mensagemRecebida = changes?.messages?.[0]?.text?.body;
    const telefoneRemetente = changes?.messages?.[0]?.from;
    const nomeRemetente = changes?.contacts?.[0]?.profile?.name || 'Lead WhatsApp';

    if (!mensagemRecebida || !telefoneRemetente) {
      return NextResponse.json({ status: 'Evento ignorado (não é texto)' }, { status: 200 });
    }

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

    const systemMessage = {
      role: 'system',
      content: `${contextoRAG}\n\nREGRA ESTRITA: Use SOMENTE as informações acima para basear sua resposta. Se o cliente perguntar algo fora deste contexto, diga de forma educada que apenas o especialista (humano) pode confirmar isso e encerre sugerindo um orçamento formal. Seja persuasivo e curto.`,
    };

    const conversationHistory = [
      systemMessage,
      { role: 'user', content: mensagemRecebida }
    ];

    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: conversationHistory as any,
      temperature: 0.3, 
    });

    const aiResponse = completion.choices[0].message.content;

    await supabase
      .from('leads_viagens') 
      .insert([{
        nome_cliente: nomeRemetente,
        telefone: telefoneRemetente,
        historico_chat: conversationHistory.concat({ role: 'assistant', content: aiResponse || '' })
      }]);

    // O retorno agora empacota a resposta da IA para o seu microserviço local ler
    return NextResponse.json({ success: true, ai_response: aiResponse }, { status: 200 });

  } catch (error: any) {
    console.error('❌ Falha Crítica no Webhook:', error);
    return NextResponse.json({ error: 'Erro processado internamente' }, { status: 200 });
  }
}