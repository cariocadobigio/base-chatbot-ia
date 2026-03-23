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
  if (searchParams.get('hub.mode') === 'subscribe' && searchParams.get('hub.verify_token') === WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(searchParams.get('hub.challenge'), { status: 200 });
  }
  return new NextResponse('Acesso Negado', { status: 403 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const changes = body.entry?.[0]?.changes?.[0]?.value;
    const mensagemRecebida = changes?.messages?.[0]?.text?.body;
    const telefoneRemetente = changes?.messages?.[0]?.from;
    const nomeRemetente = changes?.contacts?.[0]?.profile?.name || 'Lead WhatsApp';
    
    // 🏢 MULTI-TENANT ROUTING: O telefone de destino define o Inquilino
    // O número que recebeu a mensagem (o seu bot) dita de qual empresa é o lead
    const numeroDestino = changes?.metadata?.display_phone_number;
    
    // Logica de Roteamento (Em produção, você buscaria isso de uma tabela 'conexoes_whatsapp')
    let currentTenantId = 'default-tenant';
    if (numeroDestino === '557999999999') currentTenantId = 'imobiliaria-alpha'; // Exemplo fictício

    if (!mensagemRecebida || !telefoneRemetente) {
      return NextResponse.json({ status: 'Evento ignorado' }, { status: 200 });
    }

    // 🔥 FIX: Busca o cérebro apenas do Inquilino dono deste número de WhatsApp
    const { data: conhecimento } = await supabase
      .from('conhecimento_empresa')
      .select('conteudo')
      .eq('ativo', true)
      .eq('tenant_id', currentTenantId)
      .limit(1)
      .single();

    const contextoRAG = conhecimento?.conteudo || "Você é o assistente virtual da Carioca Dev.";
    const calComLink = process.env.CAL_COM_LINK || "https://cal.com/";

    const systemMessage = {
      role: 'system',
      content: `${contextoRAG}\n\n[DIRETRIZ SDR]: Tente qualificar o lead. Se ele pedir reunião, envie: ${calComLink}`,
    };

    const conversationHistory = [systemMessage, { role: 'user', content: mensagemRecebida }];

    const completion = await openai.chat.completions.create({
      model: 'llama-3.1-8b-instant', // Atualizado para o modelo moderno e performático
      messages: conversationHistory as any,
      temperature: 0.7, 
    });

    const aiResponse = completion.choices[0].message.content;

    // 🔥 FIX: Salva o Lead amarrado ao Inquilino correto
    await supabase.from('leads_viagens').insert([{
        nome_cliente: nomeRemetente,
        telefone: telefoneRemetente,
        historico_chat: conversationHistory.concat({ role: 'assistant', content: aiResponse || '' }),
        tenant_id: currentTenantId 
      }]);

    return NextResponse.json({ success: true, ai_response: aiResponse }, { status: 200 });
  } catch (error: any) {
    console.error('❌ Falha Crítica no Webhook:', error);
    return NextResponse.json({ error: 'Erro processado internamente' }, { status: 200 });
  }
}