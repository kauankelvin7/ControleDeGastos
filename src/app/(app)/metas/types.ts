export interface Meta {
  id: string;
  titulo: string;
  valorAlvo: number;
  valorAtual: number;
  categoria: string;
  prazo?: string;
  cor?: string;
}

export type MetaFormData = Omit<Meta, "id" | "valorAtual">;
