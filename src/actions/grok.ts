"use server";

import { AporteHistorico, calcularAporteMedioMensal, projetarMeses } from "@/lib/utils";

export interface DadosFinanceirosMes {
  patrimonio: number;
  totalInvestido: number;
  dividendos: number;
  dyPM: number;
  gastos: number;
  reserva: number;
  reservaMeta: number;
  // Calculado corretamente antes de chegar aqui (média real dos últimos 3 meses)
  aporteMedioMensal: number; // Geral/Investimentos
  ritmoReserva: number;      // Específico para a Reserva de Emergência
  tickers: string[];
  // Contexto temporal para a IA ser mais precisa
  historicoAportes: AporteHistorico[];
}

export interface GrokResponse {
  success: boolean;
  data?: string;
  error?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const API_KEY = process.env.GROQ_API_KEY || process.env.GROK_API_KEY;
const IS_GROQ = API_KEY?.startsWith("gsk_");

const API_URL = IS_GROQ
  ? "https://api.groq.com/openai/v1/chat/completions"
  : "https://api.x.ai/v1/chat/completions";

// Groq: llama mais capaz disponível; xAI: grok mais recente
const MODEL = IS_GROQ ? "llama-3.3-70b-versatile" : "grok-3-mini";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBRL = (val: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    val || 0
  );

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildPrompts(dados: DadosFinanceirosMes): {
  system: string;
  user: string;
} {
  const progressoReserva =
    dados.reservaMeta > 0
      ? ((dados.reserva / dados.reservaMeta) * 100).toFixed(1)
      : "0.0";

  const ativosFormatados =
    dados.tickers?.length > 0
      ? dados.tickers.join(", ")
      : "Nenhum ativo registrado";

  // Contexto de evolução: últimos 6 aportes para a IA entender tendência
  const historicoFormatado =
    dados.historicoAportes
      ?.slice(-6)
      .map(
        (a) =>
          `  • ${new Date(a.data).toLocaleDateString("pt-BR")} — ${
            a.tipo ?? "compra"
          } ${fmtBRL(Number(a.valorTotal ?? 0))}${a.ativo ? ` (${a.ativo})` : ""}`
      )
      .join("\n") || "  Sem histórico recente";

  // Projeção patrimonial simples para a IA usar como base
  const projecao12m =
    dados.patrimonio + dados.aporteMedioMensal * 12 - dados.gastos * 12;
  const mesesParaReserva = projetarMeses(
    dados.reserva,
    dados.reservaMeta,
    dados.ritmoReserva
  );

  const system = `Você é o estrategista financeiro sênior do KiNance, um assistente de finanças pessoais para investidores brasileiros. Sua comunicação é direta, técnica e consultiva — estilo Private Banking, sem enrolação.

Analise os dados e gere um relatório estruturado em Markdown seguindo EXATAMENTE este formato:

### 📊 Diagnóstico Atual
(2 parágrafos curtos. Analise proporção gastos/aportes, saúde da reserva e diversificação dos ativos. Seja específico com os números recebidos.)

---

### 🛡️ Estratégia de Reserva
(Baseado nos gastos mensais, avalie se a meta de reserva é adequada — recomendamos pelo menos 6 meses de gastos. Sugira 3 níveis de aporte mensal para atingir a meta em 6, 12 e 18 meses.)

---

### 🚀 Recomendações Estratégicas
- **(Ação 1):** descrição prática com base nos dados
- **(Ação 2):** descrição prática com base nos dados  
- **(Ação 3):** descrição prática com base nos dados

---

### 🎯 Projeção de Longo Prazo
(1 parágrafo com estimativa baseada no aporte médio real. Mencione explicitamente a projeção de 12 meses.)

---

**Regras invioláveis:**
- Responda APENAS em Português do Brasil
- NÃO invente dados — use exclusivamente os números fornecidos
- Use **negrito** para valores monetários e percentuais relevantes
- Tom encorajador mas realista — não exagere nem minimize
- Pule OBRIGATORIAMENTE uma linha entre o título (###) e o conteúdo.`;

  const user = `SNAPSHOT FINANCEIRO ATUAL:
- Patrimônio Total: ${fmtBRL(dados.patrimonio)}
- Total Investido (custo): ${fmtBRL(dados.totalInvestido)}
- Renda Passiva (Dividendos): ${fmtBRL(dados.dividendos)}
- DY médio sobre PM: ${dados.dyPM.toFixed(2)}%
- Gastos Totais Registrados: ${fmtBRL(dados.gastos)}
- Reserva de Emergência: ${fmtBRL(dados.reserva)} / ${fmtBRL(dados.reservaMeta)} (${progressoReserva}% da meta)
- Aporte p/ Reserva (Ritmo Real): ${fmtBRL(dados.ritmoReserva)}/mês
- Aporte p/ Investimentos (Geral): ${fmtBRL(dados.aporteMedioMensal)}/mês
- Ativos na Carteira: ${ativosFormatados}

HISTÓRICO RECENTE DE APORTES:
${historicoFormatado}

CONTEXTO CALCULADO PARA ANÁLISE:
- Projeção patrimonial em 12 meses (aporte médio − gastos): ${fmtBRL(projecao12m)}
- Meses estimados para completar reserva (ritmo de reserva): ${
    mesesParaReserva === null
      ? "Indeterminado (sem aportes recentes)"
      : mesesParaReserva === 0
      ? "Meta já atingida"
      : `~${mesesParaReserva} meses`
  }
- Relação gastos/aporte global: ${
    dados.aporteMedioMensal > 0
      ? ((dados.gastos / dados.aporteMedioMensal) * 100).toFixed(1) + "%"
      : "N/A"
  }`;

  return { system, user };
}

// ─── Action Principal ─────────────────────────────────────────────────────────

export async function gerarInsightFinanceiro(
  dados: DadosFinanceirosMes
): Promise<GrokResponse> {
  if (!API_KEY) {
    console.error(
      "[KiNance] API Key ausente. Configure GROQ_API_KEY ou GROK_API_KEY no .env"
    );
    return {
      success: false,
      error: "Serviço de IA indisponível — chave não configurada.",
    };
  }

  const { system, user } = buildPrompts(dados);

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        max_tokens: 1200, // era 750 — insuficiente para 3 seções completas
        temperature: 0.55, // levemente mais focado que 0.6
        top_p: 0.9,
      }),
      signal: AbortSignal.timeout(25000), // era 20s — modelos maiores precisam de mais
    });

    if (!res.ok) {
      const errorBody = await res.text().catch(() => "sem detalhes");
      console.error(`[KiNance] API ${res.status}:`, errorBody);
      throw new Error(`API retornou ${res.status}`);
    }

    const json = await res.json();
    const insight = json.choices?.[0]?.message?.content?.trim();

    if (!insight) throw new Error("Resposta da IA veio vazia.");

    return { success: true, data: insight };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[KiNance IA Error]:", msg);

    if (err instanceof Error && err.name === "TimeoutError") {
      return {
        success: false,
        error: "A análise está demorando demais. Tente novamente.",
      };
    }

    return {
      success: false,
      error: "Não foi possível gerar a análise agora. Tente em instantes.",
    };
  }
}