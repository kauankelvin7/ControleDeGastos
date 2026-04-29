"use client";

import { useMemo, useState } from "react";
import { format, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  type TooltipProps,
} from "recharts";
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Activity } from "lucide-react";
import { useCotacoes } from "@/hooks/useCotacoes";
import type { Aporte } from "@/types/dashboard";
import { formatBRL } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PatrimonioChartProps {
  aportes: Aporte[];
  className?: string;
}

interface MonthRow {
  label: string;
  patrimonio: number;
  investido: number;
  timestamp: number;
}

interface InventoryItem {
  cotas: number;
  totalCost: number;
  avgPrice: number;
}

type Period = "1M" | "3M" | "6M" | "1A" | "TUDO";

// ─── Constants ────────────────────────────────────────────────────────────────

const SUCCESS_COLOR = "#34d399"; // Emerald 400
const DANGER_COLOR = "#f87171";  // Red 400
const INVESTED_COLOR = "#a8a29e"; // Stone 400

const PERIODS: ReadonlyArray<{ label: Period; months: number; ariaLabel: string }> = [
  { label: "1M",   months: 1,  ariaLabel: "Último mês" },
  { label: "3M",   months: 3,  ariaLabel: "Últimos 3 meses" },
  { label: "6M",   months: 6,  ariaLabel: "Últimos 6 meses" },
  { label: "1A",   months: 12, ariaLabel: "Último ano" },
  { label: "TUDO", months: 0,  ariaLabel: "Todo o histórico" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtAxis(v: number): string {
  if (!Number.isFinite(v)) return "R$ 0";
  const absV = Math.abs(v);
  if (absV >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (absV >= 1_000)     return `R$ ${(v / 1_000).toFixed(1).replace(".", ",")}k`;
  return `R$ ${v.toFixed(0)}`;
}

function getCutoffDate(months: number): Date {
  return months === 0 ? new Date(0) : startOfMonth(subMonths(new Date(), months));
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const pat = payload.find((p: any) => p.dataKey === "patrimonio")?.value ?? 0;
  const inv = payload.find((p: any) => p.dataKey === "investido")?.value ?? 0;
  const rendimento = pat - inv;
  const pct = inv > 0 ? ((rendimento / inv) * 100).toFixed(2).replace(".", ",") : "0,00";
  const isPositive = rendimento >= 0;

  return (
    <div className="bg-[#121212]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl min-w-[220px] outline outline-1 outline-black/50">
      <p className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-3 pb-2 border-b border-white/10">
        {label}
      </p>
      
      <div className="space-y-2.5">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white" />
            <span className="text-sm text-white/80">Patrimônio</span>
          </div>
          <span className="text-sm font-bold text-white tracking-tight">{formatBRL(pat)}</span>
        </div>

        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-white/30" />
            <span className="text-sm text-white/80">Investido</span>
          </div>
          <span className="text-sm font-medium text-white/60 tracking-tight">{formatBRL(inv)}</span>
        </div>

        <div className="pt-2 mt-2 border-t border-white/5 flex justify-between items-center gap-4">
          <span className="text-xs text-white/50 font-medium">Resultado</span>
          <span className={`text-sm font-bold tracking-tight ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive ? "+" : ""}{formatBRL(rendimento)} ({isPositive ? "+" : ""}{pct}%)
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ message, icon: Icon = Activity }: { message: string, icon?: React.ElementType }) {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center gap-4 bg-white/[0.01] border border-white/5 rounded-3xl p-8">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-inner">
        <Icon size={28} className="text-white/20" strokeWidth={1.5} aria-hidden />
      </div>
      <span className="text-sm text-white/40 font-medium tracking-wide text-center max-w-xs leading-relaxed">
        {message}
      </span>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PatrimonioChart({ aportes, className = "" }: PatrimonioChartProps) {
  const [period, setPeriod] = useState<Period>("3M");

  const tickers = useMemo<string[]>(() => {
    if (!aportes?.length) return [];
    return [
      ...new Set(
        aportes.map((a) => (a.ativo ?? "").toUpperCase().trim()).filter(Boolean)
      ),
    ];
  }, [aportes]);

  const { data: cotacoes, isLoading: loadingCotacoes } = useCotacoes(
    tickers.length > 0 ? tickers : []
  );

  // ── 1. Processamento histórico
  const { baseRows, lastInventory } = useMemo(() => {
    if (!aportes?.length) return { baseRows: [] as MonthRow[], lastInventory: {} as Record<string, InventoryItem> };

    const sorted = [...aportes].sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
    );

    const inventory: Record<string, InventoryItem> = {};
    const porMes: Record<string, MonthRow> = {};
    let investidoLiquido = 0;

    sorted.forEach((aporte) => {
      const date = new Date(aporte.data);
      // Formatado para "Abr 24" para maior elegância
      const mesKey = format(date, "MMM yy", { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase());
      const timestamp = startOfMonth(date).getTime();
      const ativo = (aporte.ativo ?? "UNKNOWN").toUpperCase().trim();

      if (!inventory[ativo]) {
        inventory[ativo] = { cotas: 0, totalCost: 0, avgPrice: 0 };
      }

      const qtd    = Number(aporte.quantidade ?? 0);
      const vTotal = Number(aporte.valorTotal ?? 0);
      const vUnit  = aporte.valor != null ? Number(aporte.valor) : qtd > 0 ? vTotal / qtd : 0;

      if (aporte.tipo === "venda") {
        const costReduction = qtd * inventory[ativo].avgPrice;
        inventory[ativo].cotas     = Math.max(0, inventory[ativo].cotas - qtd);
        inventory[ativo].totalCost = Math.max(0, inventory[ativo].totalCost - costReduction);
        investidoLiquido -= vTotal;
      } else {
        inventory[ativo].cotas     += qtd;
        inventory[ativo].totalCost += qtd * vUnit;
        investidoLiquido           += vTotal;
      }

      inventory[ativo].avgPrice = inventory[ativo].cotas > 0 ? inventory[ativo].totalCost / inventory[ativo].cotas : 0;

      const patrimonioSnap = Object.values(inventory).reduce(
        (sum, item) => sum + (item.cotas > 0 ? item.cotas * item.avgPrice : 0),
        0
      );

      porMes[mesKey] = {
        label: mesKey,
        patrimonio: Math.max(0, patrimonioSnap),
        investido: Math.max(0, investidoLiquido),
        timestamp,
      };
    });

    return { 
      baseRows: Object.values(porMes).sort((a, b) => a.timestamp - b.timestamp), 
      lastInventory: inventory 
    };
  }, [aportes]);

  // ── 2. Override de cotações reais
  const rowsComCotacao = useMemo<MonthRow[]>(() => {
    if (!baseRows.length) return [];
    const rows = [...baseRows];

    if (cotacoes && Object.keys(cotacoes).length > 0) {
      const lastIdx = rows.length - 1;
      let patrimonioReal = 0;

      Object.entries(lastInventory).forEach(([ticker, item]) => {
        if (item.cotas > 0) {
          const precoReal = cotacoes[ticker] ?? item.avgPrice;
          patrimonioReal += item.cotas * precoReal;
        }
      });

      if (patrimonioReal > 0) {
        rows[lastIdx] = { ...rows[lastIdx], patrimonio: patrimonioReal };
      }
    }
    return rows;
  }, [baseRows, lastInventory, cotacoes]);

  // ── 3. Filtragem
  const chartData = useMemo<MonthRow[]>(() => {
    const months = PERIODS.find((p) => p.label === period)?.months ?? 0;
    let filtered = rowsComCotacao;

    if (months !== 0) {
      const cutoff = getCutoffDate(months).getTime();
      filtered = rowsComCotacao.filter((r) => r.timestamp >= cutoff);
      // Garante ao menos 2 pontos para a linha ser desenhada
      if (filtered.length < 2) filtered = rowsComCotacao.slice(-2);
    }
    return filtered;
  }, [rowsComCotacao, period]);

  // ── 4. Métricas derivadas
  const metrics = useMemo(() => {
    if (!chartData.length) return null;

    const last  = chartData[chartData.length - 1];
    const first = chartData[0];

    const pat        = last.patrimonio;
    const inv        = last.investido;
    const patInicio  = first.patrimonio;
    const rendimento = pat - inv;
    const varPeriodo = pat - patInicio;

    return {
      pat,
      inv,
      rendimento,
      pctRendimento: inv > 0 ? ((rendimento / inv) * 100).toFixed(2).replace(".", ",") : "0,00",
      varPeriodo,
      pctPeriodo: patInicio > 0 ? ((varPeriodo / patInicio) * 100).toFixed(2).replace(".", ",") : "0,00",
    };
  }, [chartData]);

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!aportes?.length) {
    return (
      <div className={`lg:col-span-2 ${className}`}>
        <EmptyState message="Nenhum aporte registrado. Comece a investir para acompanhar sua evolução." />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className={`lg:col-span-2 ${className}`}>
        <EmptyState message={`Não há dados suficientes para o período de ${period}.`} />
      </div>
    );
  }

  const isTotalPositive  = metrics.rendimento >= 0;
  const isPeriodPositive = metrics.varPeriodo >= 0;
  
  // A cor principal do gráfico reflete o sucesso DO PERÍODO selecionado
  const chartThemeColor = isPeriodPositive ? SUCCESS_COLOR : DANGER_COLOR;

  return (
    <div className={`lg:col-span-2 rounded-3xl p-6 lg:p-8 flex flex-col gap-8 bg-[#0a0a0a] border border-white/5 shadow-2xl ${className}`}>
      
      {/* ── Header & Controles ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-white/90">
              Evolução do Patrimônio
            </h2>
            {loadingCotacoes ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-medium text-white/40">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                Sincronizando
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-medium text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                Ao vivo
              </span>
            )}
          </div>
        </div>

        {/* Segmented Control */}
        <div 
          role="group" 
          aria-label="Período do gráfico"
          className="flex p-1 rounded-xl bg-white/[0.03] border border-white/5 backdrop-blur-sm"
        >
          {PERIODS.map(({ label, ariaLabel }) => {
            const active = period === label;
            return (
              <button
                key={label}
                onClick={() => setPeriod(label)}
                aria-label={ariaLabel}
                aria-pressed={active}
                className={`relative px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-300 ${
                  active ? "text-white shadow-sm" : "text-white/40 hover:text-white/70"
                }`}
              >
                {active && (
                  <div className="absolute inset-0 rounded-lg bg-white/10 border border-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.2)]" />
                )}
                <span className="relative">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Métricas ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card: Patrimônio */}
        <div className="group rounded-2xl p-5 flex flex-col gap-3 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/50 tracking-wide uppercase">Patrimônio Atual</span>
            <Wallet className="text-white/20 group-hover:text-white/40 transition-colors" size={18} strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-white mb-1">
              {formatBRL(metrics.pat)}
            </div>
            <div className={`flex items-center gap-1.5 text-xs font-medium ${isPeriodPositive ? "text-emerald-400" : "text-red-400"}`}>
              {isPeriodPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>
                {isPeriodPositive ? "+" : ""}{formatBRL(metrics.varPeriodo)} ({isPeriodPositive ? "+" : ""}{metrics.pctPeriodo}%) no período
              </span>
            </div>
          </div>
        </div>

        {/* Card: Investido */}
        <div className="group rounded-2xl p-5 flex flex-col gap-3 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 hover:border-white/10 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-white/50 tracking-wide uppercase">Total Investido</span>
            <PiggyBank className="text-white/20 group-hover:text-white/40 transition-colors" size={18} strokeWidth={1.5} />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-white mb-1">
              {formatBRL(metrics.inv)}
            </div>
            <div className="text-xs font-medium text-white/30">
              Custo histórico de aquisição
            </div>
          </div>
        </div>

        {/* Card: Rendimento Histórico */}
        <div className={`group rounded-2xl p-5 flex flex-col gap-3 border transition-colors ${
          isTotalPositive ? "bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/20" : "bg-red-500/5 border-red-500/10 hover:border-red-500/20"
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium tracking-wide uppercase ${isTotalPositive ? "text-emerald-500/70" : "text-red-500/70"}`}>
              Lucro/Prejuízo Total
            </span>
            <Activity className={isTotalPositive ? "text-emerald-500/40" : "text-red-500/40"} size={18} strokeWidth={1.5} />
          </div>
          <div>
            <div className={`text-2xl font-bold tracking-tight mb-1 ${isTotalPositive ? "text-emerald-400" : "text-red-400"}`}>
              {isTotalPositive ? "+" : ""}{formatBRL(metrics.rendimento)}
            </div>
            <div className={`text-xs font-medium ${isTotalPositive ? "text-emerald-500/70" : "text-red-500/70"}`}>
              {isTotalPositive ? "+" : ""}{metrics.pctRendimento}% sobre o valor investido
            </div>
          </div>
        </div>
      </div>

      {/* ── Gráfico ── */}
      <div className="h-[320px] w-full mt-2 relative">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientPatrimonio" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={chartThemeColor} stopOpacity={0.35} />
                <stop offset="95%" stopColor={chartThemeColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="4 4"
              vertical={false}
              stroke="rgba(255,255,255,0.06)"
            />

            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500 }}
              minTickGap={30}
              dy={10}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 500 }}
              tickFormatter={fmtAxis}
              domain={["auto", "auto"]}
              dx={-10}
            />

            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.1)", strokeWidth: 2, strokeDasharray: "4 4" }} />

            <Area
              type="monotone"
              dataKey="patrimonio"
              stroke={chartThemeColor}
              strokeWidth={3}
              fill="url(#gradientPatrimonio)"
              animationDuration={1000}
              animationEasing="ease-out"
              activeDot={{ r: 6, fill: "#121212", stroke: chartThemeColor, strokeWidth: 3 }}
            />

            <Line
              type="monotone"
              dataKey="investido"
              stroke={INVESTED_COLOR}
              strokeWidth={2}
              strokeDasharray="6 6"
              dot={false}
              activeDot={false}
              animationDuration={1000}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ── Legenda ── */}
      <div className="flex items-center justify-center sm:justify-start gap-6 px-2" aria-hidden>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: chartThemeColor, boxShadow: `0 0 10px ${chartThemeColor}80` }} />
          <span className="text-xs font-medium text-white/60">Patrimônio</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-3 h-0 border-t-2 border-dashed border-stone-400" />
          <span className="text-xs font-medium text-white/60">Valor Investido</span>
        </div>
      </div>
      
    </div>
  );
}