import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dadosMes } = body;

    if (!dadosMes) {
      return NextResponse.json({ error: 'Missing dadosMes' }, { status: 400 });
    }

    const GROK_API_KEY = process.env.GROK_API_KEY;
    if (!GROK_API_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const prompt = `Você é o estrategista financeiro sênior do KiNance. Sua missão é fornecer uma análise executiva, clara e profissional para o usuário.

Analise os dados financeiros fornecidos e gere um relatório de insight seguindo RIGIDAMENTE a estrutura abaixo, usando Markdown para uma formatação elegante:

### 📊 Diagnóstico Atual
(Uma análise profissional e direta sobre o momento financeiro do usuário em 1 ou 2 parágrafos curtos)

### 🚀 Recomendações Estratégicas
(Liste 3 pontos de ação práticos usando bullet points. Seja técnico mas acessível, focando em resultados.)

### 🎯 Visão de Longo Prazo
(Uma projeção inspiradora e baseada em dados sobre o potencial de crescimento do patrimônio.)

---
**Diretrizes de Estilo:**
- Use **negrito** para valores monetários e metas.
- Use no máximo 1 emoji por seção para manter a sobriedade.
- Garanta espaçamento duplo entre as seções.
- O tom deve ser profissional, consultivo e encorajador.
- Evite textos genéricos; use os dados fornecidos para personalizar a resposta.

Dados do mês:
- Patrimônio total: R$ ${dadosMes.patrimonio}
- Total investido: R$ ${dadosMes.totalInvestido}
- Renda passiva (dividendos): R$ ${dadosMes.dividendos}
- Rentabilidade média anualizada: ${dadosMes.dyPM}%
- Gastos do mês: R$ ${dadosMes.gastos}
- Reserva de emergência: R$ ${dadosMes.reserva} (meta: R$ ${dadosMes.reservaMeta})
- Investimento médio mensal: R$ ${dadosMes.aportesMedio}
- Ativos na carteira: ${dadosMes.tickers}

Importante: Responda em português brasileiro.`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 700,
        temperature: 0.7,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.error("[API] Erro detalhado da Groq:", errorData);
      throw new Error(errorData.error?.message || errorData.error || `Groq API ${res.status}`);
    }
    const json = await res.json();
    const insight = json.choices?.[0]?.message?.content ?? null;

    return NextResponse.json({ insight });
  } catch (error: any) {
    console.error("[API] Erro ao buscar insight:", error.message);
    return NextResponse.json({ error: error.message || 'Failed to generate insight' }, { status: 500 });
  }
}
