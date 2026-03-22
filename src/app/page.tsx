import Link from "next/link";
import { Metadata } from "next";

// 🧠 SUPERPODER SEO: Metadados dinâmicos para indexação no Google
export const metadata: Metadata = {
  title: "Carioca Dev | Agentes de IA e Automação Omnichannel",
  description: "Captação e qualificação automática de leads com Inteligência Artificial, roteamento humano e CRM integrado. Transforme seu atendimento em uma máquina de vendas.",
  keywords: ["SaaS", "Inteligência Artificial", "CRM", "Automação de WhatsApp", "Chatbot", "Tech Lead", "Enterprise"],
};

// 📦 DATA MAPPING (CMS/Multi-tenant Ready)
// Extraímos os dados estáticos. No futuro, você pode trocar isso por uma chamada ao Supabase.
const FEATURES_DATA = [
  { id: 1, icon: "⚡", title: "IA de Alta Performance", desc: "Respostas em milissegundos utilizando o motor Llama 3.1 otimizado para conversão extrema." },
  { id: 2, icon: "📊", title: "CRM Integrado", desc: "Todos os leads centralizados em um único painel com histórico completo e auditoria." },
  { id: 3, icon: "🔒", title: "Multi-Tenant Seguro", desc: "Isolamento total de dados entre clientes com bloqueio em nível de linha (RLS)." }
];

const STEPS_DATA = [
  { id: "01", title: "Crie seu Agente", desc: "Configure prompts avançados, regras de negócio e injeção de contexto corporativo." },
  { id: "02", title: "Conecte os Canais", desc: "Distribuição Omnichannel via WhatsApp, Chat Web ou integração via API REST pura." },
  { id: "03", title: "Receba Leads Quentes", desc: "O Agente atua como SDR, qualifica a dor, agenda reuniões e faz o transbordo humano." }
];

const HIGHLIGHTS_DATA = [
  { id: 1, title: "Qualificação Automática (SDR)", desc: "A IA identifica a intenção de compra e avança leads baseados em critérios técnicos." },
  { id: 2, title: "Human Handoff (Transbordo)", desc: "Alerta em tempo real para a sua equipe assumir o controle no ápice do fechamento." },
  { id: 3, title: "SSOT (Fonte Única de Verdade)", desc: "Todas as regras do bot são geridas no banco, refletindo nos canais instantaneamente." },
  { id: 4, title: "Arquitetura Escalável Edge", desc: "Infraestrutura Serverless projetada para suportar picos de milhares de conexões." }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500/30">
      
      {/* HERO SECTION */}
      <section className="relative isolate px-6 pt-20 lg:px-8 overflow-hidden min-h-screen flex flex-col justify-center">
        {/* Efeito Glow Enterprise */}
        <div className="absolute inset-x-0 -top-40 -z-10 blur-3xl sm:-top-80 pointer-events-none" aria-hidden="true">
          <div className="mx-auto w-[40rem] h-[40rem] bg-gradient-to-tr from-indigo-600 to-emerald-500 opacity-20 rounded-full animate-pulse" />
        </div>

        <div className="mx-auto max-w-4xl text-center z-10">
          <div className="mb-8 flex justify-center animate-fade-in-up">
            <Link
              href="/admin"
              className="group rounded-full border border-indigo-500/30 px-5 py-1.5 text-sm font-medium text-slate-300 bg-indigo-500/10 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all backdrop-blur-sm flex items-center gap-2"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
              Sistema Omnichannel Enterprise <span className="text-indigo-400 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8">
            <span className="block text-slate-100">Carioca Dev</span>
            <span className="bg-gradient-to-r from-indigo-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent pb-2 block">
              AI Solutions
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Captação SDR automatizada, qualificação inteligente e roteamento omnichannel. Escale o atendimento B2B da sua empresa sem aumentar a folha de pagamento.
          </p>

          <div className="mt-12 flex flex-col sm:flex-row gap-5 justify-center items-center">
            <a
              href="https://wa.me/55SEUNUMERO"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto rounded-xl bg-emerald-600 px-8 py-4 text-base font-bold text-white hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Testar no WhatsApp
            </a>
            <Link
              href="/chat"
              className="w-full sm:w-auto rounded-xl border border-slate-700 bg-slate-900/50 px-8 py-4 text-base font-semibold text-slate-200 hover:bg-slate-800 hover:border-slate-600 transition-all backdrop-blur-sm"
            >
              Ver Agente Web →
            </Link>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS SECTION */}
      <section className="py-32 border-t border-slate-800/50 bg-slate-900/20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <header className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-6 text-slate-100 tracking-tight">
              Automatize o atendimento e multiplique sua conversão
            </h2>
            <p className="text-slate-400 text-lg">
              Arquitetura de software desenhada para capturar leads frios, nutrir em tempo real e depositar contratos na mesa dos seus vendedores.
            </p>
          </header>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES_DATA.map((feat) => (
              <Feature key={feat.id} {...feat} />
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA SECTION */}
      <section className="py-32 border-t border-slate-800/50 relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-20 text-slate-100">
            Pipeline de Operação
          </h2>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Linha conectora (Desktop apenas) */}
            <div className="hidden md:block absolute top-6 left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent -z-10"></div>
            
            {STEPS_DATA.map((step) => (
              <Step key={step.id} {...step} />
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES GRID SECTION */}
      <section className="py-32 border-t border-slate-800/50 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {HIGHLIGHTS_DATA.map((highlight) => (
              <Highlight key={highlight.id} {...highlight} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL SECTION */}
      <section className="py-40 border-t border-slate-800/50 text-center relative overflow-hidden">
        {/* Background CTA Glow */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950"></div>
        
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-8 text-slate-100 tracking-tight">
            Pronto para implementar o seu SaaS B2B?
          </h2>
          <p className="text-slate-400 text-lg mb-12">
            Acesse o CRM, configure o cérebro da sua inteligência artificial e comece a escalar a captação de clientes hoje mesmo.
          </p>
          <Link
            href="/admin"
            className="inline-flex justify-center items-center bg-indigo-600 hover:bg-indigo-500 text-white px-10 py-5 rounded-xl font-bold text-lg shadow-xl shadow-indigo-600/20 hover:-translate-y-1 transition-all"
          >
            Acessar Painel Enterprise <span className="ml-2">→</span>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-slate-800/80 bg-slate-950">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-slate-500 font-medium">
            © {new Date().getFullYear()} Carioca Dev. Desenvolvido em Aracaju/SE.
          </span>
          <div className="flex gap-8 text-sm font-medium">
            <Link href="#" className="text-slate-500 hover:text-indigo-400 transition-colors">Termos de Serviço</Link>
            <Link href="#" className="text-slate-500 hover:text-indigo-400 transition-colors">Política de Privacidade</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

// ==========================================
// COMPONENTES MENORES (UI Components)
// ==========================================

function Feature({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <article className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl hover:border-indigo-500/40 hover:bg-slate-800/50 transition-all duration-300 group">
      <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-3xl mb-6 border border-indigo-500/20 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="font-extrabold text-xl mb-3 text-slate-200">{title}</h3>
      <p className="text-slate-400 leading-relaxed">{desc}</p>
    </article>
  );
}

function Step({ id, title, desc }: { id: string; title: string; desc: string }) {
  return (
    <article className="text-center relative group">
      <div className="w-16 h-16 mx-auto bg-slate-900 border-2 border-slate-700 text-indigo-400 font-mono font-bold text-xl rounded-full flex items-center justify-center mb-6 shadow-lg group-hover:border-indigo-500 group-hover:text-indigo-300 transition-colors relative z-10">
        {id}
      </div>
      <h3 className="font-extrabold text-xl mb-3 text-slate-200">{title}</h3>
      <p className="text-slate-400 leading-relaxed max-w-xs mx-auto">{desc}</p>
    </article>
  );
}

function Highlight({ title, desc }: { title: string; desc: string }) {
  return (
    <article className="bg-slate-900/30 border border-slate-800 p-8 sm:p-10 rounded-3xl hover:bg-slate-800/30 transition-colors">
      <h3 className="font-extrabold text-2xl mb-4 text-emerald-400">{title}</h3>
      <p className="text-slate-400 text-lg leading-relaxed">{desc}</p>
    </article>
  );
}