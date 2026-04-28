// js/sidebar.js — KiNance Sidebar Component (shared across pages)
import { logout } from "./auth.js";
import { ICONS } from "./icons.js";

// ─── Constants ───────────────────────────────────────────────────────────────

const AVATAR_FALLBACK = "?";

const NAV_ITEMS = [
  { href: "/dashboard.html",  label: "Início",     icon: "dashboard", section: null      },
  { href: "/aportes.html",    label: "Aportes",    icon: "aporte",    section: null      },
  { href: "/dividendos.html", label: "Dividendos", icon: "dividendo", section: null      },
  { href: "/gastos.html",     label: "Gastos",     icon: "gasto",     section: null      },
  { href: "/reserva.html",    label: "Reserva",    icon: "reserva",   section: "Análise" },
  { href: "/projecao.html",   label: "Projeção",   icon: "projecao",  section: null      },
  { href: "/relatorio.html",  label: "Relatório",  icon: "relatorio", section: null      },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Escapa caracteres especiais de HTML para prevenir XSS em interpolações.
 * Sempre use esta função ao interpolar dados de usuário no innerHTML.
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Verifica se o item de navegação está ativo com base no pathname atual.
 * Usa comparação exata de pathname para evitar falsos positivos
 * (ex: "/gastos.html" batendo em "/novos-gastos.html").
 */
function isNavItemActive(itemHref, currentPath) {
  // Dashboard tem rota dupla: raiz "/" e "/dashboard.html"
  if (itemHref === "/dashboard.html") {
    return currentPath === "/" || currentPath === "/dashboard.html";
  }
  return currentPath === itemHref;
}

/**
 * Retorna o SVG do ícone. Avisa no console em desenvolvimento se o ícone
 * não existir, e renderiza um placeholder acessível em vez de string vazia.
 */
function getIcon(name) {
  const icon = ICONS[name];
  if (!icon) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[Sidebar] Ícone não encontrado: "${name}"`);
    }
    // Placeholder visual: quadrado pontilhado
    return `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="16" height="16" rx="3" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 2"/>
    </svg>`;
  }
  return icon;
}

/**
 * Gera o HTML dos itens de navegação, injetando separadores de seção
 * sem usar side-effects dentro do .map().
 */
function buildNavItemsHtml(currentPath) {
  let lastSection = null;

  return NAV_ITEMS.map((item) => {
    const active = isNavItemActive(item.href, currentPath);

    // Seção: renderiza o label apenas quando muda (sem mutação em .map — usa
    // variável externa, mas de forma explícita e isolada nesta função)
    let sectionHtml = "";
    if (item.section && item.section !== lastSection) {
      lastSection = item.section;
      sectionHtml = `<div class="sidebar-section-label" aria-hidden="true">${escapeHtml(item.section)}</div>`;
    }

    return `
      ${sectionHtml}
      <a
        href="${escapeHtml(item.href)}"
        class="sidebar-item${active ? " active" : ""}"
        ${active ? 'aria-current="page"' : ""}
        aria-label="${escapeHtml(item.label)}"
      >
        ${getIcon(item.icon)}
        <span>${escapeHtml(item.label)}</span>
      </a>
    `;
  }).join("");
}

// ─── Render ───────────────────────────────────────────────────────────────────

/**
 * Renderiza o sidebar no elemento #sidebar.
 * Idempotente: se o sidebar já foi renderizado (marcado com data-rendered),
 * apenas atualiza os itens ativos sem re-renderizar tudo.
 *
 * @param {import("firebase/auth").User | null} user
 * @param {{ nome?: string } | null} profile
 */
export function renderSidebar(user, profile) {
  const el = document.getElementById("sidebar");
  if (!el) return;

  // Guard de idempotência: evita re-renderizar e perder os event listeners
  if (el.dataset.rendered === "true") {
    _updateActiveItem(el);
    return;
  }

  const currentPath = window.location.pathname;
  const nome    = escapeHtml(profile?.nome || user?.email?.split("@")[0] || "Investidor");
  const inicial = (profile?.nome?.[0] || user?.email?.[0] || AVATAR_FALLBACK).toUpperCase();

  el.innerHTML = `
    <div class="sidebar-logo" aria-label="KiNance">
      <div class="sidebar-logo-mark" aria-hidden="true">K₿</div>
      <span class="sidebar-logo-text" aria-hidden="true">KiNance</span>
    </div>

    <nav class="sidebar-nav" aria-label="Navegação principal">
      <a href="/aportes.html" class="sidebar-fab" aria-label="Novo aporte">
        ${getIcon("plus")}
        Novo Aporte
      </a>
      ${buildNavItemsHtml(currentPath)}
    </nav>

    <div class="sidebar-user" role="contentinfo">
      <div class="sidebar-avatar" aria-hidden="true">${escapeHtml(inicial)}</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name">${nome}</div>
        <div class="sidebar-user-role" aria-label="Perfil de investidor">Investidor</div>
      </div>
      <button class="sidebar-logout" aria-label="Sair da conta" id="sidebar-logout-btn" type="button">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6"
            stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;

  // Registra o logout via addEventListener — sem poluir window
  el.querySelector("#sidebar-logout-btn")?.addEventListener("click", () => {
    logout().catch((err) => console.error("[Sidebar] Erro ao fazer logout:", err));
  });

  el.dataset.rendered = "true";
}

/**
 * Atualiza apenas os itens ativos/inativos sem re-renderizar o sidebar.
 * Usado quando o pathname muda em SPAs ou navegações parciais.
 *
 * @param {HTMLElement} el
 */
function _updateActiveItem(el) {
  const currentPath = window.location.pathname;
  el.querySelectorAll(".sidebar-item").forEach((link) => {
    const href   = link.getAttribute("href") ?? "";
    const active = isNavItemActive(href, currentPath);
    link.classList.toggle("active", active);
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}