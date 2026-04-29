"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  DoughnutController,
  Tooltip,
  Legend,
  type ChartOptions,
  type TooltipItem,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { formatBRL } from "@/lib/utils";
import type { Gasto } from "@/types/dashboard";
import { PieChart } from "lucide-react";

ChartJS.register(ArcElement, DoughnutController, Tooltip, Legend);

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface GastosChartProps {
  gastos: Gasto[];
  className?: string;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

const FALLBACK_COLOR = "#78716c"; // Stone 500

// Paleta de cores moderna (inspirada no Tailwind)
const CATEGORIA_CORES: Record<string, string> = {
  "Moradia":      "#6366f1", // Indigo 500
  "Alimentação":  "#10b981", // Emerald 500
  "Transporte":   "#f59e0b", // Amber 500
  "Saúde":        "#ef4444", // Red 500
  "Educação":     "#8b5cf6", // Violet 500
  "Lazer":        "#ec4899", // Pink 500
  "Outros":       FALLBACK_COLOR,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function normalizeCategoria(raw: string | undefined): string {
  if (!raw) return "Outros";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase() === raw
    ? raw
    : raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function corDaCategoria(categoria: string): string {
  return CATEGORIA_CORES[categoria] ?? FALLBACK_COLOR;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="min-h-[300px] flex flex-col items-center justify-center gap-4 bg-white/[0.01] border border-white/5 rounded-3xl p-8 h-full">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center shadow-inner">
        <PieChart size={28} className="text-white/20" strokeWidth={1.5} aria-hidden />
      </div>
      <span className="text-sm text-white/40 font-medium tracking-wide text-center max-w-xs leading-relaxed">
        Nenhum gasto registrado ainda.
      </span>
    </div>
  );
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function GastosChart({ gastos, className = "" }: GastosChartProps) {
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
      <div className={`h-full ${className}`}>
        <EmptyState />
      </div>
    );
  }

  const totalGastos = chartData.data.reduce((acc, v) => acc + v, 0);

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        data: chartData.data,
        backgroundColor: chartData.colors.map((c) => hexToRgba(c, 0.85)),
        borderColor: chartData.colors,
        borderWidth: 0, // Removido para usar o spacing nativo
        hoverOffset: 8,
        spacing: 4, // Cria o "gap" elegante entre as fatias (requer Chart.js 3+)
        borderRadius: 4, // Arredonda levemente as pontas das fatias
      },
    ],
  };

  const options: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "75%", // Aumentado para deixar o anel mais fino e elegante
    animation: { duration: 1000, easing: "easeOutQuart" },
    layout: {
      padding: 10, // Evita que o hover corte nas bordas do canvas
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(18, 18, 18, 0.95)",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
        titleColor: "rgba(255, 255, 255, 0.5)",
        titleFont: { family: "inherit", size: 11, weight: "bold" },
        bodyColor: "#ffffff",
        bodyFont: { family: "inherit", size: 13, weight: "bold" },
        padding: 12,
        cornerRadius: 12,
        displayColors: true,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (item: TooltipItem<"doughnut">) => {
            const value = item.raw as number;
            const pct = ((value / totalGastos) * 100).toFixed(1);
            const formatted = value.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            });
            return `${formatted} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className={`rounded-3xl p-6 lg:p-8 flex flex-col gap-8 bg-[#0a0a0a] border border-white/5 shadow-2xl h-full ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight text-white/90">
          Distribuição de Gastos
        </h2>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 flex-1">
        
        {/* Donut Chart */}
        <div
          className="relative w-full max-w-[240px] aspect-square flex-shrink-0"
          role="img"
          aria-label={`Gráfico de gastos por categoria. Total: ${formatBRL(totalGastos)}`}
        >
          <Doughnut data={data} options={options} />

          {/* Centro do donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" aria-hidden="true">
            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-widest mb-1">Total</span>
            <span className="font-bold text-2xl tracking-tight text-white leading-none">
              {formatBRL(totalGastos)}
            </span>
          </div>
        </div>

        {/* Lista de Legendas Interativa */}
        <div className="flex flex-col gap-2 w-full flex-1" role="list" aria-label="Categorias de gastos">
          {chartData.labels.map((label, i) => {
            const valor = chartData.data[i];
            const pct = (valor / totalGastos) * 100;
            const pctFormatted = pct < 1 ? pct.toFixed(1) : pct.toFixed(0);
            const cor = chartData.colors[i];

            return (
              <div
                key={label}
                className="group flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
                role="listitem"
                aria-label={`${label}: ${formatBRL(valor)} (${pctFormatted}%)`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{ 
                      backgroundColor: cor,
                      boxShadow: `0 0 12px ${cor}80` 
                    }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                    {label}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-white tracking-tight">
                    {formatBRL(valor)}
                  </span>
                  <span className="text-xs font-semibold text-white/40 bg-white/5 px-2 py-1 rounded-md w-12 text-center">
                    {pctFormatted}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}