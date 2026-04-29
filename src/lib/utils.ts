export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function maskCurrency(value: string) {
  // Remove tudo que não é dígito
  let v = value.replace(/\D/g, "");
  if (!v) return "";
  
  // Converte para centavos e formata
  const n = parseInt(v, 10);
  return (n / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseCurrency(value: string): number {
  if (!value) return 0;
  // Remove pontos de milhar e troca vírgula por ponto
  return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
}

import { subMonths, startOfMonth } from "date-fns";

export interface AporteHistorico {
  data: string;
  valorTotal: number | string;
  tipo?: "compra" | "venda";
  ativo?: string;
}

/**
 * Calcula a média de aporte mensal dos últimos N meses a partir do histórico bruto.
 * Leva em conta o saldo líquido (compra - venda) no período.
 */
export function calcularAporteMedioMensal(
  aportes: AporteHistorico[],
  meses = 3
): number {
  if (!aportes?.length) return 0;

  const cutoff = startOfMonth(subMonths(new Date(), meses)).getTime();

  const totalRecente = aportes
    .filter((a) => {
      const t = new Date(a.data).getTime();
      return t >= cutoff;
    })
    .reduce((acc, a) => {
      const v = Number(a.valorTotal ?? 0);
      return a.tipo === "venda" ? acc - v : acc + v;
    }, 0);

  // Divide pelo período de meses solicitado
  return Math.max(0, totalRecente / meses);
}

/**
 * Projeta em quantos meses o usuário atinge um valor alvo dado o aporte médio.
 */
export function projetarMeses(
  valorAtual: number,
  valorAlvo: number,
  aporteMensal: number
): number | null {
  const falta = valorAlvo - valorAtual;
  if (falta <= 0) return 0;
  if (aporteMensal <= 0) return null;
  return Math.ceil(falta / aporteMensal);
}
