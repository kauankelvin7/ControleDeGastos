// js/relatorio.js — KiNance Relatório + Grok AI
import { requireAuth, checkOnboarding } from "./auth.js";
import { onAportes, onDividendos, onGastos, onReserva } from "./db.js";
import { getCotacao } from "./api.js";
import { gerarInsightFinanceiro } from "./grok.js";
import { renderSidebar } from "./sidebar.js";
import {
  formatBRL, getMesKey,
  calcularPrecoMedio, calcularTotalCotas, calcularTotalInvestido,
  calcularPatrimonio, calcularDYs, calcularSaldoReserva
} from "./utils.js";

let user = null;
let profile = null;
let unsubAportes = null, unsubDividendos = null, unsubGastos = null, unsubReserva = null;
let _aportes = [], _dividendos = [], _gastos = [], _reserva = [];
let _cotacao = null;
let _mesKey = getMesKey();

async function init() {
  try {
    user    = await requireAuth();
    profile = await checkOnboarding(user.uid);
    if (!profile) return;

    renderSidebar(user, profile);
    populateMesSelect();

    const ticker = (profile.tickers || ["MXRF11"])[0];
    _cotacao = await getCotacao(ticker);

    subscribeData(_mesKey);
  } catch (e) {
    console.error("[KiNance] relatorio init:", e);
  }
}

function populateMesSelect() {
  const select = document.getElementById("mes-select");
  const now = new Date();
  const opts = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    opts.push(`<option value="${key}" ${key === _mesKey ? "selected" : ""}>${label.charAt(0).toUpperCase() + label.slice(1)}</option>`);
  }
  select.innerHTML = opts.join("");
  select.addEventListener("change", (e) => {
    _mesKey = e.target.value;
    // Cancela listeners anteriores
    unsubGastos?.();
    unsubDividendos?.();
    subscribeData(_mesKey);
  });
}

function subscribeData(mesKey) {
  const uid = user.uid;

  unsubAportes?.();
  unsubDividendos?.();
  unsubGastos?.();
  unsubReserva?.();

  unsubAportes = onAportes(uid, (data) => {
    _aportes = data;
    renderResumo();
  });

  unsubDividendos = onDividendos(uid, (data) => {
    _dividendos = data.filter(d => {
      if (!d.data) return false;
      const dt = d.data?.toDate ? d.data.toDate() : new Date(d.data);
      const k = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;
      return k === mesKey;
    });
    renderResumo();
  });

  unsubGastos = onGastos(uid, mesKey, (data) => {
    _gastos = data;
    renderResumo();
  }, (err) => console.warn("[KiNance] relatorio gastos:", err));

  unsubReserva = onReserva(uid, (data) => {
    _reserva = data;
    renderResumo();
  });
}

function renderResumo() {
  const cotacaoAtual  = _cotacao?.regularMarketPrice ?? 0;
  const patrimonio    = calcularPatrimonio(_aportes, cotacaoAtual);
  const totalInvest   = calcularTotalInvestido(_aportes);
  const lucro         = patrimonio - totalInvest;
  const dividendos    = _dividendos.reduce((acc, d) => acc + (d.valorRecebido ?? 0), 0);
  const gastos        = _gastos.reduce((acc, g) => acc + (g.valor ?? 0), 0);
  const reserva       = calcularSaldoReserva(_reserva);
  const pm            = calcularPrecoMedio(_aportes);
  const ultimoDiv     = _dividendos[0]?.valorPorCota ?? 0;
  const { dyPM }      = calcularDYs(ultimoDiv, pm, cotacaoAtual);

  const s = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  s("rel-patrimonio", cotacaoAtual > 0 ? formatBRL(patrimonio) : "—");
  s("rel-investido",  formatBRL(totalInvest));
  s("rel-dividendos", formatBRL(dividendos));
  s("rel-gastos",     formatBRL(gastos));
  s("rel-reserva",    formatBRL(reserva));
  s("rel-dy",         `${dyPM.toFixed(2)}%`);

  const elLucro = document.getElementById("rel-lucro");
  if (elLucro) {
    const sign = lucro >= 0 ? "+" : "";
    elLucro.textContent = lucro !== 0 ? `${sign}${formatBRL(lucro)}` : "—";
    elLucro.className = `summary-row-value ${lucro >= 0 ? "positive" : "negative"}`;
  }
}

// ── Análise Grok ──────────────────────────────────────────
window.analisarComIA = async () => {
  const btn = document.getElementById("btn-analisar");
  const area = document.getElementById("area-insight");

  btn.disabled = true;
  btn.textContent = "Analisando...";
  area.innerHTML = `<div class="skeleton skeleton--full" style="margin-top:var(--space-4);height:120px;border-radius:var(--radius-md)"></div>`;

  const cotacaoAtual = _cotacao?.regularMarketPrice ?? 0;
  const patrimonio   = calcularPatrimonio(_aportes, cotacaoAtual);
  const totalInvest  = calcularTotalInvestido(_aportes);
  const dividendos   = _dividendos.reduce((acc, d) => acc + (d.valorRecebido ?? 0), 0);
  const gastos       = _gastos.reduce((acc, g) => acc + (g.valor ?? 0), 0);
  const reserva      = calcularSaldoReserva(_reserva);
  const pm           = calcularPrecoMedio(_aportes);
  const ultimoDiv    = _dividendos[0]?.valorPorCota ?? 0;
  const { dyPM }     = calcularDYs(ultimoDiv, pm, cotacaoAtual);
  const aportesMes   = _aportes.filter(a => {
    if (!a.data) return false;
    const dt = a.data?.toDate ? a.data.toDate() : new Date(a.data);
    const k = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;
    return k === _mesKey;
  });
  const aportesMedio = aportesMes.length > 0
    ? aportesMes.reduce((acc, a) => acc + (a.valorTotal ?? 0), 0) / aportesMes.length
    : 0;

  const insight = await gerarInsightFinanceiro({
    patrimonio, totalInvestido: totalInvest, dividendos, dyPM,
    gastos, reserva, reservaMeta: profile?.reservaEmergenciaAlvo ?? 15000,
    aportesMedio, tickers: profile?.tickers || ["MXRF11"],
  });

  if (insight) {
    area.innerHTML = `
      <div class="card card--highlight" style="margin-top:var(--space-4)">
        <div class="label" style="margin-bottom:var(--space-3)">✨ Análise KiNance · Grok AI</div>
        <div class="insight-text">${insight.replace(/\n/g, "<br>")}</div>
      </div>
    `;
  } else {
    area.innerHTML = `
      <div class="card" style="margin-top:var(--space-4)">
        <p style="color:var(--text-muted);font-family:var(--font-display);font-size:var(--text-sm)">Análise indisponível. Verifique sua conexão e tente novamente.</p>
      </div>
    `;
  }

  btn.disabled = false;
  btn.textContent = "✨ Analisar novamente";
};

// ── Export PDF ────────────────────────────────────────────
window.exportarPDF = () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  // Header laranja
  doc.setFillColor(229, 89, 29);
  doc.rect(0, 0, 210, 22, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("KiNance", 15, 14);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const [ano, mes] = _mesKey.split("-");
  const mesNome = new Date(parseInt(ano), parseInt(mes)-1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  doc.text(`Relatório — ${mesNome}`, 80, 14);

  // Corpo
  doc.setTextColor(20, 20, 20);
  let y = 35;
  const linha = (label, valor) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(label, 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(valor), 190, y, { align: "right" });
    y += 9;
  };

  const cotacaoAtual = _cotacao?.regularMarketPrice ?? 0;
  const patrimonio   = calcularPatrimonio(_aportes, cotacaoAtual);
  const totalInvest  = calcularTotalInvestido(_aportes);
  const dividendos   = _dividendos.reduce((acc, d) => acc + (d.valorRecebido ?? 0), 0);
  const gastos       = _gastos.reduce((acc, g) => acc + (g.valor ?? 0), 0);
  const reserva      = calcularSaldoReserva(_reserva);

  linha("Patrimônio total:", cotacaoAtual > 0 ? formatBRL(patrimonio) : "—");
  linha("Total investido:", formatBRL(totalInvest));
  linha("Dividendos recebidos:", formatBRL(dividendos));
  linha("Gastos do mês:", formatBRL(gastos));
  linha("Reserva de emergência:", formatBRL(reserva));

  // Footer
  y += 5;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(`Gerado pelo KiNance em ${new Date().toLocaleDateString("pt-BR")}`, 15, y);

  doc.save(`kinance-${ano}-${mes}.pdf`);
};

window.addEventListener("pagehide", () => {
  unsubAportes?.(); unsubDividendos?.();
  unsubGastos?.(); unsubReserva?.();
});

init();
