import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ticker = searchParams.get('ticker');

  if (!ticker) {
    return NextResponse.json({ error: 'Ticker is required' }, { status: 400 });
  }

  const BRAPI_TOKEN = process.env.BRAPI_TOKEN;
  if (!BRAPI_TOKEN) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    // Supports comma-separated tickers for batch quotes (e.g. MXRF11,PETR4)
    const tickerList = ticker.toUpperCase().split(',').map(t => t.trim()).join(',');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s timeout

    const res = await fetch(
      `https://brapi.dev/api/quote/${tickerList}?token=${BRAPI_TOKEN}`,
      { signal: controller.signal }
    );

    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[API/brapi] HTTP ${res.status} for tickers: ${tickerList}`);
      return NextResponse.json({ error: `Brapi HTTP ${res.status}`, results: [] }, { status: 200 });
    }

    const json = await res.json();
    
    // Return with Cache-Control header for CDN caching (5 min)
    return NextResponse.json(json, {
      headers: { 'Cache-Control': 's-maxage=300, stale-while-revalidate=60' },
    });
  } catch (error: any) {
    console.error("[API/brapi] Erro:", error.message);
    // Always return a valid JSON so the client doesn't crash
    return NextResponse.json({ error: error.message, results: [] }, { status: 200 });
  }
}
