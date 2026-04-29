import React, { memo } from "react";
import { Meta } from "../types";
import { formatBRL } from "@/lib/utils";
import { Target, Pencil, Trash2, Plus, Flag, Calendar } from "lucide-react";
import { MetaProjectionCard } from "@/components/metas/MetaProjectionCard";

interface MetaCardProps {
  meta: Meta;
  avgAporteMensal: number;
  onEdit: (meta: Meta) => void;
  onDelete: (meta: Meta) => void;
  onAporte: (meta: Meta) => void;
}

export const MetaCard = memo(function MetaCard({ 
  meta, 
  avgAporteMensal, 
  onEdit, 
  onDelete, 
  onAporte 
}: MetaCardProps) {
  const porcentagem = Math.min((meta.valorAtual / meta.valorAlvo) * 100, 100);
  const corHex = meta.cor || "#e5591d";

  return (
    <div className="group relative bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-white/10 shadow-2xl">
      <div className="p-8 space-y-6">
        {/* Header do Card */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110"
              style={{ backgroundColor: `${corHex}10`, borderColor: `${corHex}20`, color: corHex }}
            >
              <Target size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-white/90">{meta.titulo}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">{meta.categoria}</span>
                {meta.prazo && (
                  <div className="flex items-center gap-1 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                    <span className="opacity-50">·</span>
                    <Calendar size={10} />
                    <span>{new Date(meta.prazo).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => onEdit(meta)}
              className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-white/20 hover:text-white hover:bg-white/10 transition-all"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => onDelete(meta)}
              className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Valores */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Atual</span>
            <div className="font-mono text-xl font-bold text-white">{formatBRL(meta.valorAtual)}</div>
          </div>
          <div className="space-y-1 text-right">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Objetivo</span>
            <div className="font-mono text-xl font-bold text-white/40">{formatBRL(meta.valorAlvo)}</div>
          </div>
        </div>

        {/* Progresso Visual */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <span className="font-mono text-2xl font-bold tracking-tighter" style={{ color: corHex }}>
              {porcentagem.toFixed(1)}%
            </span>
            <button
              onClick={() => onAporte(meta)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95"
              style={{ backgroundColor: `${corHex}10`, color: corHex, border: `1px solid ${corHex}20` }}
            >
              <Plus size={14} />
              Aporte
            </button>
          </div>
          <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/5 shadow-inner">
            <div 
              className="h-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(229,89,29,0.2)]"
              style={{ width: `${porcentagem}%`, backgroundColor: corHex }}
            />
          </div>
        </div>
      </div>

      {/* Projeção (Integrada) */}
      <div className="border-t border-white/5">
        <MetaProjectionCard meta={meta} avgAporteMensal={avgAporteMensal} />
      </div>
    </div>
  );
});
