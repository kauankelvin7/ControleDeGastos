"use client";

import { useQuery } from "@tanstack/react-query";

// ─── Types ────────────────────────────────────────────────────────────────────
interface BrapiQuote {
  symbol: string;
  regularMarketPrice: number;
}

export type CotacoesMap = Record<string, number>;

// ─── Fetcher ──────────────────────────────────────────────────────────────────
async function fetchQuotes(tickers: string[]): Promise<CotacoesMap> {
  if (tickers.length === 0) return {};

  // Deduplica e normaliza para uppercase antes de montar a query
  const unique = [...new Set(tickers.map((t) => t.toUpperCase().trim()))];
  const tickerStr = unique.join(",");

  let res: Response;
  try {
    res = await fetch(`/api/brapi?ticker=${tickerStr}`, {
      // Não armazena em cache do browser — o staleTime do React Query já cuida disso
      cache: "no-store",
    });
  } catch {
    // Falha de rede — retorna vazio para o componente usar fallback (avgPrice)
    return {};
  }

  if (!res.ok) return {};

  let json: { results?: BrapiQuote[] };
  try {
    json = await res.json();
  } catch {
    return {};
  }

  const result: CotacoesMap = {};
  json.results?.forEach((q) => {
    if (q.symbol && typeof q.regularMarketPrice === "number") {
      result[q.symbol.toUpperCase()] = q.regularMarketPrice;
    }
  });

  return result;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
/**
 * Busca cotações reais via Brapi para uma lista de tickers.
 *
 * @param tickers - Array de tickers ou `null`/`undefined` quando ainda não disponível.
 *                  Passar `null` desativa a query sem causar erro.
 */
export function useCotacoes(tickers: string[] | null | undefined) {
  // Ordena uma cópia — nunca muta o array original (causa re-renders infinitos)
  const sorted = tickers?.length ? [...tickers].sort() : [];
  const queryKey = ["cotacoes", sorted.join(",")];

  return useQuery<CotacoesMap>({
    queryKey,
    queryFn: () => fetchQuotes(sorted),
    // Só executa quando há tickers válidos
    enabled: sorted.length > 0,
    staleTime: 5 * 60 * 1000,   // 5 min — em sincronia com o cache da rota /api/brapi
    gcTime: 10 * 60 * 1000,     // mantém no cache por 10 min após desmonte
    retry: 1,
    // Retorna {} em vez de lançar erro — o componente usa avgPrice como fallback
    throwOnError: false,
  });
}