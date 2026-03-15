"use client";

import { useEffect, useState } from "react";
// Usando caminho relativo ajustado para 2 níveis (app -> admin -> page.tsx)
import { supabase } from "../../lib/supabase"; 

// Tipagem rigorosa para o nosso banco de dados
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

  // Hook para buscar os dados assim que a tela carrega
  useEffect(() => {
    fetchLeads();
  }, []);

  // Data Fetching: Buscando os Leads no Supabase
  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads_viagens")
        .select("*")
        .order("created_at", { ascending: false }); // Traz os mais recentes primeiro

      if (error) throw error;
      if (data) setLeads(data);
    } catch (error) {
      console.error("❌ Erro ao buscar leads:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function para formatar a data do banco
  const formatarData = (dataIso: string) => {
    return new Date(dataIso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Painel de Leads</h1>
            <p className="text-gray-500 mt-1">Gerencie os clientes capturados pelo Agente Virtual</p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-bold">
            Total de Leads: {leads.length}
          </div>
        </header>

        {isLoading ? (
          <div className="text-center py-20 text-gray-500 animate-pulse font-medium">
            Carregando painel de vendas...
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-sm uppercase tracking-wider">
                  <th className="p-4 font-semibold">Data</th>
                  <th className="p-4 font-semibold">Cliente</th>
                  <th className="p-4 font-semibold">WhatsApp</th>
                  <th className="p-4 font-semibold">Interações (Chat)</th>
                  <th className="p-4 font-semibold text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      Nenhum lead capturado ainda. Mande o link para os clientes!
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 text-sm text-gray-500 whitespace-nowrap">
                        {formatarData(lead.created_at)}
                      </td>
                      <td className="p-4 font-medium text-gray-900">
                        {lead.nome_cliente}
                      </td>
                      <td className="p-4 text-gray-600">
                        {lead.telefone}
                      </td>
                      <td className="p-4 text-sm text-gray-500">
                        {lead.historico_chat.length - 1} mensagens trocadas
                      </td>
                      <td className="p-4 text-center">
                        <a
                          href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block bg-green-500 hover:bg-green-600 text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                          Chamar no Zap
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}