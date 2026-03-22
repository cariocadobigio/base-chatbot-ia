import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Inicializando o Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // 🔥 UPDATE: Extraindo a mensagem e o ID do Inquilino do Payload (com fallback)
    const { message, tenant_id = 'default-tenant' } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Payload inválido: Mensagem não fornecida." },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("❌ ERRO CRÍTICO: GROQ_API_KEY não encontrada no .env");
      return NextResponse.json(
        { error: "Erro de configuração no servidor." },
        { status: 500 }
      );
    }

    // 🔥 SSOT + Multi-Tenant: Buscando o Cérebro exato do Inquilino atual
    const { data: conhecimento, error: supabaseError } = await supabase
      .from("conhecimento_empresa")
      .select("conteudo")
      .eq("ativo", true)
      .eq("tenant_id", tenant_id) // O Filtro de Isolamento de Dados
      .limit(1)
      .single();

    if (supabaseError) {
      console.error(`⚠️ Aviso: Falha ao ler tabela conhecimento_empresa para o tenant: ${tenant_id}`, supabaseError);
    }

    // 🔗 Integração Cal.com (Variável de Ambiente)
    const calComLink = process.env.CAL_COM_LINK || "https://cal.com/seu-usuario/reuniao";

    // 🧠 Prompt Engineering: Unindo o Banco de Dados com a Diretriz SDR
    const basePrompt = conhecimento?.conteudo || "Você é o assistente virtual genérico. Convença o cliente a chamar no WhatsApp.";
    const sdrPrompt = `\n\n[DIRETRIZ ESTRITA DE AGENDAMENTO - MODO SDR]:
Seu objetivo final é fazer o cliente agendar uma reunião de orçamento.
REGRA 1: Só forneça o link de agendamento DEPOIS de entender pelo menos uma dor/necessidade do cliente.
REGRA 2: Quando o cliente estiver qualificado ou pedir explicitamente para marcar uma reunião/falar com humano, envie EXATAMENTE este link: ${calComLink}
REGRA 3: Nunca invente horários. Apenas forneça o link e diga para ele escolher o melhor horário na agenda.`;

    const finalSystemPrompt = basePrompt + sdrPrompt;

    // Roteamento para a Groq
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", 
        messages: [
          {
            role: "system",
            content: finalSystemPrompt, // Cérebro Isolado Injetado!
          },
          {
            role: "user",
            content: message,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error("❌ Erro retornado pela Groq:", data);
      throw new Error(data.error?.message || "Falha na comunicação com a LLM.");
    }

    const aiResponseText = data.choices[0].message.content;

    return NextResponse.json({ 
      success: true, 
      reply: aiResponseText 
    }, { status: 200 });

  } catch (error: any) {
    console.error("❌ Erro interno no Endpoint /api/chat:", error);
    return NextResponse.json(
      { error: "Falha catastrófica no servidor Serverless." },
      { status: 500 }
    );
  }
}