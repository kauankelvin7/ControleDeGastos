import { Bot, BrainCircuit, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AIResultPanelProps {
  insight: string | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export function AIResultPanel({ insight, loading, error, onRetry }: AIResultPanelProps) {
  return (
    <div className="lg:col-span-7">
      <div
        className={`relative min-h-[500px] flex flex-col rounded-[2.5rem] p-8 lg:p-12 transition-all duration-1000 overflow-hidden border shadow-2xl ${
          insight
            ? "bg-[#0a0a0a] bg-gradient-to-br from-purple-500/[0.05] to-transparent border-purple-500/20"
            : "bg-white/[0.01] border-white/5 border-dashed backdrop-blur-md"
        }`}
      >
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "30px 30px" }}
        />

        {loading && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-[1.75rem] bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-400 rounded-full animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-bold text-white/60 tracking-wide">Processando seus dados...</p>
              <p className="text-xs text-white/25 font-mono">Isso pode levar alguns segundos</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 relative z-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <AlertCircle size={28} className="text-red-400" />
            </div>
            <p className="text-sm font-medium text-white/50 max-w-[280px] leading-relaxed">{error}</p>
            <button onClick={onRetry} className="text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors uppercase tracking-widest">
              Tentar novamente
            </button>
          </div>
        )}

        {!loading && !error && insight && (
          <div className="relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-500/10">
                <Bot size={20} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">AI Financial Strategic Analysis</span>
                <div className="text-[10px] text-white/20 font-bold uppercase tracking-widest mt-0.5">Gerado agora</div>
              </div>
            </div>

            <div className="prose prose-invert prose-purple max-w-none
              prose-h3:text-white prose-h3:tracking-tight prose-h3:mt-10 prose-h3:mb-4 prose-h3:text-xl prose-h3:font-bold
              prose-p:text-white/70 prose-p:leading-relaxed prose-p:text-base prose-p:mb-6 prose-p:font-medium
              prose-strong:text-white prose-strong:font-bold
              prose-li:text-white/70 prose-li:mb-3 prose-li:text-base
              prose-hr:border-white/5 prose-hr:my-10
              prose-code:text-purple-400 prose-code:bg-purple-500/10 prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-sm"
            >
              <ReactMarkdown>{insight}</ReactMarkdown>
            </div>
          </div>
        )}

        {!loading && !error && !insight && (
          <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 py-12">
            <div className="w-24 h-24 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8 shadow-inner group">
              <BrainCircuit size={48} className="text-white/10 group-hover:scale-110 group-hover:text-purple-500/40 transition-all duration-700" strokeWidth={1} />
            </div>
            <h3 className="text-xl font-bold text-white/60 tracking-tight mb-3">Aguardando Comando</h3>
            <p className="text-sm font-medium text-white/30 max-w-[280px] leading-relaxed">
              Clique em <span className="text-white/50 font-bold">Gerar Insight</span> para a IA processar seus dados financeiros reais.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
