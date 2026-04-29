"use client";

import { useMemo, useState } from "react";
import { useGastos, useReceitas } from "@/hooks/useFirebaseData";
import { formatBRL } from "@/lib/utils";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  PieChart,
  History
} from "lucide-react";
import { Receita } from "@/types/receita";

// ─── types ────────────────────────────────────────────────────────────────────

interface GastoLocal {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  mesKey: string;
}

// ─── constants ────────────────────────────────────────────────────────────────

const TODAY = new Date().toISOString().split("T")[0];
const CURRENT_MONTH = TODAY.substring(0, 7);

// ─── helpers ──────────────────────────────────────────────────────────────────

function getMonthLabel(mesKey: string) {
  const [year, month] = mesKey.split("-");
  return new Date(Number(year), Number(month) - 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function shiftMonth(mesKey: string, delta: number) {
  const [year, month] = mesKey.split("-").map(Number);
  const date = new Date(year, month - 1 + delta, 1);
  return date.toISOString().substring(0, 7);
}

// ─── sub-components ───────────────────────────────────────────────────────────

interface SummaryCardProps {
  title: string;
  value: number;
  icon: any;
  colorClass: string;
  badge?: string;
  index: number;
}

function SummaryCard({ title, value, icon: Icon, colorClass, badge, index }: SummaryCardProps) {
  return (
    <div 
      style={{ animationDelay: `${index * 100}ms` }}
      className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 shadow-2xl transition-all duration-500 hover:bg-white/[0.03] hover:border-white/10 hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em]">
          {title}
        </span>
        <div className={`w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center ${colorClass} shadow-inner`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className={`font-mono font-bold text-3xl tracking-tighter drop-shadow-sm ${colorClass}`}>
          {formatBRL(value)}
        </div>
        {badge && (
          <div className="flex items-center gap-2 mt-2">
             <div className={`w-1.5 h-1.5 rounded-full ${colorClass} animate-pulse`} />
             <span className={`text-[10px] font-bold uppercase tracking-widest text-white/40`}>
                {badge}
             </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function ComparacaoPage() {
  const [selectedMonth, setSelectedMonth] = useState(CURRENT_MONTH);

  const { data: allGastos, isLoading: loadingGastos, isError: errorGastos } = useGastos();
  const { data: allReceitas, isLoading: loadingReceitas, isError: errorReceitas } = useReceitas();

  const isLoading = loadingGastos || loadingReceitas;
  const isError = errorGastos || errorReceitas;

  const stats = useMemo(() => {
    if (!allGastos || !allReceitas) return null;

    const gastos = (allGastos as GastoLocal[]).filter(g => g.mesKey === selectedMonth);
    const receitas = (allReceitas as Receita[]).filter(r => r.mesKey === selectedMonth);

    const totalGastos = gastos.reduce((acc, g) => acc + (g.valor ?? 0), 0);
    const totalReceitas = receitas.reduce((acc, r) => acc + (r.valor ?? 0), 0);
    const saldo = totalReceitas - totalGastos;

    const percentComprometido = totalReceitas > 0 ? (totalGastos / totalReceitas) * 100 : totalGastos > 0 ? 100 : 0;

    const gastosPorCategoria = gastos.reduce((acc, g) => {
      acc[g.categoria] = (acc[g.categoria] || 0) + (g.valor ?? 0);
      return acc;
    }, {} as Record<string, number>);

    const breakdownGastos = Object.entries(gastosPorCategoria)
      .map(([name, value]) => ({ name, value, percent: totalGastos > 0 ? (value / totalGastos) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);

    const receitasPorCategoria = receitas.reduce((acc, r) => {
      acc[r.categoria] = (acc[r.categoria] || 0) + (r.valor ?? 0);
      return acc;
    }, {} as Record<string, number>);

    const breakdownReceitas = Object.entries(receitasPorCategoria)
      .map(([name, value]) => ({ name, value, percent: totalReceitas > 0 ? (value / totalReceitas) * 100 : 0 }))
      .sort((a, b) => b.value - a.value);

    const historico = [];
    for (let i = 0; i < 6; i++) {
      const mes = shiftMonth(CURRENT_MONTH, -i);
      const mGastos = (allGastos as GastoLocal[]).filter(g => g.mesKey === mes).reduce((acc, g) => acc + (g.valor ?? 0), 0);
      const mReceitas = (allReceitas as Receita[]).filter(r => r.mesKey === mes).reduce((acc, r) => acc + (r.valor ?? 0), 0);
      historico.push({
        mesKey: mes,
        label: getMonthLabel(mes),
        gastos: mGastos,
        receitas: mReceitas,
        saldo: mReceitas - mGastos
      });
    }

    return {
      totalGastos,
      totalReceitas,
      saldo,
      percentComprometido,
      breakdownGastos,
      breakdownReceitas,
      historico
    };
  }, [allGastos, allReceitas, selectedMonth]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4" aria-label="Carregando">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-center animate-pulse">
           <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin shadow-[0_0_20px_rgba(249,115,22,0.1)]" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Analisando Dados</span>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6 animate-in fade-in duration-700">
        <div className="w-20 h-20 rounded-3xl bg-red-500/5 border border-red-500/10 flex items-center justify-center shadow-inner">
          <AlertCircle size={40} className="text-red-400/40" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-white/30">Erro ao processar comparação financeira.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 space-y-10 pb-20">
      
      {/* Header with Nav */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 px-2">
        <div>
          <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white/95 flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1.25rem] bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
              <BarChart3 className="text-orange-500" size={28} />
            </div>
            Receitas vs Gastos
          </h1>
          <p className="text-sm font-medium text-white/40 mt-3 max-w-xl leading-relaxed ml-1">
            Análise comparativa do seu fluxo de caixa mensal e histórico de 6 meses.
          </p>
        </div>

        {/* Month Selector Premium */}
        <div className="flex items-center bg-white/[0.02] border border-white/5 rounded-2xl p-1.5 backdrop-blur-3xl shadow-xl self-start md:self-auto">
          <button
            onClick={() => setSelectedMonth(shiftMonth(selectedMonth, -1))}
            className="p-3 hover:bg-white/[0.04] rounded-xl text-white/20 hover:text-white transition-all group"
          >
            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <span className="px-6 font-mono font-bold text-sm min-w-[180px] text-center capitalize text-white tracking-widest">
            {getMonthLabel(selectedMonth)}
          </span>
          <button
            onClick={() => setSelectedMonth(shiftMonth(selectedMonth, 1))}
            className="p-3 hover:bg-white/[0.04] rounded-xl text-white/20 hover:text-white transition-all group"
          >
            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </header>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        <SummaryCard
          index={0}
          title="Total Receitas"
          value={stats.totalReceitas}
          icon={TrendingUp}
          colorClass="text-emerald-400"
        />
        <SummaryCard
          index={1}
          title="Total Gastos"
          value={stats.totalGastos}
          icon={TrendingDown}
          colorClass="text-red-400"
        />
        <SummaryCard
          index={2}
          title="Saldo do Mês"
          value={stats.saldo}
          icon={Wallet}
          colorClass={stats.saldo >= 0 ? "text-emerald-400" : "text-red-400"}
          badge={stats.saldo >= 0 ? "Superávit" : "Déficit"}
        />
      </div>

      {/* Progress Bar Section (Income Commitment) */}
      <div className="bg-[#0a0a0a] bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div>
               <h2 className="text-xl font-bold text-white tracking-tight">Comprometimento da Renda</h2>
               <p className="text-xs font-medium text-white/20 mt-1 uppercase tracking-widest">Quanto você gasta do que ganha</p>
            </div>
            <div className={`font-mono text-3xl font-bold tracking-tighter ${stats.percentComprometido > 100 ? "text-red-400" : "text-orange-400"}`}>
              {stats.percentComprometido.toFixed(1)}%
            </div>
          </div>
          
          <div className="relative h-4 bg-white/[0.02] border border-white/5 rounded-full overflow-hidden shadow-inner backdrop-blur-sm">
            <div
              className={`h-full transition-all duration-1000 ease-out relative ${
                stats.percentComprometido > 100 ? "bg-red-500" : "bg-gradient-to-r from-emerald-500 to-orange-400"
              }`}
              style={{ width: `${Math.min(stats.percentComprometido, 100)}%` }}
            >
               <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-30" />
            </div>
            {stats.percentComprometido > 100 && (
              <div 
                className="absolute top-0 right-0 h-full bg-red-600 animate-pulse opacity-50"
                style={{ width: `${Math.min(stats.percentComprometido - 100, 100)}%` }}
              />
            )}
          </div>
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 mt-4">
             <AlertCircle size={18} className={stats.percentComprometido > 100 ? "text-red-400" : "text-white/20"} />
             <p className="text-xs font-medium text-white/40 leading-relaxed">
              {stats.percentComprometido > 100 
                ? "Atenção crítica: Seus gastos ultrapassaram sua receita. O patrimônio está sendo consumido para manter o estilo de vida." 
                : stats.percentComprometido > 70 
                ? "Seus gastos estão elevados em relação à sua renda. Considere revisar categorias não essenciais." 
                : "Seu comprometimento está em um nível saudável. Você está economizando uma boa parte da sua renda."}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Breakdown Gastos Card */}
        <div className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 lg:p-10 shadow-xl overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white tracking-tight mb-8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
                 <TrendingDown size={20} />
              </div>
              Gastos por Categoria
            </h2>
            <div className="space-y-6">
              {stats.breakdownGastos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 opacity-10">
                   <PieChart size={40} />
                   <p className="text-xs font-bold uppercase tracking-widest">Sem registros</p>
                </div>
              ) : (
                stats.breakdownGastos.map(cat => (
                  <div key={cat.name} className="space-y-2 group">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-white/60 tracking-tight group-hover:text-white transition-colors">{cat.name}</span>
                      <span className="text-sm font-mono font-bold text-white/40">{formatBRL(cat.value)}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.02] border border-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500/40 rounded-full transition-all duration-1000 group-hover:bg-red-500/60"
                        style={{ width: `${cat.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Breakdown Receitas Card */}
        <div className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] p-8 lg:p-10 shadow-xl overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-white tracking-tight mb-8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                 <TrendingUp size={20} />
              </div>
              Receitas por Categoria
            </h2>
            <div className="space-y-6">
              {stats.breakdownReceitas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 opacity-10">
                   <PieChart size={40} />
                   <p className="text-xs font-bold uppercase tracking-widest">Sem registros</p>
                </div>
              ) : (
                stats.breakdownReceitas.map(cat => (
                  <div key={cat.name} className="space-y-2 group">
                    <div className="flex justify-between items-end">
                      <span className="text-sm font-bold text-white/60 tracking-tight group-hover:text-white transition-colors">{cat.name}</span>
                      <span className="text-sm font-mono font-bold text-white/40">{formatBRL(cat.value)}</span>
                    </div>
                    <div className="h-1.5 bg-white/[0.02] border border-white/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500/40 rounded-full transition-all duration-1000 group-hover:bg-emerald-500/60"
                        style={{ width: `${cat.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Histórico 6 Meses Modernized */}
      <div className="bg-white/[0.01] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center gap-4">
           <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-white/20">
              <History size={20} />
           </div>
           <h2 className="text-xl font-bold text-white tracking-tight">Histórico de Fluxo</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left" role="table">
            <thead>
              <tr className="bg-white/[0.01] text-[10px] uppercase tracking-widest font-bold text-white/20">
                <th className="px-8 py-5">Mês de Referência</th>
                <th className="px-8 py-5 text-right">Receitas Total</th>
                <th className="px-8 py-5 text-right">Gastos Total</th>
                <th className="px-8 py-5 text-right">Saldo Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stats.historico.map(row => (
                <tr key={row.mesKey} className="hover:bg-white/[0.02] transition-all duration-300 group">
                  <td className="px-8 py-6 text-sm font-bold text-white/60 capitalize group-hover:text-white transition-colors">{row.label}</td>
                  <td className="px-8 py-6 text-right text-sm font-mono font-bold text-emerald-400/80 group-hover:text-emerald-400 transition-colors">+{formatBRL(row.receitas)}</td>
                  <td className="px-8 py-6 text-right text-sm font-mono font-bold text-red-400/80 group-hover:text-red-400 transition-colors">-{formatBRL(row.gastos)}</td>
                  <td className={`px-8 py-6 text-right text-sm font-mono font-bold tracking-tighter ${row.saldo >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                    <div className="inline-flex items-center gap-2">
                       {row.saldo >= 0 ? <TrendingUp size={14} className="opacity-40" /> : <TrendingDown size={14} className="opacity-40" />}
                       {row.saldo >= 0 ? "+" : ""}{formatBRL(row.saldo)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
