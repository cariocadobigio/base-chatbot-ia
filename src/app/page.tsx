"use client";

import { useState } from "react";

// Tipagem rigorosa mantida para previsibilidade de estado
type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export default function ChatPage() {
  // State Management: Captura de Lead
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [isLeadCaptured, setIsLeadCaptured] = useState(false);

  // State Management: Chatbot (Mensagem inicial focada em vender os seus serviços)
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "assistant", 
      content: "Olá! Sou o assistente virtual do Carioca, Arquiteto de Software. Nós desenvolvemos sistemas web robustos, aplicativos e automações focadas em escalar negócios. Me conta de forma resumida: qual é o seu segmento e o que você precisa construir ou automatizar na sua empresa?" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handler para o formulário inicial de captura (Lead Gate)
  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (nome.trim() && telefone.trim()) {
      setIsLeadCaptured(true);
    }
  };

  // Handler da Engine de IA
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!input.trim() || isLoading) return;

    // Optimistic UI Update
    const newMessages = [...messages, { role: "user", content: input } as Message];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: newMessages.filter(m => m.role !== "system"),
          nomeCliente: nome,
          telefone: telefone
        }), 
      });

      const result = await response.json();

      if (result.success) {
        setMessages((prev) => [...prev, result.data]);
      } else {
        console.error("❌ Erro da API (Backend):", result.error);
      }
    } catch (error) {
      console.error("❌ Falha crítica na requisição de rede:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // UI/UX: Tela 1 - Landing Page de Captura (Dark Mode Premium)
  if (!isLeadCaptured) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-slate-900 px-4 font-sans text-slate-100">
        <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 transition-all hover:border-indigo-500/50">
          <div className="text-center mb-8">
            <div className="inline-block bg-indigo-500/10 text-indigo-400 p-4 rounded-full mb-4 ring-1 ring-indigo-500/30">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Carioca Dev</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Desenvolvimento Web de Elite. Do Front-end ao Back-end, arquitetura feita para escalar o seu negócio.
            </p>
          </div>

          <form onSubmit={handleStartChat} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Como devo te chamar?</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Seu nome ou empresa"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Seu melhor WhatsApp</label>
              <input
                type="tel"
                required
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-slate-500"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/50 transition-all mt-4 flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/30"
            >
              <span>Iniciar Consultoria Gratuita</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
        </div>
      </main>
    );
  }

  // UI/UX: Tela 2 - Interface de Chat (Liberada)
  return (
    <main className="flex flex-col h-screen bg-slate-900 max-w-md mx-auto border-x border-slate-800 shadow-2xl relative font-sans">
      <header className="bg-slate-800/90 backdrop-blur-md border-b border-slate-700 text-slate-100 p-4 flex justify-between items-center z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          <div className="font-bold text-sm tracking-wider">CARIOCA AI <span className="text-indigo-400 font-mono text-xs ml-1 font-normal">v1.0</span></div>
        </div>
        <div className="text-xs bg-slate-700 px-3 py-1.5 rounded-full text-slate-300 font-medium truncate max-w-[120px]">
          {nome}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-5 scroll-smooth custom-scrollbar">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div 
              className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed shadow-sm ${
                msg.role === "user" 
                  ? "bg-indigo-600 text-white rounded-br-sm shadow-indigo-900/20" 
                  : "bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-4 bg-slate-800 border border-slate-700 text-slate-400 rounded-2xl rounded-bl-sm text-sm flex gap-2 items-center">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2 sticky bottom-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Descreva o seu projeto..."
          className="flex-1 bg-slate-800 border border-slate-700 text-white rounded-full px-5 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder-slate-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-indigo-600 text-white p-3.5 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-lg shadow-indigo-600/30"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </main>
  );
}