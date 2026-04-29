export interface Aporte {
  id: string;
  data: string;
  ativo?: string;
  valorTotal?: number;
  tipo?: "compra" | "venda";
  quantidade?: number;
  precoUnitario?: number;
}

export interface Gasto {
  id: string;
  data: string;
  valor?: number;
  categoria?: string;
  descricao?: string;
}

export interface ReservaItem {
  id: string;
  data: string;
  valor: number;
  descricao?: string;
  meta?: number;
}

export interface Meta {
  id: string;
  titulo: string;
  valorAlvo: number;
  valorAtual: number;
  categoria: string;
  prazo?: string;
  cor?: string;
}
