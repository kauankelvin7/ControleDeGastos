// js/dividendos.js — KiNance Dividendos
import { requireAuth, checkOnboarding } from "./auth.js";
import { onAportes, onDividendos, addDividendo, deleteDividendo } from "./db.js";
import { getCotacao } from "./api.js";
import { renderSidebar } from "./sidebar.js";
import {
  formatBRL, formatDateShort, showToast, debounce,
  calcularPrecoMedio, calcularTotalCotas, calcularDYs
} from "./utils.js";
import { TICKERS_SUGERIDOS } from "./constants.js";

let user = null;
let profile = null;
let unsubAportes = null;
let unsubDividendos = null;
let _aportes = [];
let _dividendos = [];
let _cotacaoAtual = null;

async function init() {
  try {
    user    = await requireAuth();
    profile = await checkOnboarding(user.uid);
    if (!profile) return;

    renderSidebar(user, profile);

    // Preenche datalist
    const dl = document.getElementById("div-tickers-list");
    const tickers = [...new Set([...TICKERS_SUGERIDOS, ...(profile.tickers || [])])];
    dl.innerHTML = tickers.map(t => `<option value="${t}">`).join("");

    // Preenche competência com mês atual
    const now = new Date();
    document.getElementById("div-competencia").value =
      `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;

    unsubAportes = onAportes(user.uid, (data) => {
      _aportes = data;
      updateDYCards();
    });

    unsubDividendos = onDividendos(user.uid, (data) => {
      _dividendos = data;
      renderLista();
    });
  } catch (e) {
    console.error("[KiNance] dividendos init:", e);
  }
}

// ── Busca cotação ao digitar ticker ──────────────────────
const fetchCotacaoDebounced = debounce(async (ticker) => {
  const badge = document.getElementById("div-cotacao-badge");
  if (!/^[A-Z]{4}\d{2}$/.test(ticker)) {
    badge.textContent = "Digite o ticker completo";
    badge.className = "cotacao-badge";
    return;
  }

  badge.textContent = "Buscando...";
  badge.className = "cotacao-badge cotacao-loading";

  const cotacao = await getCotacao(ticker);
  _cotacaoAtual = cotacao;

  if (cotacao) {
    badge.textContent = `${ticker}: ${formatBRL(cotacao.regularMarketPrice)}`;
    badge.className = "cotacao-badge loaded";

    // Preenche cotas automaticamente do histórico
    const cotasAtuais = calcularTotalCotas(_aportes.filter(a => a.ticker === ticker));
    if (cotasAtuais > 0) {
      document.getElementById("div-total-cotas").value = cotasAtuais.toFixed(2);
      document.getElementById("div-cotas-hint").textContent = `Calculado do seu histórico de aportes em ${ticker}`;
      calcDivTotal();
    }

    // Tenta preencher valor por cota com último dividendo da API
    const ultimoDiv = cotacao.dividendsData?.cashDividends?.[0];
    if (ultimoDiv?.rate && !document.getElementById("div-valor-cota").value) {
      document.getElementById("div-valor-cota").value = ultimoDiv.rate.toFixed(4);
      calcDivTotal();
    }

    updateDYCards();
  } else {
    badge.textContent = "Cotação indisponível";
    badge.className = "cotacao-badge error";
  }
}, 600);

window.onDivTickerChange = (val) => {
  fetchCotacaoDebounced(val.toUpperCase());
};

// ── Calcular total ────────────────────────────────────────
window.calcDivTotal = () => {
  const valorCota  = parseFloat(document.getElementById("div-valor-cota").value) || 0;
  const totalCotas = parseFloat(document.getElementById("div-total-cotas").value) || 0;
  document.getElementById("div-total-display").textContent = formatBRL(valorCota * totalCotas);
};

// ── Atualiza cards DY ─────────────────────────────────────
function updateDYCards() {
  if (_aportes.length === 0) return;
  const pm = calcularPrecoMedio(_aportes);
  const cotacaoAtual = _cotacaoAtual?.regularMarketPrice ?? 0;
  const ultimoDiv = _dividendos[0]?.valorPorCota;

  if (!ultimoDiv) return;
  const { dyPM, dyAtual } = calcularDYs(ultimoDiv, pm, cotacaoAtual);

  const elPM    = document.getElementById("dy-pm");
  const elAtual = document.getElementById("dy-atual");
  if (elPM)    elPM.textContent    = `${dyPM.toFixed(2)}%`;
  if (elAtual) elAtual.textContent = `${dyAtual.toFixed(2)}%`;
}

// ── Submit ────────────────────────────────────────────────
document.getElementById("form-dividendo").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("div-error");
  errEl.style.display = "none";

  const ticker      = document.getElementById("div-ticker").value.trim().toUpperCase();
  const valorPorCota = parseFloat(document.getElementById("div-valor-cota").value);
  const totalCotas   = parseFloat(document.getElementById("div-total-cotas").value);
  const competencia  = document.getElementById("div-competencia").value;
  const reinvestido  = document.getElementById("div-reinvestido").checked;

  const btn = document.getElementById("btn-dividendo");
  btn.disabled = true;
  btn.textContent = "Registrando...";

  try {
    await addDividendo(user.uid, { ticker, valorPorCota, totalCotas, competencia, reinvestido });
    showToast("Dividendo registrado! 💰", "success");
    document.getElementById("form-dividendo").reset();
    document.getElementById("div-total-display").textContent = "R$ 0,00";
    document.getElementById("div-cotacao-badge").textContent = "Digite o ticker para buscar cotação";
    document.getElementById("div-cotacao-badge").className = "cotacao-badge";
    _cotacaoAtual = null;
    // Re-set competência
    const now = new Date();
    document.getElementById("div-competencia").value =
      `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Registrar Dividendo";
  }
});

// ── Render lista ──────────────────────────────────────────
function renderLista() {
  const container = document.getElementById("lista-dividendos");

  if (_dividendos.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Nenhum dividendo registrado ainda.</p></div>`;
    return;
  }

  container.innerHTML = _dividendos.map(d => `
    <div class="list-item list-item--amber" style="margin-bottom:var(--space-2)">
      <div style="flex:1">
        <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:4px">
          <span class="ticker-tag">${d.ticker}</span>
          ${d.reinvestido ? '<span class="badge badge--success">Reinvestido</span>' : ""}
        </div>
        <div style="font-family:var(--font-display);font-size:var(--text-xs);color:var(--text-muted)">${formatDateShort(d.data)} · ${d.competencia || "—"}</div>
        <div style="font-family:var(--font-display);font-size:var(--text-xs);color:var(--text-secondary);margin-top:2px">${d.totalCotas} cotas × R$ ${Number(d.valorPorCota).toFixed(4)}</div>
      </div>
      <div style="text-align:right;display:flex;flex-direction:column;gap:4px;align-items:flex-end">
        <span style="font-family:var(--font-display);font-size:var(--text-base);font-weight:700;color:var(--amber)">${formatBRL(d.valorRecebido)}</span>
        <button class="btn-icon" aria-label="Excluir dividendo" onclick="excluirDividendo('${d.id}')">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>
  `).join("");
}

window.excluirDividendo = async (id) => {
  if (!confirm("Excluir este dividendo?")) return;
  try {
    await deleteDividendo(user.uid, id);
    showToast("Dividendo excluído", "warning");
  } catch (err) {
    showToast("Erro ao excluir", "error");
  }
};

window.addEventListener("pagehide", () => { unsubAportes?.(); unsubDividendos?.(); });
init();
