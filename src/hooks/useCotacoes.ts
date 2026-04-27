"use client";

import { useQuery } from "@tanstack/react-query";

interface BrapiQuote {
  symbol: string;
  regularMarketPrice: number;
}

async function fetchQuotes(tickers: string[]): Promise<Record<string, number>> {
  if (tickers.length === 0) return {};

  // Batches in groups of 10 to respect API limits
  const unique = [...new Set(tickers)];
  const tickerStr = unique.join(",");

  const res = await fetch(`/api/brapi?ticker=${tickerStr}`);
  if (!res.ok) return {};

  const json = await res.json();
  const result: Record<string, number> = {};
  (json.results as BrapiQuote[] | undefined)?.forEach((q) => {
    result[q.symbol] = q.regularMarketPrice;
  });
  return result;
}

export function useCotacoes(tickers: string[]) {
  return useQuery({
    queryKey: ["cotacoes", tickers.sort().join(",")],
    queryFn: () => fetchQuotes(tickers),
    enabled: tickers.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutos — mesmo intervalo do cache da rota
    retry: 1,
  });
}
