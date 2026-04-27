"use client";

import { useAportes, useGastos } from "@/hooks/useFirebaseData";
import { formatBRL } from "@/lib/utils";
import { TrendingUp, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import Link from "next/link";
import PatrimonioChart from "@/components/dashboard/PatrimonioChart";

export default function DashboardPage() {
  const { data: aportes, isLoading: loadingAportes } = useAportes();
  const { data: gastos, isLoading: loadingGastos } = useGastos();

  const totalInvestido = aportes?.reduce((acc: number, cur: any) => acc + (cur.valorTotal || 0), 0) || 0;
  const gastosMes = gastos?.reduce((acc: number, cur: any) => acc + (cur.valor || 0), 0) || 0;

  if (loadingAportes || loadingGastos) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full shadow-[0_0_15px_var(--orange-dim)]"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="font-display font-bold text-3xl text-text-primary tracking-tight drop-shadow-md">
          Visão Geral
        </h1>
        <p className="text-text-muted mt-1">Acompanhe a evolução do seu patrimônio.</p>
      </header>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        
        {/* Card: Patrimônio Investido */}
        <div className="group bg-[linear-gradient(145deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:border-white/10 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-3 text-text-secondary mb-3">
            <TrendingUp size={20} className="text-brand-orange transition-transform group-hover:scale-110" />
            <span className="font-display text-sm font-medium tracking-wide uppercase">Patrimônio Investido</span>
          </div>
          <div className="font-mono font-bold text-3xl text-text-primary drop-shadow-sm">
            {formatBRL(totalInvestido)}
          </div>
        </div>

        {/* Card: Gastos do Mês */}
        <div className="group bg-[linear-gradient(135deg,rgba(248,113,113,0.03)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all duration-300 hover:border-danger/20 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(248,113,113,0.05),inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-center gap-3 text-text-secondary mb-3">
            <ArrowDownCircle size={20} className="text-danger transition-transform group-hover:scale-110" />
            <span className="font-display text-sm font-medium tracking-wide uppercase">Gastos do Mês</span>
          </div>
          <div className="font-mono font-bold text-3xl text-danger drop-shadow-[0_0_12px_rgba(248,113,113,0.3)]">
            {formatBRL(gastosMes)}
          </div>
        </div>

        {/* Card: Renda Mensal Gerada (Glow) */}
        <div className="group bg-[linear-gradient(135deg,rgba(229,89,29,0.1)_0%,rgba(0,0,0,0.4)_100%)] backdrop-blur-2xl border border-brand-orange/30 rounded-2xl p-6 shadow-[0_12px_48px_rgba(229,89,29,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/50 hover:shadow-[0_16px_56px_rgba(229,89,29,0.25),inset_0_1px_0_rgba(255,255,255,0.15)]">
          <div className="absolute -right-4 -top-4 text-brand-orange/10 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
            <ArrowUpCircle size={120} strokeWidth={1} />
          </div>
          <div className="relative z-10">
            <div className="text-brand-orange font-display text-sm font-medium mb-1 tracking-wide uppercase">Renda Mensal Gerada</div>
            <div className="font-mono font-bold text-3xl text-brand-orange drop-shadow-[0_0_16px_rgba(229,89,29,0.4)]">
              {formatBRL(0)} <span className="text-sm font-display text-brand-orange/60 font-medium">/mês</span>
            </div>
          </div>
        </div>
      </div>

      {/* Área de Gráficos e Lançamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Gráfico */}
        <PatrimonioChart aportes={aportes || []} />

        {/* Últimos Lançamentos */}
        <div className="bg-[linear-gradient(145deg,rgba(255,255,255,0.02)_0%,transparent_100%)] backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-300 hover:border-white/10">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display font-bold text-text-primary">Últimos Lançamentos</h3>
            <Link href="/investimentos" className="text-xs font-semibold text-brand-orange hover:text-brand-orange/80 transition-colors drop-shadow-sm">
              Ver todos
            </Link>
          </div>
          
          <div className="space-y-3">
            {aportes?.slice(0, 4).map((aporte: any) => (
              <div key={aporte.id} className="group/item flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 transition-all duration-200 hover:bg-white/[0.04] hover:border-white/10 hover:-translate-y-[2px] hover:shadow-md cursor-pointer">
                <div>
                  <div className="font-mono font-bold text-sm text-text-primary tracking-wide">{aporte.ativo?.toUpperCase() || "ATIVO"}</div>
                  <div className="font-display text-[11px] text-text-muted mt-0.5">{new Date(aporte.data).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-bold text-sm text-brand-orange drop-shadow-sm">{formatBRL(aporte.valorTotal || 0)}</div>
                  <div className="font-display text-[11px] text-text-muted mt-0.5 uppercase tracking-wider">{aporte.tipo === 'compra' ? 'Compra' : 'Venda'}</div>
                </div>
              </div>
            ))}
            {(!aportes || aportes.length === 0) && (
              <div className="text-center py-8 text-sm text-text-muted flex flex-col items-center gap-2 opacity-60">
                <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <span className="text-lg">∅</span>
                </div>
                Nenhum lançamento encontrado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}