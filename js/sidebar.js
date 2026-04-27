// js/sidebar.js — KiNance Sidebar Component (shared across pages)
import { logout } from "./auth.js";
import { ICONS } from "./icons.js";

const NAV_ITEMS = [
  { href: "/dashboard.html",  label: "Início",     icon: "dashboard",  section: null },
  { href: "/aportes.html",    label: "Aportes",    icon: "aporte",     section: null },
  { href: "/dividendos.html", label: "Dividendos", icon: "dividendo",  section: null },
  { href: "/gastos.html",     label: "Gastos",     icon: "gasto",      section: null },
  { href: "/reserva.html",    label: "Reserva",    icon: "reserva",    section: "Análise" },
  { href: "/projecao.html",   label: "Projeção",   icon: "projecao",   section: null },
  { href: "/relatorio.html",  label: "Relatório",  icon: "relatorio",  section: null },
];

/**
 * Renderiza o sidebar no elemento #sidebar
 * Recebe o objeto do usuário e o perfil
 */
export function renderSidebar(user, profile) {
  const el = document.getElementById("sidebar");
  if (!el) return;

  const currentPath = window.location.pathname;
  let lastSection = null;

  const navItems = NAV_ITEMS.map(item => {
    let sectionHtml = "";
    if (item.section && item.section !== lastSection) {
      lastSection = item.section;
      sectionHtml = `<div class="sidebar-section-label">${item.section}</div>`;
    }
    const isActive = currentPath.includes(item.href.replace("/", "")) ||
                     (item.href === "/dashboard.html" && (currentPath === "/" || currentPath.includes("dashboard")));
    return `
      ${sectionHtml}
      <a href="${item.href}" class="sidebar-item ${isActive ? "active" : ""}" ${isActive ? 'aria-current="page"' : ""} aria-label="${item.label}">
        ${ICONS[item.icon] || ""}
        <span>${item.label}</span>
      </a>
    `;
  }).join("");

  const nome = profile?.nome || user?.email?.split("@")[0] || "Investidor";
  const inicial = nome[0]?.toUpperCase() || "K";

  el.innerHTML = `
    <div class="sidebar-logo">
      <div class="sidebar-logo-mark">K₿</div>
      <span class="sidebar-logo-text">KiNance</span>
    </div>
    <nav class="sidebar-nav" aria-label="Navegação principal">
      <a href="/aportes.html" class="sidebar-fab" aria-label="Novo aporte">
        ${ICONS.plus}
        Novo Aporte
      </a>
      ${navItems}
    </nav>
    <div class="sidebar-user">
      <div class="sidebar-avatar" aria-hidden="true">${inicial}</div>
      <div class="sidebar-user-info">
        <div class="sidebar-user-name">${nome}</div>
        <div class="sidebar-user-role">Investidor</div>
      </div>
      <button class="sidebar-logout" aria-label="Sair" onclick="window._kinanceLogout()">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M6 3H3a1 1 0 00-1 1v8a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
  `;

  window._kinanceLogout = logout;
}
