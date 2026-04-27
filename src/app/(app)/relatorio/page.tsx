"use client";

import { useState } from "react";
import { useAportes, useGastos, useReserva } from "@/hooks/useFirebaseData";
import { formatBRL } from "@/lib/utils";
import { Sparkles, BrainCircuit } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function RelatorioPage() {
  const { data: aportes, isLoading: load1 } = useAportes();
  const { data: gastos, isLoading: load2 } = useGastos();
  const { data: reserva, isLoading: load3 } = useReserva();

  const [insight, setInsight] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const totalInvestido = aportes?.reduce((acc: number, cur: any) => acc + (cur.valorTotal || 0), 0) || 0;
  const totalGastos = gastos?.reduce((acc: number, cur: any) => acc + (cur.valor || 0), 0) || 0;
  const totalReserva = reserva?.reduce((acc: number, cur: any) => acc + (cur.valor || 0), 0) || 0;
  
  // Extract unique tickers
  const tickers = Array.from(new Set(aportes?.map((a: any) => a.ativo?.toUpperCase()))).filter(Boolean);

  const gerarInsight = async () => {
    setLoadingAI(true);
    try {
      const dadosMes = {
        patrimonio: (totalInvestido + totalReserva).toFixed(2),
        totalInvestido: totalInvestido.toFixed(2),
        dividendos: "0.00", // MVP
        dyPM: "0.00", // MVP
        gastos: totalGastos.toFixed(2),
        reserva: totalReserva.toFixed(2),
        reservaMeta: "15000.00",
        aportesMedio: totalInvestido > 0 ? (totalInvestido / 1).toFixed(2) : "0",
        tickers: tickers.join(", ") || "Nenhum ativo",
      };

      const res = await fetch("/api/grok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dadosMes }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro na API");
      
      setInsight(data.insight);
    } catch (err: any) {
      console.error(err);
      setInsight(`Houve um problema com a IA: ${err.message}. Verifique sua API Key.`);
    } finally {
      setLoadingAI(false);
    }
  };

  if (load1 || load2 || load3) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full shadow-[0_0_15px_rgba(229,89,29,0.3)]"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
      <header className="mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary flex items-center gap-3 tracking-tight drop-shadow-md">
            <Sparkles className="text-brand-orange drop-shadow-[0_0_8px_rgba(229,89,29,0.5)]" size={32} />
            Relatório de IA
          </h1>
          <p className="text-text-muted mt-2">Sua vida financeira analisada pela Inteligência Artificial do KiNance.</p>
        </div>
        <button
          onClick={gerarInsight}
          disabled={loadingAI}
          className="bg-[linear-gradient(135deg,var(--orange),var(--amber))] hover:shadow-[0_8px_24px_rgba(229,89,29,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] disabled:opacity-50 text-white font-bold py-3.5 px-8 rounded-xl flex items-center gap-2 transition-all duration-300 hover:-translate-y-0.5 active:scale-95 shadow-lg group"
        >
          {loadingAI ? (
            "Analisando..."
          ) : (
            <>
              <BrainCircuit size={20} className="group-hover:rotate-12 transition-transform" /> 
              Gerar Novo Insight
            </>
          )}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Painel de Patrimônio */}
        <div className="bg-[linear-gradient(145deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-xl border border-white/5 rounded-2xl p-7 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="text-text-secondary font-display font-bold text-[10px] uppercase tracking-widest mb-2 opacity-70">Patrimônio Base para Análise</div>
          <div className="font-mono font-bold text-3xl text-text-primary mb-6 tracking-tight drop-shadow-sm">{formatBRL(totalInvestido + totalReserva)}</div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center group">
              <span className="text-text-muted text-sm group-hover:text-text-secondary transition-colors">Alocado em Ativos</span>
              <span className="font-mono text-text-primary font-medium">{formatBRL(totalInvestido)}</span>
            </div>
            <div className="flex justify-between items-center group">
              <span className="text-text-muted text-sm group-hover:text-text-secondary transition-colors">Reserva Protegida</span>
              <span className="font-mono text-text-primary font-medium">{formatBRL(totalReserva)}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-white/5 group">
              <span className="text-text-muted text-sm group-hover:text-text-secondary transition-colors">Gastos Registrados</span>
              <span className="font-mono text-danger font-bold drop-shadow-[0_0_10px_rgba(248,113,113,0.2)]">-{formatBRL(totalGastos)}</span>
            </div>
          </div>
        </div>

        {/* Painel de Insight IA */}
        <div className={`relative min-h-[280px] flex flex-col justify-center rounded-2xl p-7 transition-all duration-500 overflow-hidden border ${
          insight 
          ? "bg-[linear-gradient(145deg,rgba(124,58,237,0.05)_0%,rgba(255,255,255,0.01)_100%)] border-purple-500/20 shadow-[0_12px_48px_rgba(124,58,237,0.1),inset_0_1px_0_rgba(255,255,255,0.05)]" 
          : "bg-white/[0.02] border-white/5 border-dashed backdrop-blur-md"
        }`}>
          {/* Decoração sutil de IA */}
          <div className="absolute -right-8 -bottom-8 text-purple-500/5 rotate-12">
            <BrainCircuit size={160} strokeWidth={1} />
          </div>

          {insight ? (
            <div className="relative z-10">
               <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">Análise Grok-AI</span>
               </div>
               <div className="prose prose-invert prose-sm max-w-none text-text-primary font-display leading-relaxed prose-p:mb-3 prose-strong:text-brand-orange prose-strong:font-bold">
                  <ReactMarkdown>{insight}</ReactMarkdown>
               </div>
            </div>
          ) : (
            <div className="text-center py-8 relative z-10">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
                <BrainCircuit size={32} className="text-text-disabled opacity-40" />
              </div>
              <p className="text-text-muted text-sm max-w-[240px] mx-auto leading-relaxed">Clique em <strong className="text-text-secondary">"Gerar Novo Insight"</strong> para receber uma análise personalizada do seu comportamento financeiro.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}