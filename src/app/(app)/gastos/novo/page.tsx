"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ArrowRightLeft, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { maskCurrency, parseCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useGetDoc } from "@/hooks/useFirebaseData";
import { useEffect, useState } from "react";

const CATEGORIAS = [
  "Moradia", "Alimentação", "Transporte", "Saúde", "Educação", "Lazer", "Outros"
];

export default function NovoGastoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const editId = searchParams.get("id");

  const { data: editData, isLoading: loadingEdit } = useGetDoc("gastos", editId);

  const [loading, setLoading] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState(CATEGORIAS[0]);
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (editData) {
      setDescricao(editData.descricao || "");
      const valorFormatado = (editData.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      setValor(maskCurrency(valorFormatado));
      setCategoria(editData.categoria || CATEGORIAS[0]);
      setData(editData.data?.split("T")[0] || new Date().toISOString().split("T")[0]);
    }
  }, [editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !descricao || !valor) return;

    setLoading(true);
    try {
      const mesKey = data.substring(0, 7);
      const dataToSave = {
        descricao,
        valor: parseCurrency(valor),
        categoria,
        data: data + "T12:00:00Z",
        mesKey,
        editadoEm: new Date().toISOString(),
      };

      if (editId) {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/gastos`, editId), dataToSave);
      } else {
        await addDoc(collection(db, `users/${auth.currentUser.uid}/gastos`), {
          ...dataToSave,
          criadoEm: new Date().toISOString(),
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["gastos"] });
      router.push("/gastos");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar gasto");
      setLoading(false);
    }
  };

  if (loadingEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-danger border-t-transparent rounded-full shadow-[0_0_15px_rgba(248,113,113,0.3)]"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">
      <header className="mb-8 flex items-center gap-4">
        <Link 
          href="/gastos" 
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 flex items-center justify-center text-text-muted hover:text-text-primary transition-all duration-300 shadow-sm backdrop-blur-md"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary flex items-center gap-3 drop-shadow-md tracking-tight">
            <ArrowRightLeft className="text-danger drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]" size={28} />
            Registrar Gasto
          </h1>
          <p className="text-text-muted mt-1">Adicione uma despesa para manter o controle.</p>
        </div>
      </header>

      <form 
        onSubmit={handleSubmit} 
        className="bg-[linear-gradient(145deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-2xl border border-white/5 rounded-2xl p-6 md:p-8 shadow-[0_32px_64px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] space-y-6 relative overflow-hidden transition-all"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider px-1 mb-2 block">Descrição</label>
            <input
              type="text"
              required
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Conta de Luz, Supermercado"
              className="w-full bg-black/20 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-xl px-4 py-4 text-text-primary font-display text-lg focus:outline-none focus:border-brand-orange focus:bg-black/30 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(229,89,29,0.2)] hover:border-white/20 transition-all duration-300 placeholder:text-text-disabled"
            />
          </div>

          <div>
            <label className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider px-1 mb-2 block">Valor Total</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-danger font-bold text-lg drop-shadow-sm">R$</span>
              <input
                type="text"
                required
                value={valor}
                onChange={(e) => setValor(maskCurrency(e.target.value))}
                placeholder="0,00"
                className="w-full bg-black/20 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-xl pl-12 pr-4 py-4 text-danger font-mono font-bold text-xl focus:outline-none focus:border-danger focus:bg-black/30 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(248,113,113,0.2)] hover:border-white/20 transition-all duration-300 placeholder:text-danger/30"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider px-1 mb-2 block">Categoria</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full bg-black/20 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-xl px-4 py-4 text-text-primary font-display text-lg focus:outline-none focus:border-brand-orange focus:bg-black/30 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(229,89,29,0.2)] hover:border-white/20 transition-all duration-300 appearance-none cursor-pointer"
            >
              {CATEGORIAS.map(cat => (
                <option key={cat} value={cat} className="bg-bg-panel text-text-primary">{cat}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider px-1 mb-2 block">Data do Gasto</label>
            <input
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full bg-black/20 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-xl px-4 py-4 text-text-primary font-mono text-lg focus:outline-none focus:border-brand-orange focus:bg-black/30 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(229,89,29,0.2)] hover:border-white/20 transition-all duration-300 [color-scheme:dark]"
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading || !descricao || !valor}
          className="w-full mt-4 bg-[linear-gradient(135deg,var(--danger),#ef4444)] shadow-[0_4px_16px_rgba(248,113,113,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_24px_rgba(248,113,113,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none disabled:active:scale-100 text-white font-bold py-4 rounded-xl transition-all duration-300 text-lg tracking-wide"
        >
          {loading ? "Salvando..." : "Registrar Despesa"}
        </button>
      </form>
    </div>
  );
}