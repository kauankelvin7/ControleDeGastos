"use client";

import { useState } from "react";
import { Sparkles, BrainCircuit, RefreshCw } from "lucide-react";
import { gerarInsightFinanceiro } from "@/actions/grok";

// Componentes Modularizados
import { useRelatorioMetrics } from "./hooks/useRelatorioMetrics";
import { StatsPanel } from "./components/StatsPanel";
import { AIResultPanel } from "./components/AIResultPanel";

export default function RelatorioPage() {
  const { metrics, isLoading: loadingData } = useRelatorioMetrics();
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const gerarInsight = async () => {
    setLoadingAI(true);
    setAiError(null);

    try {
      const response = await gerarInsightFinanceiro({
        patrimonio: metrics.patrimonio,
        totalInvestido: metrics.totalInvestido,
        dividendos: 0,
        dyPM: 0,
        gastos: metrics.totalGastos,
        reserva: metrics.totalReserva,
        reservaMeta: metrics.reservaMeta,
        aporteMedioMensal: metrics.aporteMedioMensal,
        ritmoReserva: metrics.ritmoReserva,
        tickers: metrics.tickers,
        historicoAportes: metrics.historicoAportes,
      });

      if (!response.success) throw new Error(response.error);
      setInsight(response.data ?? null);
    } catch (err: any) {
      setAiError(err.message || "Erro desconhecido ao gerar análise.");
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 pb-20">
      {/* Header */}
      <header className="mb-12 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white/95 flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1.25rem] bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.1)]">
              <Sparkles className="text-purple-500" size={28} />
            </div>
            Relatório de IA
          </h1>
          <p className="text-sm font-medium text-white/40 mt-3 max-w-xl leading-relaxed ml-1">
            Sua vida financeira analisada por inteligência artificial para insights estratégicos.
          </p>
        </div>

        <button
          onClick={gerarInsight}
          disabled={loadingAI || loadingData}
          className="relative group overflow-hidden bg-white text-black px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-500 hover:shadow-[0_12px_32px_rgba(255,255,255,0.15)] hover:-translate-y-1 active:scale-95 disabled:opacity-40"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-indigo-500 opacity-0 group-hover:opacity-10 transition-opacity" />
          <span className="relative z-10 flex items-center gap-3">
            {loadingAI ? (
              <>
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                Processando...
              </>
            ) : insight ? (
              <>
                <RefreshCw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
                Regenerar
              </>
            ) : (
              <>
                <BrainCircuit size={20} className="group-hover:rotate-12 transition-transform" />
                Gerar Insight
              </>
            )}
          </span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <StatsPanel metrics={metrics} isLoading={loadingData} />
        <AIResultPanel 
          insight={insight} 
          loading={loadingAI} 
          error={aiError} 
          onRetry={gerarInsight} 
        />
      </div>
    </div>
  );
}