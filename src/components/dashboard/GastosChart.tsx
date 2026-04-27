"use client";

import { useMemo } from "react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { formatBRL } from "@/lib/utils";

ChartJS.register(ArcElement, Tooltip, Legend);

// Paleta cyberpunk harmoniosa com o design do app
const CATEGORIA_CORES: Record<string, string> = {
  "Moradia":      "#e5591d",
  "Alimentação":  "#ffa43c",
  "Transporte":   "#60a5fa",
  "Saúde":        "#4ade80",
  "Educação":     "#a78bfa",
  "Lazer":        "#f472b6",
  "Outros":       "#64748b",
};

interface GastosChartProps {
  gastos: any[];
}

export default function GastosChart({ gastos }: GastosChartProps) {
  const chartData = useMemo(() => {
    if (!gastos || gastos.length === 0) return null;

    const totaisPorCategoria: Record<string, number> = {};
    gastos.forEach((g) => {
      const cat = g.categoria || "Outros";
      totaisPorCategoria[cat] = (totaisPorCategoria[cat] || 0) + (g.valor || 0);
    });

    // Ordena do maior para o menor
    const sorted = Object.entries(totaisPorCategoria).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([cat]) => cat);
    const data = sorted.map(([, v]) => v);
    const colors = labels.map((l) => CATEGORIA_CORES[l] || CATEGORIA_CORES["Outros"]);

    return { labels, data, colors };
  }, [gastos]);

  if (!chartData) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-8 opacity-50">
        <span className="text-3xl mb-2">💸</span>
        <span className="text-xs font-display text-text-muted">Nenhum gasto registrado.</span>
      </div>
    );
  }

  const totalGastos = chartData.data.reduce((a, b) => a + b, 0);

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        data: chartData.data,
        backgroundColor: chartData.colors.map((c) => c + "cc"), // 80% opacity
        borderColor: chartData.colors,
        borderWidth: 1.5,
        hoverBorderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options: any = {
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
          label: (item: any) => {
            const pct = ((item.raw / totalGastos) * 100).toFixed(1);
            const val = item.raw.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
            return ` ${val}  (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Donut */}
      <div className="relative w-full h-[180px] flex-shrink-0">
        <Doughnut data={data} options={options} />
        {/* Centro do donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[9px] font-display text-text-muted uppercase tracking-widest">Total</span>
          <span className="font-mono font-bold text-base text-text-primary leading-tight">
            {formatBRL(totalGastos)}
          </span>
        </div>
      </div>

      {/* Legenda customizada */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {chartData.labels.map((label, i) => (
          <div key={label} className="flex items-center gap-1.5 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: chartData.colors[i] }}
            />
            <span className="text-[11px] font-display text-text-muted truncate">{label}</span>
            <span className="text-[10px] font-mono text-text-secondary ml-auto flex-shrink-0">
              {((chartData.data[i] / totalGastos) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
