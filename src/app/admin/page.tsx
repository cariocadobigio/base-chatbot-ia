"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase"; 

type Lead = {
  id: string;
  created_at: string;
  nome_cliente: string;
  telefone: string;
  historico_chat: any[];
};

export default function AdminDashboard() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      // 🔥 CORREÇÃO CRÍTICA: Apontando para a tabela exata do seu SaaS
      const { data, error } = await supabase
        .from("leads_viagens")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("❌ Falha de Fetching (Possível bloqueio de RLS):", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatarData = (dataIso: string) => {
    return new Date(dataIso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-slate-900 p-8 font-sans text-slate-100">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">CRM | Enterprise</h1>
            <p className="text-slate-400 mt-1">Gestão de Leads Omnichannel e Transbordo Humano</p>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="bg-slate-900 border border-slate-700 text-indigo-400 px-4 py-2.5 rounded-xl font-bold flex-1 text-center whitespace-nowrap">
              Total: {leads.length} Leads
            </div>
            <button 
              onClick={fetchLeads}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center"
            >
              Atualizar
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-slate-800 p-12 rounded-2xl border border-slate-700 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-xl font-bold text-slate-300">Nenhum Lead retornado da API</h2>
            <p className="text-slate-500 mt-2">O banco está vazio ou o RLS (Supabase) está bloqueando a leitura.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leads.map((lead) => (
              <div key={lead.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden hover:border-indigo-500/50 transition-colors shadow-lg flex flex-col">
                <div className="p-5 border-b border-slate-700 bg-slate-800/50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-white truncate pr-2">{lead.nome_cliente || 'Lead Anônimo'}</h3>
                    <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/20 whitespace-nowrap">
                      Capturado
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm font-mono">{lead.telefone}</p>
                  <div className="text-slate-500 text-xs mt-3 flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-700/50">
                    <span>📅 {formatarData(lead.created_at)}</span>
                    <span>💬 {lead.historico_chat ? Math.max(0, lead.historico_chat.length - 1) : 0} msgs</span>
                  </div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-end">
                  <a 
                    href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white text-center py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    Assumir (Human Handoff)
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}