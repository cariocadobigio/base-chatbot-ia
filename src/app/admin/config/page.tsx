"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
// Ajuste o caminho da sua lib do Supabase conforme a estrutura da sua pasta
import { supabase } from "../../../lib/supabase"; 

export default function AdminConfig() {
  // States de Gerenciamento do Formulário e do Inquilino
  const [tenantId, setTenantId] = useState("default-tenant");
  const [configId, setConfigId] = useState<string | null>(null);
  const [conteudo, setConteudo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // Data Fetching Dinâmico: Dispara toda vez que você troca de Inquilino no Select
  useEffect(() => {
    fetchConfig();
  }, [tenantId]);

  const fetchConfig = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      const { data, error } = await supabase
        .from("conhecimento_empresa")
        .select("id, conteudo")
        .eq("tenant_id", tenantId)
        .eq("ativo", true)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error; // PGRST116 é o erro de "Nenhuma linha encontrada", o que é normal para novos clientes
      }

      if (data) {
        setConfigId(data.id);
        setConteudo(data.conteudo);
      } else {
        setConfigId(null);
        setConteudo(""); // Limpa o formulário se o cliente for novo e não tiver cérebro ainda
      }
    } catch (error) {
      console.error("❌ Erro ao buscar cérebro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conteudo.trim()) return;
    
    setIsSaving(true);
    setFeedback(null);

    try {
      if (configId) {
        // Operação de UPDATE (Se o cérebro já existe)
        const { error } = await supabase
          .from("conhecimento_empresa")
          .update({ conteudo })
          .eq("id", configId);
        
        if (error) throw error;
      } else {
        // Operação de INSERT (Se for o primeiro cérebro desse Inquilino)
        const { data, error } = await supabase
          .from("conhecimento_empresa")
          .insert([{ conteudo, tenant_id: tenantId, ativo: true }])
          .select("id")
          .single();
          
        if (error) throw error;
        if (data) setConfigId(data.id);
      }
      setFeedback({ type: 'success', msg: '🧠 Cérebro da IA atualizado e sincronizado com sucesso!' });
    } catch (error: any) {
      console.error("❌ Erro de Mutação:", error);
      setFeedback({ type: 'error', msg: 'Falha de permissão no Supabase (Verifique o RLS para UPDATE/INSERT).' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 p-8 font-sans text-slate-100">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Enterprise */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Cérebro da IA</h1>
            <p className="text-slate-400 mt-1">Injeção de Contexto e Prompt Engineering B2B</p>
          </div>
          <Link 
            href="/admin"
            className="bg-slate-900 border border-slate-700 hover:border-indigo-500 text-slate-300 px-5 py-2.5 rounded-xl font-medium transition-all"
          >
            ← Voltar ao CRM
          </Link>
        </header>

        {/* Painel de Configuração */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
          
          {/* Seletor de Tenant (Prova do Multi-Tenant) */}
          <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="w-full sm:w-auto flex-1">
              <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">
                🏢 Selecione a Empresa (Inquilino)
              </label>
              <select 
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer font-medium"
              >
                <option value="default-tenant">Sua Agência (Carioca Dev)</option>
                <option value="imobiliaria-alpha">Cliente 1: Imobiliária Alpha</option>
                <option value="clinica-odonto">Cliente 2: Clínica Odonto Prime</option>
              </select>
            </div>
            {isLoading && (
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-medium animate-pulse">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                Carregando cérebro...
              </div>
            )}
          </div>

          {/* Formulário de Prompt */}
          <form onSubmit={handleSave} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-400 mb-2">
                Instrução do Sistema (System Prompt)
              </label>
              <textarea
                value={conteudo}
                onChange={(e) => setConteudo(e.target.value)}
                placeholder="Ex: Você é o corretor virtual da Imobiliária Alpha. Seu objetivo é captar o e-mail do cliente..."
                className="w-full h-64 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl p-5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono text-sm leading-relaxed resize-y shadow-inner custom-scrollbar"
                disabled={isLoading}
              />
              <p className="text-xs text-slate-500 mt-2">
                A IA usará esta regra estrita antes de interagir com o Lead. O Link do Cal.com será anexado automaticamente no back-end.
              </p>
            </div>

            {feedback && (
              <div className={`p-4 rounded-xl border ${feedback.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                {feedback.msg}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading || isSaving || !conteudo.trim()}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sincronizando...
                  </>
                ) : (
                  <>💾 Salvar Cérebro Ativo</>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </main>
  );
}