"use client";

import { useMemo } from "react";
import { useAportes, useGastos, useDividendos, useReceitas } from "@/hooks/useFirebaseData";
import { formatBRL } from "@/lib/utils";
import {
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  Package,
  TrendingDown,
  Wallet,
  AlertCircle,
  Plus,
} from "lucide-react";
import Link from "next/link";
import PatrimonioChart from "@/components/dashboard/PatrimonioChart";
import GastosChart from "@/components/dashboard/GastosChart";
import type { Aporte, Gasto, Dividendo } from "@/types/dashboard";
import type { Receita } from "@/types/receita";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// ─── Constants ────────────────────────────────────────────────────────────────

const NOW = new Date();
const TODAY = NOW.toISOString().split("T")[0];
const CURRENT_MONTH_KEY = TODAY.substring(0, 7);
const CURRENT_MONTH = NOW.getMonth();
const CURRENT_YEAR = NOW.getFullYear();

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="rounded-3xl border border-white/5 p-6 bg-white/[0.02] animate-pulse">
      <div className="h-3 w-24 rounded-full bg-white/5 mb-4" />
      <div className="h-8 w-36 rounded-full bg-white/5" />
    </div>
  );
}

function RowSkeleton({ id }: { id: number }) {
  return <div key={id} className="h-16 rounded-xl bg-white/[0.02] animate-pulse" />;
}

// ─── Summary card ─────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  variant?: "default" | "danger" | "brand";
  error?: boolean;
}

function SummaryCard({ label, value, sub, icon, variant = "default", error }: SummaryCardProps) {
  if (error) {
    return (
      <div className="rounded-3xl p-6 flex items-center gap-3 bg-red-500/5 border border-red-500/10">
        <AlertCircle size={18} className="text-red-400" />
        <span className="text-sm font-medium text-red-400">
          Erro ao carregar {label.toLowerCase()}.
        </span>
      </div>
    );
  }

  // Estilização baseada na variante usando Tailwind classes para glassmorphism
  const variantStyles = {
    default: "from-white/[0.03] to-transparent border-white/5 hover:border-white/10",
    danger: "from-red-500/[0.03] to-transparent border-red-500/10 hover:border-red-500/20",
    brand: "from-orange-500/[0.05] to-black/40 border-orange-500/20 hover:border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.05)]",
  };

  const valueColors = {
    default: "text-white",
    danger: "text-red-400",
    brand: "text-orange-400",
  };

  return (
    <div className={`group relative rounded-3xl p-6 overflow-hidden transition-all duration-300 bg-gradient-to-br border ${variantStyles[variant]}`}>
      {/* Decoração de fundo sutil para o card Brand */}
      {variant === "brand" && (
        <div 
          className="absolute -right-6 -top-6 text-orange-500/5 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110"
          aria-hidden
        >
          <ArrowUpCircle size={140} strokeWidth={1} />
        </div>
      )}
      
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <div className="text-white/40 group-hover:text-white/60 transition-colors" aria-hidden>
            {icon}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            {label}
          </span>
        </div>
        <div className={`font-mono font-bold text-3xl leading-none tracking-tight ${valueColors[variant]}`}>
          {value}
        </div>
        {sub && (
          <div className="mt-2 text-xs font-medium text-white/30">
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Aporte row item ──────────────────────────────────────────────────────────

function AporteItem({ aporte }: { aporte: Aporte }) {
  const isVenda = aporte.tipo === "venda";
  const valor = Number(aporte.valorTotal ?? 0);

  return (
    <div className="group/item flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300">
      <div className="flex items-center gap-3.5">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner ${
            isVenda ? "bg-red-500/10 border border-red-500/20" : "bg-emerald-500/10 border border-emerald-500/20"
          }`}
          aria-hidden
        >
          {isVenda ? <ArrowDownCircle size={18} className="text-red-400" /> : <ArrowUpCircle size={18} className="text-emerald-400" />}
        </div>
        <div>
          <div className="font-mono font-bold text-sm tracking-wide text-white/90">
            {(aporte.ativo ?? "ATIVO").toUpperCase()}
          </div>
          <div className="text-[11px] font-medium text-white/40 mt-0.5">
            {new Date(aporte.data).toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' }).replace('.', '')}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className={`font-mono font-bold text-sm ${isVenda ? "text-red-400" : "text-emerald-400"}`}>
          {isVenda ? "-" : "+"}{formatBRL(valor)}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-wider text-white/30 mt-1">
          {aporte.tipo ?? "compra"}
        </div>
      </div>
    </div>
  );
}

// ─── Tooltip customizado do BarChart ──────────────────────────────────────────

interface BarTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const LABEL_MAP: Record<string, string> = {
  receitas: "Receitas",
  gastos: "Gastos",
};

function BarTooltipContent({ active, payload, label }: BarTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[180px] outline outline-1 outline-black/50">
      <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3 pb-2 border-b border-white/10">
        {label}
      </p>
      <div className="space-y-2.5">
        {payload.map((entry) => (
          <div key={entry.name} className="flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full shadow-sm"
                style={{ background: entry.color, boxShadow: `0 0 8px ${entry.color}80` }}
                aria-hidden
              />
              <span className="text-sm text-white/80">{LABEL_MAP[entry.name] ?? entry.name}</span>
            </div>
            <span className="font-mono font-bold text-sm text-white">{formatBRL(entry.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Y-axis formatter ─────────────────────────────────────────────────────────

const formatYAxis = (value: number): string => {
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}k`;
  return `R$ ${value}`;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: aportes,    isLoading: loadingAportes,    isError: errorAportes    } = useAportes();
  const { data: gastos,     isLoading: loadingGastos,     isError: errorGastos     } = useGastos();
  const { data: dividendos, isLoading: loadingDividendos, isError: errorDividendos } = useDividendos();
  const { data: receitas,   isLoading: loadingReceitas,   isError: errorReceitas   } = useReceitas();

  // ── Métricas do mês atual
  const metrics = useMemo(() => {
    const totalAportado =
      (aportes as Aporte[] | undefined)?.reduce((acc, cur) => {
        const v = Number(cur.valorTotal ?? 0);
        return cur.tipo === "venda" ? acc - v : acc + v;
      }, 0) ?? 0;

    const gastosMes =
      (gastos as Gasto[] | undefined)
        ?.filter((g) => g.data.substring(0, 7) === CURRENT_MONTH_KEY)
        .reduce((acc, cur) => acc + Number(cur.valor ?? 0), 0) ?? 0;

    const receitasMes =
      (receitas as Receita[] | undefined)
        ?.filter((r) => r.mesKey === CURRENT_MONTH_KEY)
        .reduce((acc, cur) => acc + Number(cur.valor ?? 0), 0) ?? 0;

    const dividendosMes =
      (dividendos as Dividendo[] | undefined)
        ?.filter((d) => {
          const dt = new Date(d.data);
          return dt.getMonth() === CURRENT_MONTH && dt.getFullYear() === CURRENT_YEAR;
        })
        .reduce((acc, cur) => acc + Number(cur.valorTotal ?? 0), 0) ?? 0;

    const saldoMes = receitasMes - gastosMes;
    const percentComprometidoReal =
      receitasMes > 0 ? (gastosMes / receitasMes) * 100 : gastosMes > 0 ? 100 : 0;
    const percentComprometido = Math.min(percentComprometidoReal, 100);

    return {
      totalAportado,
      gastosMes,
      receitasMes,
      dividendosMes,
      saldoMes,
      percentComprometido,
      percentComprometidoReal,
    };
  }, [aportes, gastos, dividendos, receitas]);

  // ── Histórico 6 meses para BarChart
  const historyData = useMemo(() => {
    if (!receitas || !gastos) return [];

    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(CURRENT_YEAR, CURRENT_MONTH - (5 - i), 1);
      const key = d.toISOString().substring(0, 7);
      const label = d
        .toLocaleDateString("pt-BR", { month: "short" })
        .replace(".", "")
        .replace(/^\w/, (c) => c.toUpperCase());

      const rTotal = (receitas as Receita[])
        .filter((r) => r.mesKey === key)
        .reduce((acc, cur) => acc + cur.valor, 0);

      const gTotal = (gastos as Gasto[])
        .filter((g) => g.data.substring(0, 7) === key)
        .reduce((acc, cur) => acc + cur.valor, 0);

      return { name: label, receitas: rTotal, gastos: gTotal };
    });
  }, [receitas, gastos]);

  // ── Últimos aportes
  const ultimosAportes = useMemo<Aporte[]>(() => {
    if (!aportes?.length) return [];
    return [...(aportes as Aporte[])]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 8);
  }, [aportes]);

  const blockLoading = loadingReceitas || loadingGastos;
  const blockError = errorReceitas || errorGastos;
  const currentMonthLabel = NOW.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  const isDeficit = metrics.saldoMes < 0;
  const hasNoData = metrics.receitasMes === 0 && metrics.gastosMes === 0;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="animate-in fade-in zoom-in-95 duration-500 pb-10">

      {/* Header */}
      <header className="mb-10 mt-4 px-2">
        <h1 className="font-bold text-3xl lg:text-4xl tracking-tight text-white/95 drop-shadow-sm mb-2">
          Visão Geral
        </h1>
        <p className="text-sm font-medium text-white/40">
          Acompanhe a evolução do seu patrimônio e fluxo de caixa.
        </p>
      </header>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {loadingAportes ? <CardSkeleton /> : (
          <SummaryCard
            label="Total Aportado"
            value={formatBRL(metrics.totalAportado)}
            sub="Custo líquido de aquisição"
            icon={<TrendingUp size={18} />}
            variant="default"
            error={errorAportes}
          />
        )}
        {loadingGastos ? <CardSkeleton /> : (
          <SummaryCard
            label="Gastos do Mês"
            value={formatBRL(metrics.gastosMes)}
            sub={currentMonthLabel.replace(/^\w/, (c) => c.toUpperCase())}
            icon={<ArrowDownCircle size={18} />}
            variant="danger"
            error={errorGastos}
          />
        )}
        {loadingDividendos ? <CardSkeleton /> : (
          <SummaryCard
            label="Renda Mensal Gerada"
            value={formatBRL(metrics.dividendosMes)}
            sub="/mês — dividendos recebidos"
            icon={<ArrowUpCircle size={18} />}
            variant="brand"
            error={errorDividendos}
          />
        )}
      </div>

      {/* Bloco Receitas vs Gastos */}
      <div className="mb-8">
        {blockLoading ? (
          <div className="h-[240px] rounded-3xl bg-white/[0.02] border border-white/5 animate-pulse flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : blockError ? (
          <div role="alert" className="p-6 rounded-3xl flex items-center gap-3 bg-red-500/10 border border-red-500/20">
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-sm font-medium text-red-400">Erro ao carregar dados de receitas e gastos.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Card de saldo */}
            <div className="lg:col-span-2 rounded-3xl p-8 bg-[#0a0a0a] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 shadow-2xl flex flex-col justify-between group">
              {hasNoData ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                    <Wallet size={28} className="text-white/20" />
                  </div>
                  <div>
                    <p className="text-white/80 font-semibold mb-1">Nenhuma receita este mês</p>
                    <p className="text-white/40 text-xs">Registre suas entradas para acompanhar seu saldo.</p>
                  </div>
                  <Link
                    href="/receitas/novo"
                    className="mt-2 flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border border-emerald-500/20"
                  >
                    <Plus size={16} aria-hidden /> Registrar Receita
                  </Link>
                </div>
              ) : (
                <>
                  {/* Três colunas de valores */}
                  <div className="flex flex-col sm:flex-row justify-between gap-8 sm:items-center">
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                        Receitas do Mês
                      </p>
                      <div className="flex items-center gap-2.5">
                        <TrendingUp size={20} className="text-emerald-400" aria-hidden />
                        <span className="text-3xl font-mono font-bold text-white">
                          {formatBRL(metrics.receitasMes)}
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:block w-px h-12 bg-white/5" />

                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                        Gastos do Mês
                      </p>
                      <div className="flex items-center gap-2.5">
                        <TrendingDown size={20} className="text-red-400" aria-hidden />
                        <span className="text-3xl font-mono font-bold text-white">
                          {formatBRL(metrics.gastosMes)}
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:block w-px h-12 bg-white/5" />

                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">
                        Saldo Líquido
                      </p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`text-3xl font-mono font-bold ${isDeficit ? "text-red-400" : "text-emerald-400"}`}>
                          {formatBRL(metrics.saldoMes)}
                        </span>
                        <span className={`text-[9px] px-2.5 py-1 rounded-md font-bold uppercase tracking-widest border ${
                          isDeficit
                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        }`}>
                          {isDeficit ? "Déficit" : "Superávit"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Barra de comprometimento com Gradiente Vibrante */}
                  <div className="mt-10 bg-white/[0.02] p-5 rounded-2xl border border-white/[0.03]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-white/50 uppercase tracking-wide">
                        Uso da Renda Mensal
                      </span>
                      <span className={`text-sm font-mono font-bold ${metrics.percentComprometidoReal > 100 ? "text-red-400" : "text-white"}`}>
                        {metrics.percentComprometidoReal.toFixed(1)}%
                      </span>
                    </div>
                    
                    <div
                      className="h-2.5 w-full bg-black/50 rounded-full overflow-hidden border border-white/5 shadow-inner"
                      role="progressbar"
                      aria-valuenow={Math.round(metrics.percentComprometido)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                        style={{ 
                          width: `${metrics.percentComprometido}%`,
                          // O gradiente vai do verde pro amarelo pro vermelho baseado no tamanho da barra
                          background: metrics.percentComprometidoReal > 100 
                            ? "#ef4444" // solid red if over
                            : "linear-gradient(90deg, #34d399 0%, #fbbf24 70%, #ef4444 100%)"
                        }}
                      />
                    </div>
                    
                    <p className="text-[11px] text-white/30 font-medium mt-3">
                      {metrics.percentComprometidoReal > 100 
                        ? "Atenção: Seus gastos ultrapassaram sua receita neste mês."
                        : "Mantenha o uso da renda sob controle para garantir seus aportes."}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Gráfico histórico 6 meses */}
            <div className="rounded-3xl p-6 lg:p-8 bg-[#0a0a0a] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 shadow-2xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-widest">
                  Fluxo 6 Meses
                </h3>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-white/60">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" aria-hidden /> Receitas
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] font-bold text-white/60">
                    <span className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]" aria-hidden /> Gastos
                  </span>
                </div>
              </div>
              
              <div className="flex-1 min-h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historyData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500 }}
                      tickFormatter={formatYAxis}
                      dx={-10}
                    />
                    <Tooltip content={<BarTooltipContent />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                    <Bar dataKey="receitas" fill="#34d399" radius={[4, 4, 0, 0]} barSize={12} />
                    <Bar dataKey="gastos"   fill="#f87171" radius={[4, 4, 0, 0]} barSize={12} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Gráficos — Patrimônio + Gastos por categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <PatrimonioChart aportes={(aportes as Aporte[]) ?? []} />

        <div className="rounded-3xl p-6 lg:p-8 flex flex-col transition-all duration-300 bg-[#0a0a0a] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-lg font-semibold tracking-tight text-white/90">
              Gastos Recentes
            </span>
            <Link href="/gastos" className="text-xs font-semibold text-orange-500/80 hover:text-orange-400 transition-colors">
              Ver todos →
            </Link>
          </div>
          {loadingGastos ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin border-orange-500/50" aria-label="Carregando" />
            </div>
          ) : (
            <div className="flex-1">
               <GastosChart gastos={(gastos as Gasto[]) ?? []} />
            </div>
          )}
        </div>
      </div>

      {/* Últimos lançamentos */}
      <div className="rounded-3xl p-6 lg:p-8 bg-[#0a0a0a] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold tracking-tight text-white/90">
            Últimos Movimentos
          </h3>
          <Link href="/investimentos" className="text-xs font-semibold text-orange-500/80 hover:text-orange-400 transition-colors">
            Ir para carteira →
          </Link>
        </div>

        {loadingAportes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <RowSkeleton key={i} id={i} />
            ))}
          </div>
        ) : ultimosAportes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ultimosAportes.map((aporte) => (
              <AporteItem key={aporte.id} aporte={aporte} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-4 opacity-50 bg-white/[0.01] rounded-2xl border border-white/5">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-inner">
              <Package size={24} className="text-white/40" aria-hidden />
            </div>
            <span className="text-sm font-medium tracking-wide text-white/60">
              Nenhum lançamento encontrado.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}