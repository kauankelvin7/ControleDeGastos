// js/grok.js — KiNance xAI Grok Agent
const GROK_API_KEY = ""; // Insira sua chave da Groq aqui (ou use variáveis de ambiente)
const GROK_URL     = "https://api.x.ai/v1/chat/completions";

/**
 * Envia dados financeiros para o Grok e retorna análise formatada.
 * Usado na tela de Relatório.
 */
export async function gerarInsightFinanceiro(dadosMes) {
  const patrimonio     = Number(dadosMes.patrimonio     || 0).toFixed(2);
  const totalInvestido = Number(dadosMes.totalInvestido || 0).toFixed(2);
  const dividendos     = Number(dadosMes.dividendos     || 0).toFixed(2);
  const dyPM           = Number(dadosMes.dyPM           || 0).toFixed(2);
  const gastos         = Number(dadosMes.gastos         || 0).toFixed(2);
  const reserva        = Number(dadosMes.reserva        || 0).toFixed(2);
  const reservaMeta    = Number(dadosMes.reservaMeta    || 0).toFixed(2);
  const aportesMedio   = Number(dadosMes.aportesMedio   || 0).toFixed(2);
  const tickers        = Array.isArray(dadosMes.tickers) ? dadosMes.tickers.join(", ") : "—";

  const prompt = `Você é um analista financeiro especialista em FIIs (Fundos de Investimento Imobiliário) no Brasil.
Analise os dados financeiros mensais abaixo e forneça:
1. Um diagnóstico conciso (3-4 linhas) da saúde financeira do mês
2. 2-3 recomendações objetivas e práticas
3. Uma projeção simplificada baseada na tendência atual

Dados do mês:
- Patrimônio total: R$ ${patrimonio}
- Total investido: R$ ${totalInvestido}
- Dividendos recebidos: R$ ${dividendos}
- DY médio (PM): ${dyPM}%
- Gastos do mês: R$ ${gastos}
- Reserva de emergência: R$ ${reserva} (meta: R$ ${reservaMeta})
- Aporte médio mensal: R$ ${aportesMedio}
- Tickers na carteira: ${tickers}

Responda em português, de forma direta e prática. Sem introduções longas. Use bullet points (•) para recomendações.`;

  try {
    const res = await fetch(GROK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-3-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) throw new Error(`Grok API ${res.status}`);
    const json = await res.json();
    return json.choices?.[0]?.message?.content ?? null;
  } catch (err) {
    console.warn("[KiNance] Grok offline:", err.message);
    return null;
  }
}
