// js/reserva.js — KiNance Reserva de Emergência
import { requireAuth, checkOnboarding } from "./auth.js";
import { onReserva, addReserva } from "./db.js";
import { renderSidebar } from "./sidebar.js";
import { formatBRL, formatDateShort, showToast, calcularSaldoReserva } from "./utils.js";

let user = null;
let profile = null;
let unsubReserva = null;
let _reserva = [];
let _tipoAtual = "deposito";

async function init() {
  try {
    user    = await requireAuth();
    profile = await checkOnboarding(user.uid);
    if (!profile) return;

    renderSidebar(user, profile);

    unsubReserva = onReserva(user.uid, (data) => {
      _reserva = data;
      renderSaldo();
      renderLista();
    });
  } catch (e) {
    console.error("[KiNance] reserva init:", e);
  }
}

window.setTipoReserva = (tipo) => {
  _tipoAtual = tipo;
  document.getElementById("reserva-tipo").value = tipo;
  const btnDep = document.getElementById("btn-deposito");
  const btnRet = document.getElementById("btn-retirada");
  if (tipo === "deposito") {
    btnDep.style.borderColor = "var(--success)";
    btnDep.style.color = "var(--success)";
    btnRet.style.borderColor = "var(--border-default)";
    btnRet.style.color = "var(--text-secondary)";
  } else {
    btnRet.style.borderColor = "var(--danger)";
    btnRet.style.color = "var(--danger)";
    btnDep.style.borderColor = "var(--border-default)";
    btnDep.style.color = "var(--text-secondary)";
  }
};

function renderSaldo() {
  const saldo = calcularSaldoReserva(_reserva);
  const meta  = profile?.reservaEmergenciaAlvo ?? 15000;
  const pct   = meta > 0 ? Math.min((saldo / meta) * 100, 100) : 0;

  const elSaldo     = document.getElementById("reserva-saldo");
  const elSaldoH    = document.getElementById("reserva-saldo-header");
  const elPct       = document.getElementById("reserva-pct");
  const elBar       = document.getElementById("reserva-bar");
  const elSaldoLab  = document.getElementById("reserva-saldo-label");
  const elMetaLab   = document.getElementById("reserva-meta-label");

  if (elSaldo)    elSaldo.textContent    = formatBRL(saldo);
  if (elSaldoH)   elSaldoH.textContent   = formatBRL(saldo);
  if (elPct)      elPct.textContent      = `${pct.toFixed(0)}%`;
  if (elBar)      elBar.style.width      = `${pct}%`;
  if (elSaldoLab) elSaldoLab.textContent = formatBRL(saldo);
  if (elMetaLab)  elMetaLab.textContent  = formatBRL(meta);
}

function renderLista() {
  const container = document.getElementById("lista-reserva");
  if (_reserva.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>Nenhuma movimentação registrada.</p></div>`;
    return;
  }
  container.innerHTML = _reserva.map(r => `
    <div class="list-item list-item--${r.tipo === "deposito" ? "success" : "danger"}" style="margin-bottom:var(--space-2)">
      <div style="font-size:20px;flex-shrink:0">${r.tipo === "deposito" ? "💰" : "↩️"}</div>
      <div style="flex:1">
        <div style="font-family:var(--font-display);font-size:var(--text-sm);font-weight:600;color:var(--text-primary)">${r.onde || (r.tipo === "deposito" ? "Depósito" : "Retirada")}</div>
        <div style="font-family:var(--font-display);font-size:var(--text-xs);color:var(--text-muted)">${formatDateShort(r.data)}</div>
      </div>
      <div style="font-family:var(--font-display);font-size:var(--text-base);font-weight:700;color:${r.tipo === "deposito" ? "var(--success)" : "var(--danger)"}">
        ${r.tipo === "deposito" ? "+" : "−"}${formatBRL(r.valor)}
      </div>
    </div>
  `).join("");
}

document.getElementById("form-reserva").addEventListener("submit", async (e) => {
  e.preventDefault();
  const errEl = document.getElementById("reserva-error");
  errEl.style.display = "none";

  const valor = parseFloat(document.getElementById("reserva-valor").value);
  const onde  = document.getElementById("reserva-onde").value.trim();
  const tipo  = _tipoAtual;

  const btn = document.getElementById("btn-reserva");
  btn.disabled = true;
  btn.textContent = "Registrando...";

  try {
    await addReserva(user.uid, { valor, onde, tipo });
    showToast(`${tipo === "deposito" ? "Depósito" : "Retirada"} registrado!`, "success");
    document.getElementById("form-reserva").reset();
  } catch (err) {
    errEl.textContent = err.message;
    errEl.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "Registrar";
  }
});

window.addEventListener("pagehide", () => unsubReserva?.());
init();
