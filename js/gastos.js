// js/gastos.js — KiNance Gastos
import { requireAuth, checkOnboarding } from "./auth.js";
import { onGastos, addGasto, deleteGasto } from "./db.js";
import { renderSidebar } from "./sidebar.js";
import { formatBRL, formatDateShort, showToast, getMesKey } from "./utils.js";
import { CATEGORIAS, CATEGORIA_MAP } from "./constants.js";

let user = null;
let profile = null;
let unsubGastos = null;
let _gastos = [];
let _categoriaSelecionada = null;
let chartInstance = null;

async function init() {
  try {
    user    = await requireAuth();
    profile = await checkOnboarding(user.uid);
    if (!profile) return;

    renderSidebar(user, profile);

    const mesKey = getMesKey();
    // Atualiza label do mês
    const [ano, mes] = mesKey.split("-");
    const dt = new Date(parseInt(ano), parseInt(mes) - 1);
    const mesLabel = dt.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    const el = document.getElementById("mes-label");
    if (el) el.textContent = mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1);

    renderCategoriaGrid();

    unsubGastos = onGastos(user.uid, mesKey, (data) => {
      _gastos = data;
      renderTotal();
      renderLista();
      renderChart();
    }, (err) => {
      // Composite index necessário — mostra mensagem amigável
      console.warn("[KiNance] gastos listener:", err.message);
      if (err.message?.includes("index")) {
        document.getElementById("lista-gastos").innerHTML =
          `<div class="card"><p style="color:var(--warning);font-family:var(--font-display);font-size:var(--text-sm)">⚠️ Configure o índice composto do Firestore. Verifique o console para o link.</p></div>`;
      }
    });
  } catch (e) {
    console.error("[KiNance] gastos init:", e);
  }
}

// ── Grid de categorias ────────────────────────────────────
function renderCategoriaGrid() {
  const grid = document.getElementById("categoria-grid");
  grid.innerHTML = CATEGORIAS.map(c => `
    <button type="button" class="categoria-btn" id="cat-${c.id}" onclick="selectCategoria('${c.id}')" aria-pressed="false">
      <span class="cat-emoji">${c.emoji}</span>
      <span>${c.label}</span>
    </button>
  `).join("");
}

window.selectCategoria = (id) => {
  _categoriaSelecionada = id;
  document.getElementById("categoria-selecionada").value = id;
  document.querySelectorAll(".categoria-btn").forEach(btn => {
    btn.classList.remove("selected");
    btn.setAttribute("aria-pressed", "false");
  });
  const btn = document.getElementById(`cat-${id}`);
  if (btn) { btn.classList.add("selected"); btn.setAttribute("aria-pressed", "true"); }
};

// ── Submit ────────────────────────────────────────────────
document.getElementById("form-gasto").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("gasto-error");
  errEl.style.display = "none";

  const valor      = parseFloat(document.getElementById("gasto-valor").value);
  const categoria  = _categoriaSelecionada;
  const descricao  = document.getElementById("gasto-desc").value.trim();
  const recorrente = document.getElementById("gasto-recorrente").checked;

  const btn = document.getElementById("btn-gasto");
  btn.disabled = true;
  btn.textContent = "Registrando...";

  try {
    await addGasto(user.uid, { valor, categoria, descricao, recorrente });
    showToast("Gasto registrado!", "success");
    document.getElementById("form-gasto").reset();
    _categoriaSelecionada = null;
    document.querySelectorAll(".categoria-btn").forEach(b => {
      b.classList.remove("selected");
      b.setAttribute("aria-pressed", "false");
    });
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Registrar Gasto";
  }
});

// ── Render total ──────────────────────────────────────────
function renderTotal() {
  const total = _gastos.reduce((acc, g) => acc + (g.valor ?? 0), 0);
  const el = document.getElementById("total-mes");
  if (el) el.textContent = formatBRL(total);
}

// ── Render lista ──────────────────────────────────────────
function renderLista() {
  const container = document.getElementById("lista-gastos");
  if (_gastos.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Nenhum gasto registrado este mês.</p></div>`;
    return;
  }

  container.innerHTML = _gastos.map(g => {
    const cat = CATEGORIA_MAP[g.categoria] || { emoji: "📦", label: g.categoria };
    return `
      <div class="gasto-item" style="margin-bottom:var(--space-2)">
        <div class="gasto-emoji">${cat.emoji}</div>
        <div class="gasto-info">
          <div class="gasto-desc">${g.descricao}</div>
          <div class="gasto-cat">${cat.label} · ${formatDateShort(g.data)}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px">
          <span class="gasto-valor">${formatBRL(g.valor)}</span>
          <button class="btn-icon" aria-label="Excluir gasto" onclick="excluirGasto('${g.id}')">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

// ── Render chart doughnut ─────────────────────────────────
function renderChart() {
  const ctx = document.getElementById("chart-categorias");
  if (!ctx) return;

  // Agrupa por categoria
  const por_cat = {};
  _gastos.forEach(g => {
    por_cat[g.categoria] = (por_cat[g.categoria] || 0) + (g.valor ?? 0);
  });

  const categorias = Object.keys(por_cat);
  const valores    = categorias.map(c => por_cat[c]);
  const cores = ["#e5591d","#ffa43c","#4ade80","#60a5fa","#f87171","#a78bfa","#facc15","#fb923c","#34d399"];

  Chart.getChart("chart-categorias")?.destroy();
  chartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: categorias.map(c => CATEGORIA_MAP[c]?.label || c),
      datasets: [{
        data: valores,
        backgroundColor: cores.slice(0, categorias.length),
        borderWidth: 0,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "65%",
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatBRL(ctx.raw)}` } }
      }
    }
  });
}

window.excluirGasto = async (id) => {
  if (!confirm("Excluir este gasto?")) return;
  try {
    await deleteGasto(user.uid, id);
    showToast("Gasto excluído", "warning");
  } catch (err) {
    showToast("Erro ao excluir", "error");
  }
};

window.addEventListener("pagehide", () => { unsubGastos?.(); chartInstance?.destroy(); });
init();
