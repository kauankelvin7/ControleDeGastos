"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { formatBRL } from "@/lib/utils";
import type { Gasto } from "@/types/dashboard";

ChartJS.register(ArcElement, Tooltip, Legend);

// ─── Tipos ────────────────────────────────────────────────────────────────────

// ─── Constantes ───────────────────────────────────────────────────────────────

const FALLBACK_COLOR = "#64748b";

const CATEGORIA_CORES: Record<string, string> = {
  "Moradia":      "#e5591d",
  "Alimentação":  "#ffa43c",
  "Transporte":   "#60a5fa",
  "Saúde":        "#4ade80",
  "Educação":     "#a78bfa",
  "Lazer":        "#f472b6",
  "Outros":       FALLBACK_COLOR,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Converte cor hex #rrggbb → rgba(r,g,b,alpha).
 * Robusto: funciona com #rgb e #rrggbb. Fallback para a própria cor se inválida.
 */
function hexToRgba(hex: string, alpha: number): string {
  const sanitized = hex.replace("#", "");
  const full =
    sanitized.length === 3
      ? sanitized.split("").map((c) => c + c).join("")
      : sanitized;
  const num = parseInt(full, 16);
  if (isNaN(num)) return hex;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Normaliza o nome da categoria para o lookup da paleta.
 * Evita que "outros" ou "OUTROS" fique sem cor.
 */
function normalizeCategoria(raw: string | undefined): string {
  if (!raw) return "Outros";
  // Capitaliza primeira letra para bater com as chaves da paleta
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() === raw
    ? raw
    : raw.charAt(0).toUpperCase() + raw.slice(1);
}

function corDaCategoria(categoria: string): string {
  return CATEGORIA_CORES[categoria] ?? FALLBACK_COLOR;
}

// ─── Componente ───────────────────────────────────────────────────────────────

interface GastosChartProps {
  gastos: Gasto[];
}

export default function GastosChart({ gastos }: GastosChartProps) {
  const chartData = useMemo(() => {
    if (!gastos || gastos.length === 0) return null;

    const totaisPorCategoria: Record<string, number> = {};
    gastos.forEach((g) => {
      const cat = normalizeCategoria(g.categoria);
      totaisPorCategoria[cat] = (totaisPorCategoria[cat] || 0) + (g.valor || 0);
    });

    // Ordena do maior para o menor
    const sorted = Object.entries(totaisPorCategoria).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([cat]) => cat);
    const data = sorted.map(([, v]) => v);
    const colors = labels.map(corDaCategoria);

    return { labels, data, colors };
  }, [gastos]);

  if (!chartData) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 opacity-50">
        <span className="text-3xl mb-2" aria-hidden="true">💸</span>
        <span className="text-xs font-display text-text-muted">Nenhum gasto registrado.</span>
      </div>
    );
  }

  const totalGastos = chartData.data.reduce((acc, v) => acc + v, 0);

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        data: chartData.data,
        backgroundColor: chartData.colors.map((c) => hexToRgba(c, 0.8)),
        borderColor: chartData.colors,
        borderWidth: 1.5,
        hoverBorderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "68%",
    animation: { duration: 600, easing: "easeInOutQuart" },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#18150e",
        borderColor: "#3d3020",
        borderWidth: 1,
        titleColor: "#ffa43c",
        titleFont: { family: "'IBM Plex Mono', monospace", size: 11 },
        bodyColor: "#e8d5b0",
        bodyFont: { family: "'IBM Plex Mono', monospace", size: 11 },
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (item: TooltipItem<"doughnut">) => {
            const value = item.raw as number;
            const pct = ((value / totalGastos) * 100).toFixed(1);
            const formatted = value.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            });
            return ` ${formatted}  (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Donut */}
      <div
        className="relative w-full h-[180px] flex-shrink-0"
        role="img"
        aria-label={`Gráfico de gastos por categoria. Total: ${formatBRL(totalGastos)}`}
      >
        <Doughnut data={data} options={options} />

        {/* Centro do donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" aria-hidden="true">
          <span className="text-[9px] font-display text-text-muted uppercase tracking-widest">Total</span>
          <span className="font-mono font-bold text-base text-text-primary leading-tight">
            {formatBRL(totalGastos)}
          </span>
        </div>
      </div>

      {/* Legenda customizada */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5" role="list" aria-label="Categorias de gastos">
        {chartData.labels.map((label, i) => {
          const pct = (chartData.data[i] / totalGastos) * 100;
          // Exibe 1 casa decimal para categorias pequenas (< 1%), inteiro para as demais
          const pctFormatted = pct < 1 ? pct.toFixed(1) : pct.toFixed(0);

          return (
            <div
              key={label}
              className="flex items-center gap-1.5 min-w-0"
              role="listitem"
              aria-label={`${label}: ${formatBRL(chartData.data[i])} (${pctFormatted}%)`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: chartData.colors[i] }}
                aria-hidden="true"
              />
              <span className="text-[11px] font-display text-text-muted truncate">{label}</span>
              <span className="text-[10px] font-mono text-text-secondary ml-auto flex-shrink-0">
                {pctFormatted}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}