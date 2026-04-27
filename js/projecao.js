// js/projecao.js — KiNance Projeção
import { requireAuth, checkOnboarding } from "./auth.js";
import { onAportes } from "./db.js";
import { getCotacao } from "./api.js";
import { renderSidebar } from "./sidebar.js";
import { formatBRL, projetar, calcularTotalCotas, calcularPrecoMedio } from "./utils.js";

let user = null;
let profile = null;
let unsubAportes = null;
let _aportes = [];
let _cotacaoAtual = 0;
let chartInstance = null;

async function init() {
  try {
    user    = await requireAuth();
    profile = await checkOnboarding(user.uid);
    if (!profile) return;

    renderSidebar(user, profile);

    // Busca cotação do ticker principal
    const ticker = (profile.tickers || ["MXRF11"])[0];
    const cotacao = await getCotacao(ticker);
    _cotacaoAtual = cotacao?.regularMarketPrice ?? 9.93;

    unsubAportes = onAportes(user.uid, (data) => {
      _aportes = data;
      updateProjecao();
    });
  } catch (e) {
    console.error("[KiNance] projecao init:", e);
  }
}

window.updateProjecao = () => {
  const aporteMensal = parseFloat(document.getElementById("sl-aporte").value) || 500;
  const dyMensal     = parseFloat(document.getElementById("sl-dy").value) / 100 || 0.01;
  const anos         = parseInt(document.getElementById("sl-anos").value) || 10;

  document.getElementById("sl-aporte-val").textContent = `R$ ${aporteMensal.toLocaleString("pt-BR")}`;
  document.getElementById("sl-dy-val").textContent     = `${(dyMensal * 100).toFixed(1)}%`;
  document.getElementById("sl-anos-val").textContent   = `${anos} ${anos === 1 ? "ano" : "anos"}`;

  const cotasAtuais = calcularTotalCotas(_aportes);
  const cotaAtual   = _cotacaoAtual > 0 ? _cotacaoAtual : 9.93;

  const resultado = projetar({ cotasAtuais, cotaAtual, aporteMensal, anos, dyMensal });

  renderTabela(resultado);
  renderChart(resultado);
};

function renderTabela(resultado) {
  const container = document.getElementById("tabela-projecao");

  // Mostra 1, 3, 5, 10 anos e o último
  const periodos = resultado.filter(r => [1, 3, 5, 10, 15, 20, 30].includes(r.ano));

  if (resultado.length > 0 && !periodos.find(r => r.ano === resultado[resultado.length - 1].ano)) {
    periodos.push(resultado[resultado.length - 1]);
  }

  container.innerHTML = periodos.map(r => `
    <div class="card" style="display:flex;align-items:center;justify-content:space-between;padding:var(--space-4)">
      <div>
        <div style="font-family:var(--font-display);font-size:var(--text-sm);font-weight:700;color:var(--text-muted)">${r.ano} ${r.ano === 1 ? "ano" : "anos"}</div>
        <div style="font-family:var(--font-display);font-size:var(--text-xs);color:var(--text-muted);margin-top:2px">${r.cotas.toLocaleString("pt-BR")} cotas</div>
      </div>
      <div style="text-align:right">
        <div style="font-family:var(--font-display);font-size:var(--text-base);font-weight:700;color:var(--orange)">${formatBRL(r.patrimonio)}</div>
        <div style="font-family:var(--font-display);font-size:var(--text-xs);color:var(--success)">${formatBRL(r.dividendoMensal)}/mês</div>
      </div>
    </div>
  `).join("");
}

function renderChart(resultado) {
  const ctx = document.getElementById("grafico-projecao");
  if (!ctx) return;

  Chart.getChart("grafico-projecao")?.destroy();

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: resultado.map(r => `${r.ano}a`),
      datasets: [
        {
          label: "Patrimônio",
          data: resultado.map(r => r.patrimonio),
          borderColor: "#e5591d",
          backgroundColor: "rgba(229,89,29,0.06)",
          tension: 0.4,
          fill: true,
          pointRadius: 0,
          yAxisID: "y",
        },
        {
          label: "Dividendo/mês",
          data: resultado.map(r => r.dividendoMensal),
          borderColor: "#4ade80",
          backgroundColor: "transparent",
          tension: 0.4,
          borderDash: [4, 4],
          pointRadius: 0,
          yAxisID: "y1",
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          labels: { color: "#7a6a52", font: { family: "'IBM Plex Mono'", size: 11 } }
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatBRL(ctx.raw)}`
          }
        }
      },
      scales: {
        x: { grid: { color: "rgba(42,35,24,0.8)" }, ticks: { color: "#7a6a52", font: { family: "'IBM Plex Mono'", size: 10 } } },
        y:  { position: "left",  grid: { color: "rgba(42,35,24,0.8)" }, ticks: { color: "#7a6a52", font: { family: "'IBM Plex Mono'", size: 10 }, callback: v => `R$${(v/1000).toFixed(0)}k` } },
        y1: { position: "right", grid: { display: false }, ticks: { color: "#4ade80", font: { family: "'IBM Plex Mono'", size: 10 }, callback: v => `R$${v.toFixed(0)}` } },
      }
    }
  });
}

window.addEventListener("pagehide", () => { unsubAportes?.(); chartInstance?.destroy(); });
init();
