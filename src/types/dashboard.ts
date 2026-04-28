export interface Aporte {
  id?: string;
  data: string;
  ativo: string;
  quantidade: number | string;
  valor?: number | string;
  valorTotal?: number | string;
  tipo?: "compra" | "venda";
}

export interface Gasto {
  id?: string;
  data: string;
  valor: number;
  categoria: string;
  descricao?: string;
}

export interface Dividendo {
  id?: string;
  data: string;
  ativo: string;
  valorTotal: number;
  tipo?: string;
}
