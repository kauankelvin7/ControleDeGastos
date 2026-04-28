"use client";

import { useMemo } from "react";
import { useAportes, useGastos, useDividendos } from "@/hooks/useFirebaseData";
import { formatBRL } from "@/lib/utils";
import { TrendingUp, ArrowDownCircle, ArrowUpCircle, Package } from "lucide-react";
import Link from "next/link";
import PatrimonioChart from "@/components/dashboard/PatrimonioChart";
import GastosChart from "@/components/dashboard/GastosChart";
import type { Aporte, Gasto, Dividendo } from "@/types/dashboard";

// ─── Skeleton ────────────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 p-6 animate-pulse"
      style={{ background: "rgba(255,255,255,0.02)" }}>
      <div className="h-3 w-24 rounded-full mb-4" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="h-8 w-36 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="h-16 rounded-xl animate-pulse" style={{ background: "rgba(255,255,255,0.02)" }} />
  );
}

// ─── Summary card ─────────────────────────────────────────────────────────────
interface SummaryCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  variant?: "default" | "danger" | "brand";
}

function SummaryCard({ label, value, sub, icon, variant = "default" }: SummaryCardProps) {
  const styles: Record<string, React.CSSProperties> = {
    default: {
      background: "linear-gradient(145deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.01) 100%)",
      border: "0.5px solid rgba(255,255,255,0.07)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,255,255,0.05)",
    },
    danger: {
      background: "linear-gradient(135deg,rgba(248,113,113,0.04) 0%,rgba(255,255,255,0.01) 100%)",
      border: "0.5px solid rgba(248,113,113,0.12)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.2),inset 0 1px 0 rgba(255,255,255,0.05)",
    },
    brand: {
      background: "linear-gradient(135deg,rgba(229,89,29,0.1) 0%,rgba(0,0,0,0.4) 100%)",
      border: "0.5px solid rgba(229,89,29,0.3)",
      boxShadow: "0 12px 48px rgba(229,89,29,0.15),inset 0 1px 0 rgba(255,255,255,0.1)",
    },
  };

  const valueColors: Record<string, string> = {
    default: "#e8d5b0",
    danger: "#f87171",
    brand: "#e5591d",
  };

  return (
    <div
      className="group relative rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={styles[variant]}
    >
      {variant === "brand" && (
        <div className="absolute -right-4 -top-4 transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"
          style={{ color: "rgba(229,89,29,0.08)" }}>
          <ArrowUpCircle size={120} strokeWidth={1} />
        </div>
      )}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="transition-transform group-hover:scale-110">{icon}</span>
          <span className="font-display text-[10px] font-bold uppercase tracking-[0.15em]"
            style={{ color: "#7a6a52" }}>
            {label}
          </span>
        </div>
        <div className="font-mono font-bold text-3xl leading-none tracking-tight"
          style={{ color: valueColors[variant] }}>
          {value}
        </div>
        {sub && (
          <div className="mt-1.5 text-[11px] font-mono" style={{ color: "rgba(122,106,82,0.7)" }}>
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
    <div className="group/item flex items-center justify-between p-3 rounded-xl transition-all duration-200 hover:-translate-y-[2px] cursor-pointer"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "0.5px solid rgba(255,255,255,0.06)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)";
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.06)";
      }}
    >
      <div className="flex items-center gap-3">
        {/* Ícone de tipo */}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: isVenda ? "rgba(248,113,113,0.1)" : "rgba(74,222,128,0.08)",
            border: `0.5px solid ${isVenda ? "rgba(248,113,113,0.2)" : "rgba(74,222,128,0.15)"}`,
          }}>
          {isVenda
            ? <ArrowDownCircle size={13} color="#f87171" />
            : <ArrowUpCircle size={13} color="#4ade80" />
          }
        </div>
        <div>
          <div className="font-mono font-bold text-sm tracking-wide"
            style={{ color: "#e8d5b0" }}>
            {(aporte.ativo ?? "ATIVO").toUpperCase()}
          </div>
          <div className="font-display text-[10px] mt-0.5" style={{ color: "#7a6a52" }}>
            {new Date(aporte.data).toLocaleDateString("pt-BR")}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="font-mono font-bold text-sm"
          style={{ color: isVenda ? "#f87171" : "#e5591d" }}>
          {isVenda ? "-" : "+"}{formatBRL(valor)}
        </div>
        <div className="font-display text-[10px] uppercase tracking-wider mt-0.5"
          style={{ color: "#7a6a52" }}>
          {aporte.tipo ?? "compra"}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: aportes, isLoading: loadingAportes } = useAportes();
  const { data: gastos, isLoading: loadingGastos } = useGastos();
  const { data: dividendos, isLoading: loadingDividendos } = useDividendos();

  // Instância única de "agora" — evita inconsistência em virada de meia-noite
  const now = useMemo(() => new Date(), []);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // ── Métricas calculadas ─────────────────────────────────────────────────
  const metrics = useMemo(() => {
    // Total aportado líquido (compras − vendas pelo valorTotal)
    const totalAportado =
      (aportes as Aporte[] | undefined)?.reduce((acc, cur) => {
        const v = Number(cur.valorTotal ?? 0);
        return cur.tipo === "venda" ? acc - v : acc + v;
      }, 0) ?? 0;

    // Gastos somente do mês atual
    const gastosMes =
      (gastos as Gasto[] | undefined)
        ?.filter((g) => {
          const d = new Date(g.data);
          return (
            d.getMonth() === currentMonth && d.getFullYear() === currentYear
          );
        })
        .reduce((acc, cur) => acc + Number(cur.valor ?? 0), 0) ?? 0;

    // Dividendos somente do mês atual
    const dividendosMes =
      (dividendos as Dividendo[] | undefined)
        ?.filter((d) => {
          const dt = new Date(d.data);
          return (
            dt.getMonth() === currentMonth && dt.getFullYear() === currentYear
          );
        })
        .reduce((acc, cur) => acc + Number(cur.valorTotal ?? 0), 0) ?? 0;

    return { totalAportado, gastosMes, dividendosMes };
  }, [aportes, gastos, dividendos, currentMonth, currentYear]);

  // ── Últimos lançamentos — ordenados por data desc ───────────────────────
  const ultimosAportes = useMemo<Aporte[]>(() => {
    if (!aportes?.length) return [];
    return [...(aportes as Aporte[])]
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
      .slice(0, 8);
  }, [aportes]);

  return (
    <div className="animate-in fade-in duration-500">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="mb-8">
        <h1 className="font-display font-bold text-3xl tracking-tight drop-shadow-md"
          style={{ color: "#e8d5b0" }}>
          Visão Geral
        </h1>
        <p className="mt-1 text-sm font-display" style={{ color: "#7a6a52" }}>
          Acompanhe a evolução do seu patrimônio.
        </p>
      </header>

      {/* ── Cards de resumo ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {loadingAportes ? (
          <CardSkeleton />
        ) : (
          <SummaryCard
            label="Total Aportado"
            value={formatBRL(metrics.totalAportado)}
            sub="Custo líquido de aquisição"
            icon={<TrendingUp size={16} color="#e5591d" />}
            variant="default"
          />
        )}

        {loadingGastos ? (
          <CardSkeleton />
        ) : (
          <SummaryCard
            label="Gastos do Mês"
            value={formatBRL(metrics.gastosMes)}
            sub={`${now.toLocaleString("pt-BR", { month: "long", year: "numeric" })}`}
            icon={<ArrowDownCircle size={16} color="#f87171" />}
            variant="danger"
          />
        )}

        {loadingDividendos ? (
          <CardSkeleton />
        ) : (
          <SummaryCard
            label="Renda Mensal Gerada"
            value={`${formatBRL(metrics.dividendosMes)}`}
            sub="/mês — dividendos recebidos"
            icon={<ArrowUpCircle size={16} color="#e5591d" />}
            variant="brand"
          />
        )}
      </div>

      {/* ── Gráficos ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* PatrimonioChart recebe loading para exibir overlay internamente */}
        <PatrimonioChart aportes={(aportes as Aporte[]) ?? []} />

        {/* Gastos por categoria */}
        <div className="rounded-2xl p-6 flex flex-col transition-all duration-300"
          style={{
            background: "linear-gradient(145deg,rgba(255,255,255,0.02) 0%,transparent 100%)",
            border: "0.5px solid rgba(255,255,255,0.06)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
          }}>
          <div className="flex items-center justify-between mb-4">
            <span className="font-display font-medium text-sm tracking-wide"
              style={{ color: "#7a6a52" }}>
              Gastos por Categoria
            </span>
            <Link href="/gastos"
              className="text-xs font-semibold transition-colors"
              style={{ color: "#e5591d" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = "0.7")}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = "1")}
            >
              Ver todos →
            </Link>
          </div>
          {loadingGastos ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "rgba(229,89,29,0.4)", borderTopColor: "transparent" }} />
            </div>
          ) : (
            <GastosChart gastos={(gastos as Gasto[]) ?? []} />
          )}
        </div>
      </div>

      {/* ── Últimos Lançamentos ──────────────────────────────────────────── */}
      <div className="rounded-2xl p-6 transition-all duration-300"
        style={{
          background: "linear-gradient(145deg,rgba(255,255,255,0.02) 0%,transparent 100%)",
          border: "0.5px solid rgba(255,255,255,0.06)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
        }}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold" style={{ color: "#e8d5b0" }}>
            Últimos Lançamentos
          </h3>
          <Link href="/investimentos"
            className="text-xs font-semibold transition-opacity"
            style={{ color: "#e5591d" }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.opacity = "0.7")}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.opacity = "1")}
          >
            Ver todos →
          </Link>
        </div>

        {loadingAportes ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <RowSkeleton key={i} />
            ))}
          </div>
        ) : ultimosAportes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ultimosAportes.map((aporte) => (
              <AporteItem key={aporte.id} aporte={aporte} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 gap-3"
            style={{ opacity: 0.5 }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.04)" }}>
              <Package size={18} color="#7a6a52" />
            </div>
            <span className="text-sm font-display" style={{ color: "#7a6a52" }}>
              Nenhum lançamento encontrado.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}