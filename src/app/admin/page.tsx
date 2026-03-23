"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase"; 

// Tipagem rigorosa da entidade Lead
type Lead = {
  id: string;
  created_at: string;
  nome_cliente: string;
  telefone: string;
  historico_chat: any[];
  tenant_id: string;
  status: string; 
};

export default function AdminDashboard() {
  const router = useRouter();
  
  // States de Dados (Read)
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantId, setTenantId] = useState("default-tenant");

  // 🛡️ State de Segurança (Auth Guard)
  const [isAuthValidando, setIsAuthValidando] = useState(true);

  // States de UI/UX (Feedback e Modais)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // States de Formulário (Create)
  const [newLead, setNewLead] = useState({ nome: "", telefone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // EFEITO 1: O CADEADO (Roda antes de tudo)
  useEffect(() => {
    validarAcesso();
  }, []);

  // EFEITO 2: Só busca os dados se o cadeado foi aberto
  useEffect(() => {
    if (!isAuthValidando) {
      fetchLeads();
    }
  }, [tenantId, isAuthValidando]);

  // ==========================================
  // 🔐 AUTH GUARD: Verificação de Segurança
  // ==========================================
  const validarAcesso = async () => {
    // Interroga o Supabase no navegador do usuário
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session) {
      console.warn("⚠️ Acesso negado. Sessão inválida ou expirada.");
      router.replace("/login"); // Expulsa da página instantaneamente
    } else {
      // O usuário é legítimo. Libera a tela!
      setIsAuthValidando(false);
    }
  };

  // ==========================================
  // 🔐 AUTH: Deslogar (Sign Out)
  // ==========================================
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Destruiu a sessão? Redireciona para o login na hora.
      router.replace("/login");
    } catch (error) {
      console.error("❌ Erro ao sair:", error);
      showFeedback("error", "Erro ao encerrar a sessão.");
    }
  };

  // ==========================================
  // 📥 READ: Buscar Leads
  // ==========================================
  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("leads_viagens")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("❌ Falha de Fetching:", error);
      showFeedback("error", "Erro ao buscar leads. Verifique a conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // ➕ CREATE: Criar Lead Manualmente
  // ==========================================
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLead.nome || !newLead.telefone) return;
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("leads_viagens")
        .insert([{
          nome_cliente: newLead.nome,
          telefone: newLead.telefone,
          tenant_id: tenantId,
          status: 'novo',
          historico_chat: [{ role: 'system', content: 'Lead adicionado manualmente via CRM.' }]
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Optimistic UI Update
      setLeads([data, ...leads]);
      setIsModalOpen(false);
      setNewLead({ nome: "", telefone: "" });
      showFeedback("success", "Lead criado com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao criar lead:", error);
      showFeedback("error", "Falha ao criar lead.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // 🔄 UPDATE: Atualizar Status do Lead
  // ==========================================
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      setLeads(leads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead));

      const { error } = await supabase
        .from("leads_viagens")
        .update({ status: newStatus })
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;
      showFeedback("success", "Status atualizado!");
    } catch (error) {
      console.error("❌ Erro ao atualizar status:", error);
      fetchLeads(); 
      showFeedback("error", "Erro ao atualizar status.");
    }
  };

  // ==========================================
  // 🗑️ DELETE: Excluir Lead
  // ==========================================
  const handleDeleteLead = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este lead permanentemente?")) return;

    try {
      setLeads(leads.filter(lead => lead.id !== id));

      const { error } = await supabase
        .from("leads_viagens")
        .delete()
        .eq("id", id)
        .eq("tenant_id", tenantId);

      if (error) throw error;
      showFeedback("success", "Lead excluído com sucesso.");
    } catch (error) {
      console.error("❌ Erro ao deletar lead:", error);
      fetchLeads(); 
      showFeedback("error", "Erro ao deletar lead.");
    }
  };

  // ==========================================
  // 🧩 HELPERS
  // ==========================================
  const showFeedback = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  const formatarData = (dataIso: string) => {
    return new Date(dataIso).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'novo': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'em_atendimento': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'fechado': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'perdido': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  // 🛡️ TELA DE PROTEÇÃO (Mostra um fundo escuro enquanto verifica a chave)
  if (isAuthValidando) {
    return (
      <div className="min-h-screen bg-slate-950 flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 md:p-8 font-sans text-slate-100 selection:bg-indigo-500/30">
      
      {/* Toast de Feedback */}
      {feedback && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in-up">
          <div className={`px-6 py-4 rounded-xl shadow-2xl border backdrop-blur-md flex items-center gap-3 font-semibold ${
            feedback.type === 'success' ? 'bg-emerald-900/80 border-emerald-500 text-emerald-100' : 'bg-red-900/80 border-red-500 text-red-100'
          }`}>
            {feedback.type === 'success' ? '✅' : '❌'} {feedback.msg}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header e Filtros (UI/UX Premium) */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-slate-900/50 p-6 rounded-3xl border border-slate-800 shadow-2xl gap-6 backdrop-blur-xl">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-sm shadow-lg shadow-indigo-500/20">🚀</span>
              CRM Enterprise
            </h1>
            <p className="text-slate-400 mt-2 font-medium">Pipeline de Vendas e Gestão de Leads</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
            {/* Seletor de Tenant (Vamos remover na próxima fase, após o login funcionar) */}
            <select 
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full sm:w-auto bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer font-medium shadow-inner"
            >
              <option value="default-tenant">Agência Carioca Dev</option>
              <option value="imobiliaria-alpha">Imobiliária Alpha</option>
              <option value="clinica-odonto">Clínica Odonto Prime</option>
            </select>

            <div className="bg-slate-800 border border-slate-700 text-slate-300 px-6 py-3 rounded-xl font-bold text-center whitespace-nowrap w-full sm:w-auto shadow-inner">
              <span className="text-indigo-400">{leads.length}</span> Leads
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Novo Lead
            </button>

            {/* Botão de Logout */}
            <button 
              onClick={handleLogout} 
              className="bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-slate-700 hover:border-red-500/50 px-4 py-3 rounded-xl font-bold transition-all w-full sm:w-auto flex items-center justify-center gap-2"
              title="Sair do Sistema"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sair
            </button>
          </div>
        </header>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center gap-3 text-indigo-400 font-bold bg-slate-900/50 px-6 py-4 rounded-2xl border border-slate-800">
              <div className="w-5 h-5 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              Sincronizando Banco de Dados...
            </div>
          </div>
        ) : leads.length === 0 ? (
          /* Empty State */
          <div className="bg-slate-900/50 p-16 rounded-3xl border border-slate-800 text-center flex flex-col items-center justify-center">
            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-4xl mb-6 border border-slate-700 shadow-xl">📭</div>
            <h2 className="text-2xl font-extrabold text-slate-200 mb-2">Seu pipeline está vazio</h2>
            <p className="text-slate-400 max-w-md">Os leads capturados pelo WhatsApp ou Webchat aparecerão aqui automaticamente. Você também pode adicionar um manualmente.</p>
          </div>
        ) : (
          /* Grid de Leads (READ + UPDATE + DELETE) */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {leads.map((lead) => (
              <article key={lead.id} className="bg-slate-900/40 rounded-3xl border border-slate-800 overflow-hidden hover:border-indigo-500/30 transition-all duration-300 shadow-xl hover:shadow-indigo-500/5 flex flex-col group">
                
                {/* Cabeçalho do Card */}
                <div className="p-6 border-b border-slate-800/50 bg-slate-900/50 flex justify-between items-start">
                  <div className="overflow-hidden">
                    <h3 className="font-extrabold text-xl text-slate-100 truncate pr-2 mb-1">{lead.nome_cliente || 'Lead Anônimo'}</h3>
                    <p className="text-slate-400 text-sm font-mono flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                      {lead.telefone}
                    </p>
                  </div>
                  
                  {/* UPDATE: Controle de Status */}
                  <select
                    value={lead.status || 'novo'}
                    onChange={(e) => handleUpdateStatus(lead.id, e.target.value)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-full border cursor-pointer outline-none transition-colors appearance-none ${getStatusColor(lead.status || 'novo')}`}
                  >
                    <option value="novo" className="bg-slate-900 text-slate-100">🔥 Novo</option>
                    <option value="em_atendimento" className="bg-slate-900 text-slate-100">💬 Em Atendimento</option>
                    <option value="fechado" className="bg-slate-900 text-slate-100">💰 Fechado</option>
                    <option value="perdido" className="bg-slate-900 text-slate-100">🧊 Perdido</option>
                  </select>
                </div>
                
                {/* Corpo do Card (Metadados) */}
                <div className="p-6 flex-1 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                      <span className="text-slate-500 block mb-1">Entrada no funil</span>
                      <span className="text-slate-300">{formatarData(lead.created_at)}</span>
                    </div>
                    <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/50">
                      <span className="text-slate-500 block mb-1">Histórico IA</span>
                      <span className="text-slate-300">{lead.historico_chat ? Math.max(0, lead.historico_chat.length - 1) : 0} interações</span>
                    </div>
                  </div>

                  {/* Ações (WhatsApp + Delete) */}
                  <div className="mt-auto flex gap-3 pt-2">
                    <a 
                      href={`https://wa.me/55${lead.telefone.replace(/\D/g, '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-sm text-center py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                      Atender
                    </a>
                    
                    {/* DELETE: Botão Excluir */}
                    <button 
                      onClick={() => handleDeleteLead(lead.id)}
                      className="bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 p-3 rounded-xl transition-all border border-slate-700 hover:border-red-500/50 group-hover:opacity-100 xl:opacity-50"
                      title="Excluir Lead"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* CREATE: Modal de Adicionar Lead */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in-up">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl w-full max-w-md relative">
            
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <h2 className="text-2xl font-extrabold text-white mb-2">Novo Lead</h2>
            <p className="text-slate-400 text-sm mb-6">Adicione um contato manualmente no pipeline da empresa atual.</p>

            <form onSubmit={handleCreateLead} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Nome do Cliente</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: João Silva"
                  value={newLead.nome}
                  onChange={(e) => setNewLead({...newLead, nome: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Telefone (WhatsApp)</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: 5579999999999"
                  value={newLead.telefone}
                  onChange={(e) => setNewLead({...newLead, telefone: e.target.value.replace(/\D/g, '')})}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                />
              </div>

              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-3 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting || !newLead.nome || !newLead.telefone}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : 'Salvar Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}