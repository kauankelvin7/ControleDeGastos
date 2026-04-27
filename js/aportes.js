// js/aportes.js — KiNance Aportes
import { requireAuth, checkOnboarding } from "./auth.js";
import { onAportes, addAporte, deleteAporte } from "./db.js";
import { getCotacao } from "./api.js";
import { renderSidebar } from "./sidebar.js";
import {
  formatBRL, formatDateShort, showToast, debounce,
  calcularPrecoMedio, calcularTotalCotas, calcularTotalInvestido
} from "./utils.js";
import { TICKERS_SUGERIDOS } from "./constants.js";

let user = null;
let profile = null;
let unsubAportes = null;
let _aportes = [];
let _tipoAtual = "compra";
let _cotacaoAtual = null;

// ── Init ──────────────────────────────────────────────────
async function init() {
  try {
    user    = await requireAuth();
    profile = await checkOnboarding(user.uid);
    if (!profile) return;

    renderSidebar(user, profile);

    // Preenche datalist com tickers sugeridos + do perfil
    const dl = document.getElementById("tickers-list");
    const tickers = [...new Set([...TICKERS_SUGERIDOS, ...(profile.tickers || [])])];
    dl.innerHTML = tickers.map(t => `<option value="${t}">`).join("");

    unsubAportes = onAportes(user.uid, (data) => {
      _aportes = data;
      renderLista();
      renderPMSummary();
    });
  } catch (e) {
    console.error("[KiNance] aportes init:", e);
  }
}

// ── Tipo compra/venda ─────────────────────────────────────
window.setTipo = (tipo) => {
  _tipoAtual = tipo;
  document.getElementById("tipo-aporte").value = tipo;
  document.getElementById("tab-compra").className = "tipo-tab" + (tipo === "compra" ? " active--compra" : "");
  document.getElementById("tab-venda").className  = "tipo-tab" + (tipo === "venda"  ? " active--venda"  : "");
  document.getElementById("tab-compra").setAttribute("aria-pressed", tipo === "compra");
  document.getElementById("tab-venda").setAttribute("aria-pressed",  tipo === "venda");
};

// ── Busca cotação ao digitar ticker ──────────────────────
const fetchCotacaoDebounced = debounce(async (ticker) => {
  const badge = document.getElementById("cotacao-badge");
  const upperTicker = ticker.toUpperCase();

  if (!/^[A-Z]{4}\d{2}$/.test(upperTicker)) {
    badge.textContent = "Digite o ticker completo (ex: MXRF11)";
    badge.className = "cotacao-badge";
    _cotacaoAtual = null;
    return;
  }

  badge.textContent = "Buscando cotação...";
  badge.className = "cotacao-badge cotacao-loading";

  const cotacao = await getCotacao(upperTicker);
  _cotacaoAtual = cotacao;

  if (cotacao) {
    const sinal = cotacao.regularMarketChangePercent >= 0 ? "▲" : "▼";
    badge.textContent = `${upperTicker}: ${formatBRL(cotacao.regularMarketPrice)} ${sinal} ${Math.abs(cotacao.regularMarketChangePercent).toFixed(2)}%`;
    badge.className = "cotacao-badge loaded";

    // Preenche valor por cota automaticamente
    const elValor = document.getElementById("valor-cota");
    if (!elValor.value) {
      elValor.value = cotacao.regularMarketPrice.toFixed(2);
      calcTotal();
    }
  } else {
    badge.textContent = "Cotação indisponível — preencha o valor manualmente";
    badge.className = "cotacao-badge error";
  }
}, 600);

window.onTickerChange = (val) => {
  fetchCotacaoDebounced(val.toUpperCase());
};

// ── Calcular total em tempo real ──────────────────────────
window.calcTotal = () => {
  const cotas     = parseFloat(document.getElementById("cotas").value) || 0;
  const valorCota = parseFloat(document.getElementById("valor-cota").value) || 0;
  const total     = cotas * valorCota;
  document.getElementById("total-display").textContent = formatBRL(total);
};

// ── Submit ────────────────────────────────────────────────
document.getElementById("form-aporte").addEventListener("submit", async (e) => {
  e.preventDefault();

  const errEl = document.getElementById("form-error");
  errEl.style.display = "none";

  const ticker    = document.getElementById("ticker").value.trim().toUpperCase();
  const cotas     = parseFloat(document.getElementById("cotas").value);
  const valorCota = parseFloat(document.getElementById("valor-cota").value);
  const observacao = document.getElementById("observacao").value.trim();
  const tipo      = _tipoAtual;

  const btn = document.getElementById("btn-aporte");
  btn.disabled = true;
  btn.textContent = "Registrando...";

  try {
    await addAporte(user.uid, { ticker, cotas, valorCota, tipo, observacao });
    showToast("Aporte registrado! 🎉", "success");
    // Reset form
    document.getElementById("form-aporte").reset();
    document.getElementById("total-display").textContent = "R$ 0,00";
    document.getElementById("cotacao-badge").textContent = "Buscar cotação...";
    document.getElementById("cotacao-badge").className = "cotacao-badge";
    _cotacaoAtual = null;
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Registrar Aporte";
  }
});

// ── PM Summary ────────────────────────────────────────────
function renderPMSummary() {
  const summary = document.getElementById("pm-summary");
  if (_aportes.length === 0) { summary.style.display = "none"; return; }

  summary.style.display = "flex";
  const totalCotas = calcularTotalCotas(_aportes);
  const pm = calcularPrecoMedio(_aportes);
  const totalInvest = calcularTotalInvestido(_aportes);

  document.getElementById("pm-total-cotas").textContent = totalCotas.toFixed(2);
  document.getElementById("pm-preco").textContent = formatBRL(pm);
  document.getElementById("pm-total-invest").textContent = formatBRL(totalInvest);
}

// ── Render lista ──────────────────────────────────────────
function renderLista() {
  const container = document.getElementById("lista-aportes");

  if (_aportes.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none"><rect x="8" y="8" width="32" height="32" rx="4" stroke="currentColor" stroke-width="2"/><path d="M16 24h16M24 16v16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        <p>Nenhum aporte registrado ainda.</p>
      </div>`;
    return;
  }

  container.innerHTML = _aportes.map(a => `
    <div class="aporte-item aporte-item--${a.tipo}" id="aporte-${a.id}">
      <div class="aporte-info">
        <span class="aporte-ticker">${a.ticker}</span>
        <span class="aporte-details">${a.cotas} cotas × ${formatBRL(a.valorCota)}</span>
        <span class="aporte-date">${formatDateShort(a.data)}</span>
        ${a.observacao ? `<span style="font-size:var(--text-xs);color:var(--text-muted);font-style:italic">${a.observacao}</span>` : ""}
      </div>
      <div class="aporte-value">
        <span class="badge badge--${a.tipo === "compra" ? "success" : "danger"}">${a.tipo}</span>
        <span class="aporte-total">${formatBRL(a.valorTotal)}</span>
        <button class="btn-icon" aria-label="Excluir aporte de ${formatDateShort(a.data)}" onclick="excluirAporte('${a.id}')">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>
  `).join("");
}

window.excluirAporte = async (id) => {
  if (!confirm("Excluir este aporte?")) return;
  try {
    await deleteAporte(user.uid, id);
    showToast("Aporte excluído", "warning");
  } catch (err) {
    showToast("Erro ao excluir", "error");
  }
};

// ── Cleanup ───────────────────────────────────────────────
window.addEventListener("pagehide", () => unsubAportes?.());

init();
