"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

type Message = {
  id: string;
  role: "user" | "ai";
  content: string;
};

export default function WebChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "Olá! Sou o agente virtual da Carioca Dev. Como posso te ajudar hoje com a sua automação?",
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 🏢 MULTI-TENANT CONFIG: Define de qual empresa é este chat
  // Em um SaaS real, você pegaria isso da URL (ex: meusaas.com/chat/imobiliaria-alpha)
  const CURRENT_TENANT = "default-tenant";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { 
      id: Date.now().toString(), 
      role: "user", 
      content: input 
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 🔥 FIX: Injetando o tenant_id no Payload para isolamento de dados
        body: JSON.stringify({ 
          message: userMessage.content,
          tenant_id: CURRENT_TENANT 
        }),
      });

      if (!response.ok) throw new Error("Falha na API do Agente Web");

      const data = await response.json();
      
      const aiMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: "ai", 
        content: data.reply || data.ai_response || "Desculpe, a IA processou a requisição mas o formato de retorno está incorreto." 
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("❌ Erro de Fetching:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "ai",
          content: "⚠️ Estou enfrentando instabilidades na conexão com o servidor Groq. Por favor, me chame no WhatsApp!",
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-indigo-500/30">
      <header className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-tr from-indigo-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white text-lg">🤖</span>
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></span>
            </div>
            <div>
              <h1 className="text-white font-bold tracking-tight">Carioca Web Agent</h1>
              <p className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Online (Groq Llama 3)
              </p>
            </div>
          </div>
          <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm font-medium bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg border border-slate-700">
            Voltar ao Início
          </Link>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-6 pt-4 pb-8">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] sm:max-w-[75%] p-4 rounded-2xl shadow-md backdrop-blur-sm transition-all animate-fade-in-up ${msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-sm" : "bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-sm"}`}>
                <p className="leading-relaxed text-sm md:text-base">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl rounded-tl-sm shadow-md flex gap-2 items-center">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="bg-slate-900 border-t border-slate-800 p-4 sticky bottom-0">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={sendMessage} className="flex items-end gap-2 bg-slate-950 border border-slate-700 p-2 rounded-2xl focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-inner">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Digite sua mensagem para a IA..." className="flex-1 bg-transparent text-white px-4 py-3 outline-none w-full placeholder:text-slate-500" disabled={isLoading} />
            <button type="submit" disabled={isLoading || !input.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white w-12 h-12 rounded-xl flex items-center justify-center transition-all flex-shrink-0 shadow-lg">
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
          <p className="text-center text-xs text-slate-500 mt-3">O Agente pode cometer erros. Considere verificar as informações importantes.</p>
        </div>
      </footer>
    </main>
  );
}