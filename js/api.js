// js/api.js — KiNance Brapi.dev Integration
const BRAPI_TOKEN = "roiqmHWKNwTDBtx9HsmYEz";
const BRAPI_BASE  = "https://brapi.dev/api";

const _cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function getCotacao(ticker) {
  const key = ticker.toUpperCase();
  const cached = _cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  try {
    const res = await fetch(
      `${BRAPI_BASE}/quote/${key}?token=${BRAPI_TOKEN}&modules=dividends`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const data = json.results?.[0];
    if (!data) throw new Error("Ticker não encontrado");
    _cache.set(key, { data, ts: Date.now() });
    return data;
  } catch (err) {
    console.warn(`[KiNance] Cotação offline para ${ticker}:`, err.message);
    return null;
  }
}

export async function getUltimoDividendo(ticker) {
  const cotacao = await getCotacao(ticker);
  return cotacao?.dividendsData?.cashDividends?.[0] ?? null;
}

export async function getCotacoes(tickers = []) {
  const results = await Promise.all(tickers.map(t => getCotacao(t)));
  return Object.fromEntries(tickers.map((t, i) => [t.toUpperCase(), results[i]]));
}
