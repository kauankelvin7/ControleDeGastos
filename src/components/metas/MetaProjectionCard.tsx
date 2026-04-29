"use client";

import { useMemo } from "react";
import { formatBRL } from "@/lib/utils";
import { TrendingUp, Calendar, Clock, AlertCircle } from "lucide-react";
import { addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Meta {
  id: string;
  titulo: string;
  valorAlvo: number;
  valorAtual: number;
}

interface MetaProjectionCardProps {
  meta: Meta;
  avgAporteMensal: number;
}

export function MetaProjectionCard({ meta, avgAporteMensal }: MetaProjectionCardProps) {
  const valorRestante = Math.max(meta.valorAlvo - (meta.valorAtual || 0), 0);
  const isAtingida = valorRestante <= 0;

  // Função utilitária de projeção
  const projetar = (aporte: number) => {
    if (isAtingida) return { meses: 0, label: "Concluída!" };
    if (aporte <= 0) return { meses: Infinity, label: "Pendente" };
    const meses = Math.ceil(valorRestante / aporte);
    return { meses, label: meses > 120 ? "> 10 anos" : `${meses} meses` };
  };

  const projAtual = useMemo(() => projetar(avgAporteMensal), [valorRestante, avgAporteMensal]);
  const dataEstimada = projAtual.meses !== Infinity && !isAtingida 
    ? format(addMonths(new Date(), projAtual.meses), "MMM / yyyy", { locale: ptBR }) 
    : null;

  if (isAtingida) return null;

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-700 bg-white/[0.01]">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-6">
        {/* Painel de Tempo */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
            <TrendingUp size={12} className="text-orange-500/50" />
            Análise de Projeção
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                <Clock size={10} />
                Estimativa
              </div>
              <div className="text-lg font-bold text-white tracking-tight">{projAtual.label}</div>
            </div>
            {dataEstimada && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  <Calendar size={10} />
                  Previsão
                </div>
                <div className="text-lg font-bold text-white/60 capitalize">{dataEstimada}</div>
              </div>
            )}
          </div>
        </div>

        {/* Cenários Rápidos */}
        <div className="w-full sm:w-48 space-y-3">
          <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">Cenários (+Aporte)</div>
          <div className="space-y-2">
            <ScenarioMiniRow 
              label="+20%" 
              value={projetar(avgAporteMensal * 1.2).label} 
              color="text-orange-400"
            />
            <ScenarioMiniRow 
              label="+50%" 
              value={projetar(avgAporteMensal * 1.5).label} 
              color="text-emerald-400"
            />
          </div>
        </div>
      </div>

      {/* Disclaimer sutil */}
      <div className="flex items-center gap-2 pt-4 border-t border-white/5 opacity-30 group-hover:opacity-60 transition-opacity">
        <AlertCircle size={10} />
        <span className="text-[9px] font-bold uppercase tracking-widest">Projeção baseada no ritmo atual de {formatBRL(avgAporteMensal)}/mês</span>
      </div>
    </div>
  );
}

function ScenarioMiniRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex justify-between items-center px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5">
      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest">{label}</span>
      <span className={`text-[10px] font-mono font-bold ${color}`}>{value}</span>
    </div>
  );
}
