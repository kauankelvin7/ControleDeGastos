// js/constants.js — KiNance Constants
export const CATEGORIAS = [
  { id: "alimentacao",  label: "Alimentação",  emoji: "🍽️" },
  { id: "transporte",   label: "Transporte",   emoji: "🚗" },
  { id: "moradia",      label: "Moradia",      emoji: "🏠" },
  { id: "saude",        label: "Saúde",        emoji: "💊" },
  { id: "educacao",     label: "Educação",     emoji: "📚" },
  { id: "lazer",        label: "Lazer",        emoji: "🎮" },
  { id: "assinaturas",  label: "Assinaturas",  emoji: "🔄" },
  { id: "investimentos",label: "Investimentos",emoji: "📈" },
  { id: "outros",       label: "Outros",       emoji: "📦" },
];

export const CATEGORIA_MAP = Object.fromEntries(
  CATEGORIAS.map(c => [c.id, c])
);

export const TIPOS_APORTE = ["compra", "venda"];

export const TICKERS_SUGERIDOS = ["MXRF11", "HGLG11", "KNRI11", "XPML11", "VISC11"];

export const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];
