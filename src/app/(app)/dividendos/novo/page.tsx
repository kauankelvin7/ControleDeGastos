"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { HandCoins, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { maskCurrency, parseCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useGetDoc } from "@/hooks/useFirebaseData";
import { useState, useEffect } from "react";

export default function NovoDividendoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const editId = searchParams.get("id");
  
  const { data: editData, isLoading: loadingEdit } = useGetDoc("dividendos", editId);

  const [loading, setLoading] = useState(false);
  const [ativo, setAtivo] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (editData) {
      const data = editData as any;
      setAtivo(data.ativo || "");
      const valorFormatado = (data.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      setValor(maskCurrency(valorFormatado));
      setData(data.data?.split("T")[0] || new Date().toISOString().split("T")[0]);
    }
  }, [editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !ativo || !valor) return;

    setLoading(true);
    try {
      const v = parseCurrency(valor);

      const dataToSave = {
        ativo: ativo.toUpperCase(),
        valorTotal: v,
        tipo: "dividendo", // para facilitar filtros futuros
        data: data + "T12:00:00Z",
        editadoEm: new Date().toISOString(),
      };

      if (editId) {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/dividendos`, editId), dataToSave);
      } else {
        await addDoc(collection(db, `users/${auth.currentUser.uid}/dividendos`), {
          ...dataToSave,
          criadoEm: new Date().toISOString(),
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["dividendos"] });
      // Volta para o dashboard, pois não temos uma tela só de dividendos no momento
      router.push("/dashboard"); 
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar dividendo");
      setLoading(false);
    }
  };

  if (loadingEdit) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-2xl mx-auto">
      <header className="mb-8 flex items-center gap-4">
        <Link 
          href="/lancamento" 
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 flex items-center justify-center text-text-muted hover:text-text-primary transition-all duration-300 shadow-sm backdrop-blur-md"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary flex items-center gap-3 drop-shadow-md tracking-tight">
            <HandCoins className="text-brand-orange drop-shadow-[0_0_8px_rgba(229,89,29,0.5)]" size={28} />
            Receber Dividendo
          </h1>
          <p className="text-text-muted mt-1">Registre o recebimento de proventos e renda passiva.</p>
        </div>
      </header>

      <form 
        onSubmit={handleSubmit} 
        className="bg-[linear-gradient(145deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-2xl border border-white/5 rounded-2xl p-6 md:p-8 shadow-[0_32px_64px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] space-y-6 relative overflow-hidden"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider px-1 mb-2 block">Ticker do Ativo</label>
            <input
              type="text"
              required
              value={ativo}
              onChange={(e) => setAtivo(e.target.value.toUpperCase())}
              placeholder="Ex: MXRF11, PETR4"
              className="w-full bg-black/20 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-xl px-4 py-4 text-text-primary font-mono text-xl focus:outline-none focus:border-brand-orange focus:bg-black/30 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(229,89,29,0.2)] hover:border-white/20 transition-all duration-300 uppercase placeholder:text-text-disabled"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider px-1 mb-2 block">Valor Recebido (Total)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-disabled font-bold text-lg">R$</span>
              <input
                type="text"
                required
                value={valor}
                onChange={(e) => setValor(maskCurrency(e.target.value))}
                placeholder="0,00"
                className="w-full bg-black/20 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-xl pl-12 pr-4 py-4 text-text-primary font-mono text-lg focus:outline-none focus:border-brand-orange focus:bg-black/30 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(229,89,29,0.2)] hover:border-white/20 transition-all duration-300 placeholder:text-text-disabled"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider px-1 mb-2 block">Data do Pagamento</label>
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
          disabled={loading || !ativo || !valor}
          className="w-full bg-[linear-gradient(135deg,var(--orange),var(--amber))] shadow-[0_4px_16px_rgba(229,89,29,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_24px_rgba(229,89,29,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none text-white font-bold py-4 rounded-xl transition-all duration-300 text-lg tracking-wide mt-4"
        >
          {loading ? "Salvando..." : "Registrar Dividendo"}
        </button>
      </form>
    </div>
  );
}
