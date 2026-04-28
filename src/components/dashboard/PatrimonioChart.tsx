"use client";

import { useMemo, useRef, useEffect, useState, useCallback } from "react";
import { format, subMonths, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartConfiguration,
  type TooltipItem,
} from "chart.js";
import { useCotacoes } from "@/hooks/useCotacoes";
import type { Aporte } from "@/types/dashboard";

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

// ─── Types ───────────────────────────────────────────────────────────────────

interface PatrimonioChartProps {
  aportes: Aporte[];
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

// ─── Constants ───────────────────────────────────────────────────────────────

const BRAND       = "#e5591d";
const BRAND_DIM   = "rgba(229,89,29,0.15)";
const BRAND_GLOW  = "rgba(229,89,29,0.35)";
const MUTED       = "#888780";
const TEXT_PRIMARY   = "#e8d5b0";
const TEXT_SECONDARY = "#7a6a52";
const MONO = "'IBM Plex Mono', monospace";

const PERIODS: { label: Period; months: number }[] = [
  { label: "1M",   months: 1  },
  { label: "3M",   months: 3  },
  { label: "6M",   months: 6  },
  { label: "1A",   months: 12 },
  { label: "TUDO", months: 0  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (v: number): string => {
  if (!Number.isFinite(v)) return "R$0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
};

const fmtAxis = (v: number): string => {
  if (!Number.isFinite(v)) return "R$0";
  const absV = Math.abs(v);
  if (absV >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (absV >= 1_000)     return `R$${(v / 1_000).toFixed(1).replace(".", ",")}k`;
  return `R$${v.toFixed(0)}`;
};

const getCutoffDate = (months: number): Date =>
  months === 0 ? new Date(0) : startOfMonth(subMonths(new Date(), months));

/** Lê o valor de um dataset pelo label, evitando dependência de índice fixo. */
function getTooltipValueByLabel(
  items: TooltipItem<"line">[],
  label: string
): number {
  return Number(items.find((i) => i.dataset.label === label)?.raw ?? 0);
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function PatrimonioChart({ aportes }: PatrimonioChartProps) {
  const [period, setPeriod] = useState<Period>("3M");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef  = useRef<Chart | null>(null);

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

  // ── 1. Processamento histórico (pesado) ───────────────────────────────────
  const { baseRows, lastInventory } = useMemo(() => {
    if (!aportes?.length) return { baseRows: [], lastInventory: {} as Record<string, InventoryItem> };

    const sorted = [...aportes].sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
    );

    const inventory: Record<string, InventoryItem> = {};
    const porMes: Record<string, MonthRow> = {};
    let investidoLiquido = 0;

    sorted.forEach((aporte) => {
      const date      = new Date(aporte.data);
      const mesKey    = format(date, "MMM/yy", { locale: ptBR });
      const timestamp = startOfMonth(date).getTime();

      const ativo = (aporte.ativo ?? "UNKNOWN").toUpperCase().trim();
      if (!inventory[ativo]) {
        inventory[ativo] = { cotas: 0, totalCost: 0, avgPrice: 0 };
      }

      const qtd    = Number(aporte.quantidade ?? 0);
      const vTotal = Number(aporte.valorTotal ?? 0);
      const vUnit  = aporte.valor != null
        ? Number(aporte.valor)
        : qtd > 0 ? vTotal / qtd : 0;

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

      inventory[ativo].avgPrice =
        inventory[ativo].cotas > 0
          ? inventory[ativo].totalCost / inventory[ativo].cotas
          : 0;

      if (inventory[ativo].cotas === 0) {
        inventory[ativo].totalCost = 0;
      }

      const patrimonioSnap = Object.values(inventory).reduce(
        (sum, inv) => sum + (inv.cotas > 0 ? inv.cotas * inv.avgPrice : 0),
        0
      );

      porMes[mesKey] = {
        label: mesKey,
        patrimonio: patrimonioSnap,
        investido: Math.max(0, investidoLiquido),
        timestamp,
      };
    });

    const rows = Object.values(porMes).sort((a, b) => a.timestamp - b.timestamp);
    return { baseRows: rows, lastInventory: inventory };
  }, [aportes]);

  // ── 2. Override de cotações reais (leve) ──────────────────────────────────
  const rowsComCotacao = useMemo<MonthRow[]>(() => {
    if (!baseRows.length) return [];
    const rows = [...baseRows];

    if (cotacoes && Object.keys(cotacoes).length > 0) {
      const lastIdx = rows.length - 1;
      let patrimonioReal = 0;

      Object.entries(lastInventory).forEach(([ticker, inv]) => {
        if (inv.cotas > 0) {
          const precoReal = cotacoes[ticker] ?? inv.avgPrice;
          patrimonioReal += inv.cotas * precoReal;
        }
      });

      if (patrimonioReal > 0) {
        rows[lastIdx] = { ...rows[lastIdx], patrimonio: patrimonioReal };
      }
    }

    return rows;
  }, [baseRows, lastInventory, cotacoes]);

  // ── 3. Filtragem e métricas ───────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    const months = PERIODS.find((p) => p.label === period)?.months ?? 0;
    if (months === 0) return rowsComCotacao;

    const cutoff   = getCutoffDate(months).getTime();
    const filtered = rowsComCotacao.filter((r) => r.timestamp >= cutoff);
    return filtered.length >= 2 ? filtered : rowsComCotacao.slice(-2);
  }, [rowsComCotacao, period]);

  const metrics = useMemo(() => {
    const last = filteredRows[filteredRows.length - 1];
    const first = filteredRows[0];

    const pat = last?.patrimonio ?? 0;
    const inv = last?.investido  ?? 0;
    const patInicio = first?.patrimonio ?? pat;

    const allVals = filteredRows
      .flatMap((r) => [r.patrimonio, r.investido])
      .filter(Number.isFinite);
    const minVal = allVals.length ? Math.min(...allVals) : 0;
    const maxVal = allVals.length ? Math.max(...allVals) : 1;

    const rendimento    = pat - inv;
    const pctRendimento = inv > 0 ? (rendimento / inv) * 100 : 0;
    const varPeriodo    = pat - patInicio;
    const pctPeriodo    = patInicio > 0 ? (varPeriodo / patInicio) * 100 : 0;

    return {
      pat, inv, rendimento,
      pctRendimento: pctRendimento.toFixed(2).replace(".", ","),
      varPeriodo,
      pctPeriodo: pctPeriodo.toFixed(2).replace(".", ","),
      minVal, maxVal,
    };
  }, [filteredRows]);

  // ── 4. Build do gráfico ───────────────────────────────────────────────────
  const buildChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Destrói instância anterior com guard para evitar duplo-destroy no Strict Mode
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Usa o height real do elemento para o gradiente, com fallback
    const canvasHeight = canvas.getBoundingClientRect().height || canvas.height || 260;

    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0,   "rgba(229,89,29,0.28)");
    gradient.addColorStop(0.5, "rgba(229,89,29,0.07)");
    gradient.addColorStop(1,   "rgba(229,89,29,0.00)");

    const range   = metrics.maxVal - metrics.minVal || Math.abs(metrics.maxVal) * 0.1 || 1;
    const padding = range * 0.4;

    const config: ChartConfiguration = {
      type: "line",
      data: {
        labels: filteredRows.map((r) => r.label),
        datasets: [
          {
            label: "Patrimônio",
            data: filteredRows.map((r) => r.patrimonio),
            borderColor: BRAND,
            borderWidth: 2.5,
            fill: true,
            backgroundColor: gradient,
            tension: 0.45,
            pointRadius: filteredRows.length <= 12 ? 3 : 0,
            pointBackgroundColor: BRAND,
            pointBorderColor: "#1a1510",
            pointBorderWidth: 1.5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: BRAND,
            pointHoverBorderColor: TEXT_PRIMARY,
            pointHoverBorderWidth: 2,
          },
          {
            label: "Investido",
            data: filteredRows.map((r) => r.investido),
            borderColor: MUTED,
            borderWidth: 1.5,
            borderDash: [5, 4],
            fill: false,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 5,
            pointHoverBackgroundColor: MUTED,
            pointHoverBorderColor: TEXT_PRIMARY,
            pointHoverBorderWidth: 1.5,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: "index", intersect: false },
        animation: { duration: 500, easing: "easeInOutCubic" },
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: "index",
            intersect: false,
            backgroundColor: "rgba(18,14,10,0.96)",
            borderColor: "rgba(229,89,29,0.25)",
            borderWidth: 1,
            titleColor: TEXT_SECONDARY,
            titleFont: { family: MONO, size: 10, weight: "normal" },
            bodyColor: TEXT_PRIMARY,
            bodyFont: { family: MONO, size: 12 },
            padding: 14,
            displayColors: true,
            boxWidth: 8,
            boxHeight: 8,
            callbacks: {
              title: (items: TooltipItem<"line">[]) => items[0]?.label ?? "",
              label: (item: TooltipItem<"line">) => {
                const val = fmt(Number(item.raw ?? 0));
                return `  ${item.dataset.label}: ${val}`;
              },
              afterBody: (items: TooltipItem<"line">[]) => {
                // Identifica por label em vez de índice fixo — robusto a reordenações
                const pat = getTooltipValueByLabel(items, "Patrimônio");
                const inv = getTooltipValueByLabel(items, "Investido");
                if (!pat || !inv) return [];
                const ganho = pat - inv;
                const pct   = inv > 0
                  ? ((ganho / inv) * 100).toFixed(2).replace(".", ",")
                  : "0,00";
                const sinal = ganho >= 0 ? "+" : "";
                return [
                  "",
                  `  Ganho: ${sinal}${fmt(ganho)} (${sinal}${pct}%)`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: TEXT_SECONDARY,
              font: { family: MONO, size: 10 },
              maxRotation: 0,
              maxTicksLimit: 8,
              autoSkip: true,
            },
          },
          y: {
            grid: { color: "rgba(255,255,255,0.04)", lineWidth: 1 },
            border: { display: false, dash: [3, 3] },
            suggestedMin: metrics.minVal - padding,
            suggestedMax: metrics.maxVal + padding,
            ticks: {
              color: TEXT_SECONDARY,
              font: { family: MONO, size: 10 },
              maxTicksLimit: 5,
              callback: (value) => fmtAxis(Number(value)),
            },
          },
        },
      },
    };

    chartRef.current = new Chart(canvas, config);
  }, [filteredRows, metrics]);

  useEffect(() => {
    buildChart();
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [buildChart]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (!aportes?.length) {
    return (
      <div className="lg:col-span-2 glass rounded-2xl p-6 min-h-[300px] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={TEXT_SECONDARY}
            strokeWidth="1.5"
            aria-hidden="true"
          >
            <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
            <polyline points="16 7 22 7 22 13" />
          </svg>
        </div>
        <span className="text-sm font-mono" style={{ color: TEXT_SECONDARY }}>
          Nenhum aporte registrado ainda.
        </span>
      </div>
    );
  }

  const isPositive       = metrics.rendimento >= 0;
  const isPeriodPositive = metrics.varPeriodo >= 0;

  return (
    <div
      className="lg:col-span-2 glass rounded-2xl p-6 flex flex-col gap-5"
      style={{ boxShadow: "0 8px 48px rgba(0,0,0,0.45), 0 0 0 0.5px rgba(255,255,255,0.06)" }}
    >
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <h2
            className="text-base font-bold tracking-tight font-display"
            style={{ color: TEXT_PRIMARY }}
          >
            Evolução do Patrimônio
          </h2>
          {loadingCotacoes ? (
            <span
              className="text-[9px] font-mono px-2 py-0.5 rounded-full animate-pulse"
              style={{
                color: TEXT_SECONDARY,
                background: "rgba(255,255,255,0.04)",
                border: "0.5px solid rgba(255,255,255,0.08)",
              }}
            >
              Sincronizando...
            </span>
          ) : (
            <span
              className="text-[9px] font-bold uppercase tracking-wider font-display px-2 py-0.5 rounded-full"
              style={{
                color: "#4ade80",
                background: "rgba(74,222,128,0.08)",
                border: "0.5px solid rgba(74,222,128,0.2)",
              }}
            >
              ● Cotações reais
            </span>
          )}
        </div>

        {/* Seletor de período */}
        <div
          className="flex gap-0.5 p-1 rounded-xl"
          style={{ background: "rgba(0,0,0,0.4)", border: "0.5px solid rgba(255,255,255,0.06)" }}
          role="group"
          aria-label="Selecionar período do gráfico"
        >
          {PERIODS.map(({ label }) => {
            const active = period === label;
            return (
              <button
                key={label}
                onClick={() => setPeriod(label)}
                aria-pressed={active}
                aria-label={`Período: ${label}`}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest font-mono transition-all duration-200"
                style={{
                  background: active ? BRAND : "transparent",
                  color:      active ? "#fff" : TEXT_SECONDARY,
                  boxShadow:  active ? `0 2px 12px ${BRAND_GLOW}` : "none",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Patrimônio atual */}
        <div
          className="rounded-xl px-4 py-3.5 flex flex-col gap-1.5"
          style={{ background: "rgba(229,89,29,0.06)", border: "0.5px solid rgba(229,89,29,0.18)" }}
        >
          <span
            className="text-[9px] uppercase tracking-[0.15em] font-bold font-display"
            style={{ color: BRAND }}
          >
            Patrimônio atual
          </span>
          <span
            className="text-xl font-bold leading-none font-mono tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            {fmt(metrics.pat)}
          </span>
          <span
            className="text-[10px] font-mono"
            style={{ color: isPeriodPositive ? "#4ade80" : "#f87171" }}
          >
            {isPeriodPositive ? "▲" : "▼"}{" "}
            {isPeriodPositive ? "+" : ""}{fmt(metrics.varPeriodo)}{" "}
            ({isPeriodPositive ? "+" : ""}{metrics.pctPeriodo}%) no período
          </span>
        </div>

        {/* Total investido */}
        <div
          className="rounded-xl px-4 py-3.5 flex flex-col gap-1.5"
          style={{ background: "rgba(255,255,255,0.02)", border: "0.5px solid rgba(255,255,255,0.07)" }}
        >
          <span
            className="text-[9px] uppercase tracking-[0.15em] font-bold font-display"
            style={{ color: TEXT_SECONDARY }}
          >
            Total investido
          </span>
          <span
            className="text-xl font-bold leading-none font-mono tracking-tight"
            style={{ color: TEXT_PRIMARY }}
          >
            {fmt(metrics.inv)}
          </span>
          <span className="text-[10px] font-mono" style={{ color: TEXT_SECONDARY }}>
            Custo de aquisição líquido
          </span>
        </div>

        {/* Rendimento total */}
        <div
          className="rounded-xl px-4 py-3.5 flex flex-col gap-1.5"
          style={{
            background: isPositive ? "rgba(74,222,128,0.05)" : "rgba(248,113,113,0.05)",
            border: `0.5px solid ${isPositive ? "rgba(74,222,128,0.18)" : "rgba(248,113,113,0.18)"}`,
          }}
        >
          <span
            className="text-[9px] uppercase tracking-[0.15em] font-bold font-display"
            style={{ color: isPositive ? "#4ade80" : "#f87171" }}
          >
            Rendimento total
          </span>
          <div className="flex items-baseline gap-2 leading-none">
            <span
              className="text-xl font-bold font-mono tracking-tight"
              style={{ color: isPositive ? "#4ade80" : "#f87171" }}
            >
              {isPositive ? "+" : ""}{fmt(metrics.rendimento)}
            </span>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: isPositive ? "rgba(74,222,128,0.7)" : "rgba(248,113,113,0.7)" }}
            >
              {isPositive ? "+" : ""}{metrics.pctRendimento}%
            </span>
          </div>
          <span className="text-[10px] font-mono" style={{ color: TEXT_SECONDARY }}>
            Vs. custo de aquisição
          </span>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-6 px-0.5" aria-hidden="true">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-[3px]"
            style={{ background: BRAND, boxShadow: `0 0 6px ${BRAND_DIM}` }}
          />
          <span className="text-[11px] font-medium font-display" style={{ color: TEXT_SECONDARY }}>
            Patrimônio
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-[3px]"
            style={{ background: "transparent", border: `1.5px dashed ${MUTED}` }}
          />
          <span className="text-[11px] font-medium font-display" style={{ color: TEXT_SECONDARY }}>
            Investido
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="w-full relative"
        style={{ height: 260 }}
        role="img"
        aria-label={`Gráfico de linha mostrando a evolução do patrimônio no período ${period}. Patrimônio atual: ${fmt(metrics.pat)}. Rendimento: ${isPositive ? "+" : ""}${fmt(metrics.rendimento)} (${isPositive ? "+" : ""}${metrics.pctRendimento}%).`}
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}