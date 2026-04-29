export interface Receita {
  id: string;
  descricao: string;
  valor: number;
  categoria: ReceitaCategoria;
  data: string; // ISO: "2024-05-10T12:00:00Z"
  mesKey: string; // "2024-05"
  criadoEm: string;
  editadoEm?: string;
}

export type ReceitaCategoria =
  | "Salário"
  | "Freelance"
  | "Dividendos"
  | "Aluguel"
  | "Venda"
  | "Outros";
