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

    const systemMessage = {
      role: 'system',
      content: 'Você é um agente de viagens de elite, altamente persuasivo e educado. Seu objetivo é entender o destino dos sonhos do cliente, o orçamento disponível e vender pacotes de viagens irresistíveis. Faça perguntas curtas. Sempre encerre sugerindo um próximo passo na montagem do roteiro.',
    };

    const conversationHistory = [systemMessage, ...messages];

    //Llama 3.3 70B (A versão mais nova, potente e suportada pela Groq)
    const completion = await openai.chat.completions.create({
      model: 'llama-3.3-70b-versatile', 
      messages: conversationHistory,
      temperature: 0.7,
    });

    const aiResponse = completion.choices[0].message;
    
    const novoHistorico = [...messages, aiResponse];

    // Database I/O - Salvando Lead no Supabase
    const { error: dbError } = await supabase
      .from('leads_viagens')
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