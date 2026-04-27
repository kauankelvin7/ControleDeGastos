// js/utils.js — KiNance Utilities

// ── Formatação ──────────────────────────────────────────
export const formatBRL = (v) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v ?? 0);

export const formatPercent = (v, dec = 2) =>
  `${Number(v) >= 0 ? "+" : ""}${Number(v).toFixed(dec)}%`;

export const formatDate = (date) => {
  if (!date) return "—";
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d)) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(d);
};

export const formatDateShort = (date) => {
  if (!date) return "—";
  const d = date?.toDate ? date.toDate() : new Date(date);
  if (isNaN(d)) return "—";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(d);
};

export const formatDateInput = (date) => {
  const d = date instanceof Date ? date : new Date();
  return d.toISOString().split("T")[0];
};

// ── Cálculos financeiros ────────────────────────────────
export function calcularPrecoMedio(aportes) {
  const compras = aportes.filter(a => a.tipo === "compra");
  const totalValor = compras.reduce((acc, a) => acc + (a.valorTotal ?? 0), 0);
  const totalCotas = compras.reduce((acc, a) => acc + (a.cotas ?? 0), 0);
  return totalCotas > 0 ? totalValor / totalCotas : 0;
}

export function calcularTotalCotas(aportes) {
  return aportes.reduce((acc, a) => {
    if (a.tipo === "compra") return acc + (a.cotas ?? 0);
    if (a.tipo === "venda")  return acc - (a.cotas ?? 0);
    return acc;
  }, 0);
}

export function calcularTotalInvestido(aportes) {
  return aportes
    .filter(a => a.tipo === "compra")
    .reduce((acc, a) => acc + (a.valorTotal ?? 0), 0);
}

export function calcularPatrimonio(aportes, cotacaoAtual) {
  const totalCotas = calcularTotalCotas(aportes);
  return totalCotas * (cotacaoAtual ?? 0);
}

export function calcularDYs(dividendoPorCota, precoMedio, cotacaoAtual) {
  return {
    dyPM:    precoMedio > 0    ? (dividendoPorCota / precoMedio)    * 100 : 0,
    dyAtual: cotacaoAtual > 0  ? (dividendoPorCota / cotacaoAtual)  * 100 : 0,
  };
}

export function calcularSaldoReserva(movimentos) {
  return movimentos.reduce((acc, m) => {
    if (m.tipo === "deposito")  return acc + (m.valor ?? 0);
    if (m.tipo === "retirada")  return acc - (m.valor ?? 0);
    return acc;
  }, 0);
}

// ── Projeção ───────────────────────────────────────────
export function projetar({
  cotasAtuais = 0,
  cotaAtual = 0,
  aporteMensal = 0,
  anos = 10,
  dyMensal = 0.01,
  apreciacaoAnual = 0.005,
} = {}) {
  if (cotaAtual <= 0 || anos <= 0) return [];
  let cotas = cotasAtuais;
  let preco = cotaAtual;
  const resultado = [];

  for (let m = 1; m <= anos * 12; m++) {
    if (preco > 0) cotas += aporteMensal / preco;
    const div = cotas * preco * dyMensal;
    if (preco > 0) cotas += div / preco;
    preco *= (1 + apreciacaoAnual / 12);

    if (m % 12 === 0) {
      resultado.push({
        ano: m / 12,
        patrimonio: Math.round(cotas * preco),
        dividendoMensal: Math.round(cotas * preco * dyMensal),
        cotas: Math.round(cotas),
      });
    }
  }
  return resultado;
}

// ── Toast ──────────────────────────────────────────────
export function showToast(message, type = "success") {
  document.querySelector(".toast")?.remove();
  const t = document.createElement("div");
  t.className = `toast toast--${type}`;
  t.setAttribute("role", "status");
  t.setAttribute("aria-live", "polite");
  t.textContent = message;
  document.body.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add("toast--visible")));
  setTimeout(() => {
    t.classList.remove("toast--visible");
    t.addEventListener("transitionend", () => t.remove(), { once: true });
  }, 2800);
}

// ── Skeleton ───────────────────────────────────────────
export function showSkeleton(container, count = 1) {
  container.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card" aria-busy="true" aria-label="Carregando...">
      <div class="skeleton skeleton--label"></div>
      <div class="skeleton skeleton--value"></div>
    </div>
  `).join("");
}

// ── Debounce ───────────────────────────────────────────
export function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// ── Greeting ───────────────────────────────────────────
export function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

// ── Mes atual key ──────────────────────────────────────
export function getMesKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
