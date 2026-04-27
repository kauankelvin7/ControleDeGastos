// js/dashboard.js — KiNance Dashboard
import { requireAuth, checkOnboarding, logout } from "./auth.js";
import { onAportes, onDividendos, onGastos, onReserva } from "./db.js";
import { getCotacao } from "./api.js";
import { renderSidebar } from "./sidebar.js";
import {
  formatBRL, formatDateShort, getGreeting,
  calcularPrecoMedio, calcularTotalCotas, calcularTotalInvestido,
  calcularPatrimonio, calcularDYs, calcularSaldoReserva, getMesKey
} from "./utils.js";

let user = null;
let profile = null;
let unsubAportes = null;
let unsubDividendos = null;
let unsubGastos = null;
let unsubReserva = null;
let chartInstance = null;

// Estado local
let _aportes = [];
let _dividendos = [];
let _gastos = [];
let _reserva = [];
let _cotacao = null;

// ── Init ──────────────────────────────────────────────────
window._kinanceLogout = logout;

async function init() {
  try {
    user = await requireAuth();
    profile = await checkOnboarding(user.uid);
    if (!profile) return;

    renderSidebar(user, profile);
    renderHeader();
    await loadCotacoes();
    subscribeData();
  } catch (e) {
    console.error("[KiNance] Dashboard init:", e);
  }
}

function renderHeader() {
  const greeting = document.getElementById("greeting");
  const userName  = document.getElementById("user-name");
  const todayDate = document.getElementById("today-date");
  const avatarBtn = document.getElementById("avatar-btn");

  if (greeting)  greeting.textContent  = getGreeting();
  if (userName)  userName.textContent  = profile.nome || "Investidor";
  if (avatarBtn) avatarBtn.textContent = (profile.nome || "K")[0].toUpperCase();

  const now = new Date();
  if (todayDate) todayDate.textContent = now.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
}

async function loadCotacoes() {
  const tickers = profile?.tickers || ["MXRF11"];
  const ticker = tickers[0]; // ticker principal para o card de patrimônio
  _cotacao = await getCotacao(ticker);
  renderPatrimonio();
}

function subscribeData() {
  const uid = user.uid;
  const mesKey = getMesKey();

  unsubAportes = onAportes(uid, (data) => {
    _aportes = data;
    renderPatrimonio();
    renderRecentAportes();
    renderMetaPatrimonio();
  });

  unsubDividendos = onDividendos(uid, (data) => {
    _dividendos = data;
    renderDividendos();
  });

  unsubGastos = onGastos(uid, mesKey, (data) => {
    _gastos = data;
    renderGastos();
  });

  unsubReserva = onReserva(uid, (data) => {
    _reserva = data;
    renderReserva();
  });
}

// ── Render functions ─────────────────────────────────────
function renderPatrimonio() {
  const totalCotas   = calcularTotalCotas(_aportes);
  const totalInvest  = calcularTotalInvestido(_aportes);
  const cotacaoAtual = _cotacao?.regularMarketPrice ?? 0;
  const patrimonio   = calcularPatrimonio(_aportes, cotacaoAtual);
  const lucro        = patrimonio - totalInvest;
  const variacao     = _cotacao?.regularMarketChangePercent ?? null;
  const ticker       = (_cotacao?.symbol) || (profile?.tickers?.[0] || "—");

  const elPat = document.getElementById("patrimonio-valor");
  const elLuc = document.getElementById("lucro-valor");
  const elVar = document.getElementById("variacao-dia");
  const elTicker = document.getElementById("cotacao-ticker");
  const elPreco  = document.getElementById("cotacao-preco");
  const elTotInv = document.getElementById("total-investido");
  const elCotas  = document.getElementById("total-cotas");

  if (elPat) elPat.textContent = cotacaoAtual > 0 ? formatBRL(patrimonio) : "—";
  if (elTotInv) elTotInv.textContent = formatBRL(totalInvest);
  if (elCotas)  elCotas.textContent  = `${totalCotas.toFixed(2)} cotas`;

  if (elLuc) {
    const sign = lucro >= 0 ? "+" : "";
    elLuc.textContent = lucro !== 0 ? `${sign}${formatBRL(lucro)}` : "—";
    elLuc.style.color = lucro >= 0 ? "var(--success)" : "var(--danger)";
  }

  if (elVar && variacao !== null) {
    const isUp = variacao >= 0;
    elVar.textContent = formatPercent(variacao);
    elVar.className = `delta delta--${isUp ? "up" : "down"}`;
  }

  if (elTicker) elTicker.textContent = ticker;
  if (elPreco)  elPreco.textContent  = cotacaoAtual > 0 ? formatBRL(cotacaoAtual) : "offline";

  renderChart();
}

function renderDividendos() {
  const mesKey = getMesKey();
  const dividendosMes = _dividendos.filter(d => {
    if (!d.data) return false;
    const dt = d.data?.toDate ? d.data.toDate() : new Date(d.data);
    const k = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;
    return k === mesKey;
  });

  const totalDivMes = dividendosMes.reduce((acc, d) => acc + (d.valorRecebido ?? 0), 0);
  const precoMedio  = calcularPrecoMedio(_aportes);
  const ultimoDiv   = _dividendos[0];

  const elDiv = document.getElementById("dividendo-mes");
  const elDY  = document.getElementById("dy-pm");

  if (elDiv) elDiv.textContent = formatBRL(totalDivMes);

  if (elDY && ultimoDiv && precoMedio > 0) {
    const { dyPM } = calcularDYs(ultimoDiv.valorPorCota, precoMedio, _cotacao?.regularMarketPrice ?? 0);
    elDY.textContent = `DY/PM: ${dyPM.toFixed(2)}%`;
  }
}

function renderGastos() {
  const totalGastos = _gastos.reduce((acc, g) => acc + (g.valor ?? 0), 0);
  const elG = document.getElementById("gastos-mes");
  const elC = document.getElementById("gastos-count");
  if (elG) elG.textContent = formatBRL(totalGastos);
  if (elC) elC.textContent = `${_gastos.length} registro${_gastos.length !== 1 ? "s" : ""}`;
}

function renderReserva() {
  const saldo = calcularSaldoReserva(_reserva);
  const meta  = profile?.reservaEmergenciaAlvo ?? 15000;
  const pct   = meta > 0 ? Math.min((saldo / meta) * 100, 100) : 0;

  const elVal  = document.getElementById("reserva-valor");
  const elMeta = document.getElementById("reserva-meta-text");
  const elPct  = document.getElementById("reserva-pct");
  const elBar  = document.getElementById("reserva-bar");

  if (elVal)  elVal.textContent  = formatBRL(saldo);
  if (elMeta) elMeta.textContent = `de ${formatBRL(meta)}`;
  if (elPct)  elPct.textContent  = `${pct.toFixed(0)}%`;
  if (elBar)  elBar.style.width  = `${pct}%`;
}

function renderMetaPatrimonio() {
  const cotacaoAtual = _cotacao?.regularMarketPrice ?? 0;
  const patrimonio   = calcularPatrimonio(_aportes, cotacaoAtual);
  const meta         = profile?.metaPatrimonio ?? 100000;
  const pct          = meta > 0 ? Math.min((patrimonio / meta) * 100, 100) : 0;

  const elPct   = document.getElementById("meta-pct");
  const elBar   = document.getElementById("meta-bar");
  const elAtual = document.getElementById("meta-atual");
  const elAlvo  = document.getElementById("meta-alvo");

  if (elPct)   elPct.textContent   = `${pct.toFixed(1)}%`;
  if (elBar)   elBar.style.width   = `${pct}%`;
  if (elAtual) elAtual.textContent = formatBRL(patrimonio);
  if (elAlvo)  elAlvo.textContent  = formatBRL(meta);
}

function renderRecentAportes() {
  const container = document.getElementById("recent-aportes");
  if (!container) return;

  const recentes = _aportes.slice(0, 3);

  if (recentes.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:var(--space-8) 0">
        <p>Nenhum aporte registrado ainda.</p>
      </div>`;
    return;
  }

  container.innerHTML = recentes.map(a => `
    <div class="recent-item">
      <div class="recent-item-left">
        <span class="recent-item-ticker">${a.ticker}</span>
        <span class="recent-item-date">${formatDateShort(a.data)}</span>
      </div>
      <div style="text-align:right">
        <div class="recent-item-value">${formatBRL(a.valorTotal)}</div>
        <div class="recent-item-cotas">${a.cotas} cotas × ${formatBRL(a.valorCota)}</div>
      </div>
    </div>
  `).join("");
}

function renderChart() {
  const ctx = document.getElementById("grafico-patrimonio");
  if (!ctx) return;

  // Agrupa aportes por mês para criar dados do gráfico
  const byMonth = {};
  _aportes.forEach(a => {
    if (!a.data) return;
    const dt = a.data?.toDate ? a.data.toDate() : new Date(a.data);
    const key = `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,"0")}`;
    if (!byMonth[key]) byMonth[key] = 0;
    if (a.tipo === "compra") byMonth[key] += (a.valorTotal ?? 0);
    if (a.tipo === "venda")  byMonth[key] -= (a.valorTotal ?? 0);
  });

  const keys   = Object.keys(byMonth).sort();
  const labels = keys.map(k => {
    const [y, m] = k.split("-");
    return new Date(y, m - 1).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
  });

  // Acumulado
  let acumulado = 0;
  const dados = keys.map(k => { acumulado += byMonth[k]; return acumulado; });

  // Adiciona mês atual com valor patrimonial
  const cotacaoAtual = _cotacao?.regularMarketPrice ?? 0;
  if (cotacaoAtual > 0 && dados.length > 0) {
    const totalCotas = calcularTotalCotas(_aportes);
    dados[dados.length - 1] = totalCotas * cotacaoAtual;
  }

  Chart.getChart("grafico-patrimonio")?.destroy();

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels.length > 0 ? labels : ["—"],
      datasets: [{
        label: "Patrimônio",
        data: dados.length > 0 ? dados : [0],
        borderColor: "#e5591d",
        backgroundColor: "rgba(229,89,29,0.06)",
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#e5591d",
        pointBorderColor: "#e5591d",
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: (ctx) => formatBRL(ctx.raw) }
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(42,35,24,0.8)" },
          ticks: { color: "#7a6a52", font: { family: "'IBM Plex Mono'" } }
        },
        y: {
          grid: { color: "rgba(42,35,24,0.8)" },
          ticks: {
            color: "#7a6a52",
            font: { family: "'IBM Plex Mono'" },
            callback: (v) => `R$${(v/1000).toFixed(0)}k`
          }
        }
      }
    }
  });
}

// ── Cleanup ──────────────────────────────────────────────
window.addEventListener("pagehide", () => {
  unsubAportes?.();
  unsubDividendos?.();
  unsubGastos?.();
  unsubReserva?.();
  chartInstance?.destroy();
});

init();
