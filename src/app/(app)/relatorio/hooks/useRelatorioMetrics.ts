import { useMemo } from "react";
import { useAportes, useGastos, useReserva } from "@/hooks/useFirebaseData";
import { calcularAporteMedioMensal, type AporteHistorico } from "@/lib/utils";
import { subMonths } from "date-fns";
import { Aporte, Gasto, ReservaItem } from "@/types/financeiro";

export function useRelatorioMetrics() {
  const { data: aportes, isLoading: load1 } = useAportes();
  const { data: gastos, isLoading: load2 } = useGastos();
  const { data: reserva, isLoading: load3 } = useReserva();

  const metrics = useMemo(() => {
    const aportesList = (aportes as Aporte[] | undefined) ?? [];
    const gastosList = (gastos as Gasto[] | undefined) ?? [];
    const reservaList = (reserva as ReservaItem[] | undefined) ?? [];

    const totalInvestido = aportesList.reduce((acc, cur) => {
      const v = Number(cur.valorTotal ?? 0);
      return cur.tipo === "venda" ? acc - v : acc + v;
    }, 0);

    const totalGastos = gastosList.reduce((acc, cur) => acc + Number(cur.valor ?? 0), 0);

    const totalReserva = reservaList.reduce((acc, cur) => acc + Number(cur.valor ?? 0), 0);
    const reservaMeta = Number(reservaList[0]?.meta ?? 15000);

    const tickers = [
      ...new Set(aportesList.map((a) => (a.ativo ?? "").toUpperCase().trim()).filter(Boolean)),
    ];

    const historicoAportes: AporteHistorico[] = aportesList.map((a) => ({
      data: a.data,
      valorTotal: a.valorTotal ?? 0,
      tipo: a.tipo as any,
      ativo: a.ativo,
    }));

    const aporteMedioMensal = calcularAporteMedioMensal(historicoAportes, 3);

    // Ritmo específico da RESERVA (últimos 3 meses)
    const ritmoReserva = (() => {
      const tresMesesAtras = subMonths(new Date(), 3);
      const aportesRecentes = reservaList.filter(item => new Date(item.data) >= tresMesesAtras);
      const totalRecente = aportesRecentes.reduce((acc, cur) => acc + Number(cur.valor || 0), 0);
      return totalRecente / 3;
    })();

    const mesesParaReserva = ritmoReserva > 0 
      ? Math.ceil(Math.max(reservaMeta - totalReserva, 0) / ritmoReserva) 
      : Infinity;

    return {
      totalInvestido,
      totalGastos,
      totalReserva,
      reservaMeta,
      tickers,
      aporteMedioMensal,
      ritmoReserva,
      mesesParaReserva,
      historicoAportes,
      patrimonio: totalInvestido + totalReserva,
      progressoReserva: Math.min((totalReserva / (reservaMeta || 1)) * 100, 100),
      sugeridoIA: totalGastos > 0 ? totalGastos * 6 : 15000,
      aporte6m: Math.max((reservaMeta - totalReserva) / 6, 0),
      aporte12m: Math.max((reservaMeta - totalReserva) / 12, 0),
      aporte24m: Math.max((reservaMeta - totalReserva) / 24, 0),
    };
  }, [aportes, gastos, reserva]);

  return {
    metrics,
    isLoading: load1 || load2 || load3
  };
}
