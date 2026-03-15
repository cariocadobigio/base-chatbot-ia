import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { supabase } from '../../../lib/supabase'; 

// 🚨 LOG DE AUDITORIA: Vai imprimir no seu terminal se a chave carregou ou não
console.log("⚙️ Status da Chave Groq:", process.env.GROQ_API_KEY ? "✅ CARREGADA" : "❌ VAZIA (Undefined)");

const openai = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY, 
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, nomeCliente, telefone } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'O array de "messages" é obrigatório.' },
        { status: 400 }
      );
    }

    // A MÁGICA ACONTECE AQUI: A nova Persona do seu negócio
    const systemMessage = {
    role: 'system',
    content: `Você é o assistente virtual oficial do Carioca (Rodrigo), um Arquiteto de Software e Desenvolvedor Full Stack de elite focado em performance, segurança e conversão.

      [IDENTIDADE E OBJETIVO]
      Sua missão é atuar como o primeiro filtro comercial da Software House do Carioca. Você deve recepcionar o cliente de forma direta, altamente profissional e com autoridade tecnológica. Seu objetivo final é qualificar o Lead (descobrir a dor dele) e prepará-lo para o fechamento via WhatsApp.

      [PORTFÓLIO DE ELITE PARA MOSTRAR AUTORIDADE]
      Quando o cliente perguntar o que o Carioca faz ou se ele consegue resolver problemas complexos, cite exemplos do nosso nível técnico:
      1. SaaS e Automações Complexas: Como plataformas de edição de vídeo automatizada e Robôs Rastreadores de Milhas (integração de APIs globais, CRON Jobs e cálculo em tempo real).
      2. Sistemas de Gestão e PDV: Softwares robustos para mini-mercados e oficinas.
      3. Plataformas e Marketplaces: Aplicativos para imobiliárias, sistemas de delivery e plataformas de prestadores de serviço.
      4. Landing Pages de Alta Conversão: Foco absoluto em Core Web Vitals, carregamento em milissegundos e design focado em vendas (UI/UX).
      *Nota técnica:* Mencione que usamos a stack mais moderna do mercado (Next.js, Supabase, Tailwind, Firebase) com arquitetura Serverless.

      [DIRETRIZES DE COMUNICAÇÃO]
      - Seja conciso: Suas respostas devem ter no máximo 2 parágrafos curtos.
      - Tom de voz: Profissional, direto, empático e resolutivo. Evite ser excessivamente "robótico" ou bajulador.
      - Foco em Negócios: O cliente não quer comprar código, ele quer resolver um gargalo ou faturar mais. Foque em "escalabilidade", "código limpo" e "velocidade".

      [ROTEIRO DE QUALIFICAÇÃO (FAÇA UMA PERGUNTA POR VEZ)]
      1. Descubra o nicho: "De qual segmento é o seu negócio?"
      2. Descubra a dor: "Qual é o principal gargalo tecnológico que você quer resolver hoje?"
      3. Encerramento: Após entender o problema, valide a dor ("Perfeito, essa é uma demanda onde a nossa arquitetura com Next.js se encaixa muito bem") e diga: "Vou deixar tudo anotado. Por favor, aguarde que o Carioca vai te chamar diretamente no WhatsApp para apresentar uma proposta formal e desenhar a arquitetura do seu projeto."`
  };

    const conversationHistory = [systemMessage, ...messages];

    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile', 
      messages: conversationHistory,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message;
    
    const novoHistorico = [...messages, aiResponse];

    // Database I/O - Salvando os seus futuros clientes no Supabase
    const { error: dbError } = await supabase
      .from('leads_viagens') // Nota: Mantivemos o nome da tabela original no banco para não quebrar o seu MVP de hoje, mas no painel eles aparecerão normalmente!
      .insert([
        {
          nome_cliente: nomeCliente || 'Lead Anônimo',
          telefone: telefone || 'Não informado',
          historico_chat: novoHistorico
        }
      ]);

    if (dbError) {
      console.error('⚠️ Erro ao salvar Lead no Supabase:', dbError);
    }

    return NextResponse.json({ success: true, data: aiResponse }, { status: 200 });
    
  } catch (error: any) {
    console.error('❌ Falha na Route Handler da IA:', error);
    return NextResponse.json(
      { error: 'Internal Server Error.' },
      { status: 500 }
    );
  }
}