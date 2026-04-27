export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function maskCurrency(value: string) {
  // Remove tudo que não é dígito
  let v = value.replace(/\D/g, "");
  if (!v) return "";
  
  // Converte para centavos e formata
  const n = parseInt(v, 10);
  return (n / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function parseCurrency(value: string): number {
  if (!value) return 0;
  // Remove pontos de milhar e troca vírgula por ponto
  return parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
}
