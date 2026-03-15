"use client";

import { useState } from "react";

// Tipagem rigorosa para manter o código seguro e previsível
type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export default function ChatPage() {
  // State Management: Captura de Lead
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [isLeadCaptured, setIsLeadCaptured] = useState(false);

  // State Management: Chatbot
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Olá! Que ótimo ter você aqui. Para onde você sonha em viajar nas suas próximas férias?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handler para o formulário inicial de captura
  const handleStartChat = (e: React.FormEvent) => {
    e.preventDefault();
    // Fail-fast: Só libera se preencher os dois campos
    if (nome.trim() && telefone.trim()) {
      setIsLeadCaptured(true);
    }
  };

  // Handler para enviar mensagens para a nossa Engine de IA
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault(); 
    if (!input.trim() || isLoading) return;

    // Optimistic UI Update
    const newMessages = [...messages, { role: "user", content: input } as Message];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // API Call via Fetch nativo (Client-side)
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // O Payload (corpo da requisição) agora leva o histórico e os dados do Lead
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

  // Conditional Rendering: Tela 1 - Formulário de Captura
  if (!isLeadCaptured) {
    return (
      <main className="flex flex-col items-center justify-center h-screen bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-blue-600 mb-2">✈️ Embarque Imediato</h1>
            <p className="text-gray-600 text-sm">
              Fale com nosso Agente Virtual e monte o roteiro dos seus sonhos em segundos.
            </p>
          </div>

          <form onSubmit={handleStartChat} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qual o seu nome?</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João Silva"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seu melhor WhatsApp</label>
              <input
                type="tel"
                required
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors mt-2"
            >
              Iniciar Atendimento
            </button>
          </form>
        </div>
      </main>
    );
  }

  // Conditional Rendering: Tela 2 - Interface de Chat (Liberada)
  return (
    <main className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto border-x border-gray-200 shadow-2xl relative">
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center shadow-md z-10">
        <div className="font-bold text-lg">✈️ Agente de Viagens</div>
        <div className="text-xs bg-blue-500 px-2 py-1 rounded-full">{nome}</div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div 
              className={`p-3 rounded-2xl max-w-[85%] shadow-sm text-sm ${
                msg.role === "user" 
                  ? "bg-blue-600 text-white rounded-br-none" 
                  : "bg-white text-gray-800 border border-gray-200 rounded-bl-none"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="p-3 bg-white border border-gray-200 text-gray-500 rounded-2xl rounded-bl-none animate-pulse text-sm">
              Pesquisando destinos incríveis...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 border border-gray-300 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-blue-600 text-white px-5 py-3 rounded-full font-bold text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center"
        >
          Enviar
        </button>
      </form>
    </main>
  );
}