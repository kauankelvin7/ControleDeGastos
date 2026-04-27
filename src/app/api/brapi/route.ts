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
    const res = await fetch(
      `https://brapi.dev/api/quote/${ticker.toUpperCase()}?token=${BRAPI_TOKEN}&modules=dividends`,
      { next: { revalidate: 300 } } // Cache por 5 minutos nativo do Next.js
    );

    if (!res.ok) {
      throw new Error(`Brapi HTTP ${res.status}`);
    }

    const json = await res.json();
    return NextResponse.json(json);
  } catch (error: any) {
    console.error("[API] Erro ao buscar cotação:", error.message);
    return NextResponse.json({ error: 'Failed to fetch quote' }, { status: 500 });
  }
}
