"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useCotacoes } from "@/hooks/useCotacoes";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

interface PatrimonioChartProps {
  aportes: any[];
}

export default function PatrimonioChart({ aportes }: PatrimonioChartProps) {
  const [periodoFiltro, setPeriodoFiltro] = useState<number>(3);

  // Extrai tickers únicos da carteira para buscar cotações reais
  const tickers = useMemo(() => {
    if (!aportes) return [];
    return [...new Set(aportes.map((a) => (a.ativo || "").toUpperCase()).filter(Boolean))];
  }, [aportes]);

  const { data: cotacoes, isLoading: loadingCotacoes } = useCotacoes(tickers);

  const chartData = useMemo(() => {
    if (!aportes || aportes.length === 0) return { labels: [], patrimonio: [], investido: [] };

    // Sort ASC
    const sortedAportes = [...aportes].sort((a, b) =>
      new Date(a.data).getTime() - new Date(b.data).getTime()
    );

    const porMes: Record<string, { label: string; patrimonio: number; investido: number; timestamp: number }> = {};
    const inventory: Record<string, { cotas: number; lastPrice: number }> = {};
    let investidoLiquido = 0;

    sortedAportes.forEach((aporte) => {
      const date = new Date(aporte.data);
      const mesKey = format(date, "MMM/yy", { locale: ptBR });
      const timestamp = date.getTime();

      const ativo = aporte.ativo || "UNKNOWN";
      if (!inventory[ativo]) inventory[ativo] = { cotas: 0, lastPrice: 0 };

      if (aporte.tipo === "venda") {
        inventory[ativo].cotas -= aporte.quantidade || 0;
        investidoLiquido -= aporte.valorTotal || 0;
      } else {
        inventory[ativo].cotas += aporte.quantidade || 0;
        investidoLiquido += aporte.valorTotal || 0;
      }

      // Histórico: usa preço do aporte para meses passados
      inventory[ativo].lastPrice = aporte.valor || 0;

      let patrimonioAtual = 0;
      Object.entries(inventory).forEach(([ticker, inv]) => {
        if (inv.cotas > 0) {
          patrimonioAtual += inv.cotas * inv.lastPrice;
        }
      });

      porMes[mesKey] = {
        label: mesKey,
        patrimonio: patrimonioAtual,
        investido: investidoLiquido > 0 ? investidoLiquido : 0,
        timestamp,
      };
    });

    // Override do último ponto com cotação real da Brapi (se disponível)
    if (cotacoes && Object.keys(cotacoes).length > 0) {
      const sortedKeys = Object.keys(porMes).sort((a, b) => porMes[a].timestamp - porMes[b].timestamp);
      const ultimoMes = sortedKeys[sortedKeys.length - 1];
      if (ultimoMes) {
        let patrimonioReal = 0;
        Object.entries(inventory).forEach(([ticker, inv]) => {
          if (inv.cotas > 0) {
            const precoReal = cotacoes[ticker] ?? inv.lastPrice;
            patrimonioReal += inv.cotas * precoReal;
          }
        });
        porMes[ultimoMes].patrimonio = patrimonioReal;
      }
    }

    let dadosProcessados = Object.values(porMes).sort((a, b) => a.timestamp - b.timestamp);
    if (periodoFiltro > 0) {
      dadosProcessados = dadosProcessados.slice(-periodoFiltro);
    }

    return {
      labels: dadosProcessados.map((d) => d.label),
      patrimonio: dadosProcessados.map((d) => d.patrimonio),
      investido: dadosProcessados.map((d) => d.investido),
    };
  }, [aportes, periodoFiltro, cotacoes]);

  if (!aportes || aportes.length === 0) {
    return (
      <div className="lg:col-span-2 bg-[linear-gradient(145deg,rgba(255,255,255,0.02)_0%,transparent_100%)] backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] min-h-[300px] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <span className="text-xl opacity-50 text-text-muted">📈</span>
        </div>
        <span className="font-display text-sm text-text-muted">Nenhum aporte registrado ainda.</span>
      </div>
    );
  }

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: "Patrimônio",
        data: chartData.patrimonio,
        borderColor: "#e5591d",
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: "#e5591d",
        pointHoverBorderColor: "#ffffff",
        pointHoverBorderWidth: 2,
        tension: 0.4,
        fill: true,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return "transparent";
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, "rgba(229, 89, 29, 0.28)");
          gradient.addColorStop(0.6, "rgba(229, 89, 29, 0.06)");
          gradient.addColorStop(1, "rgba(229, 89, 29, 0.00)");
          return gradient;
        },
      },
      {
        label: "Investido",
        data: chartData.investido,
        borderColor: "#ffa43c",
        borderWidth: 1.5,
        borderDash: [4, 4],
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: "#ffa43c",
        tension: 0.4,
        fill: false,
      },
    ],
  };

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
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
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (item: any) => {
            const val = item.raw.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
            return ` ${item.dataset.label}: ${val}`;
          },
          afterBody: (items: any) => {
            const pat = items[0]?.raw ?? 0;
            const inv = items[1]?.raw ?? 0;
            const ganho = pat - inv;
            if (ganho <= 0) return [];
            const ganhoFmt = ganho.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
            return ["", ` Ganho: +${ganhoFmt}`];
          },
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: "#7a6a52",
          font: { family: "'IBM Plex Mono', monospace", size: 10 },
          maxRotation: 0,
        },
      },
      y: {
        grid: { color: "#2a2318" },
        border: { display: false },
        ticks: {
          color: "#7a6a52",
          font: { family: "'IBM Plex Mono', monospace", size: 10 },
          callback: (v: number) => {
            if (v >= 1000) return `R$${(v / 1000).toFixed(0)}k`;
            return `R$${v}`;
          },
        },
      },
    },
  };

  return (
    <div className="lg:col-span-2 bg-[linear-gradient(145deg,rgba(255,255,255,0.02)_0%,transparent_100%)] backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-300 hover:border-white/10 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <span className="text-text-secondary font-display font-medium tracking-wide">Evolução do Patrimônio</span>
          {loadingCotacoes && (
            <span className="text-[10px] font-display text-text-muted bg-white/5 px-2 py-0.5 rounded-full animate-pulse border border-white/5">
              Buscando cotações...
            </span>
          )}
          {cotacoes && Object.keys(cotacoes).length > 0 && !loadingCotacoes && (
            <span className="text-[10px] font-display text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">
              ● Cotações reais
            </span>
          )}
        </div>
        <div className="flex gap-1 bg-black/30 p-1 rounded-lg border border-white/5">
          {[
            { label: "3M", value: 3 },
            { label: "6M", value: 6 },
            { label: "1A", value: 12 },
            { label: "TUDO", value: 0 },
          ].map((filtro) => (
            <button
              key={filtro.value}
              onClick={() => setPeriodoFiltro(filtro.value)}
              className={`px-3 py-1 text-[10px] font-display font-bold uppercase tracking-widest rounded-md transition-all duration-200 ${
                periodoFiltro === filtro.value
                  ? "bg-brand-orange text-white shadow-[0_0_8px_rgba(229,89,29,0.4)]"
                  : "text-text-muted hover:text-text-primary hover:bg-white/5"
              }`}
            >
              {filtro.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex gap-4 mb-4">
        <span className="text-[11px] font-display text-text-muted flex items-center gap-2">
          <span className="w-4 h-0.5 rounded-full bg-[#e5591d]"></span> Patrimônio
        </span>
        <span className="text-[11px] font-display text-text-muted flex items-center gap-2">
          <span className="w-4 h-[2px] bg-[repeating-linear-gradient(90deg,#ffa43c_0,#ffa43c_4px,transparent_4px,transparent_8px)]"></span> Investido
        </span>
      </div>

      <div className="w-full h-[220px] relative">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
