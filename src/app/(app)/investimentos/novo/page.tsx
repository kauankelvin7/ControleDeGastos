"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Wallet, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { maskCurrency, parseCurrency } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useGetDoc } from "@/hooks/useFirebaseData";
import { useState, useEffect } from "react";

export default function NovoInvestimentoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const editId = searchParams.get("id");
  
  const { data: editData, isLoading: loadingEdit } = useGetDoc("aportes", editId);

  const [loading, setLoading] = useState(false);
  const [ativo, setAtivo] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<"compra" | "venda">("compra");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (editData) {
      const data = editData as any;
      setAtivo(data.ativo || "");
      setQuantidade(String(data.quantidade || "1"));
      // Formata o valor numérico de volta para a máscara de string
      const valorFormatado = (data.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      setValor(maskCurrency(valorFormatado));
      setTipo(data.tipo || "compra");
      setData(data.data?.split("T")[0] || new Date().toISOString().split("T")[0]);
    }
  }, [editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !ativo || !valor || !quantidade) return;

    setLoading(true);
    try {
      const v = parseCurrency(valor);
      const q = Number(quantidade);
      const valorTotal = v * q;

      const dataToSave = {
        ativo: ativo.toUpperCase(),
        quantidade: q,
        valor: v,
        valorTotal,
        tipo,
        data: data + "T12:00:00Z",
        editadoEm: new Date().toISOString(),
      };

      if (editId) {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/aportes`, editId), dataToSave);
      } else {
        await addDoc(collection(db, `users/${auth.currentUser.uid}/aportes`), {
          ...dataToSave,
          criadoEm: new Date().toISOString(),
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["aportes"] });
      router.push("/investimentos");
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar investimento");
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
          href="/investimentos" 
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 flex items-center justify-center text-text-muted hover:text-text-primary transition-all duration-300 shadow-sm backdrop-blur-md"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary flex items-center gap-3 drop-shadow-md tracking-tight">
            <Wallet className="text-brand-orange drop-shadow-[0_0_8px_rgba(229,89,29,0.5)]" size={28} />
            Novo Lançamento
          </h1>
          <p className="text-text-muted mt-1">Registre uma nova compra ou venda de ativos.</p>
        </div>
      </header>

      <form 
        onSubmit={handleSubmit} 
        className="bg-[linear-gradient(145deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-2xl border border-white/5 rounded-2xl p-6 md:p-8 shadow-[0_32px_64px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] space-y-6 relative overflow-hidden"
      >
        
        {/* Seletor de Tipo Compra/Venda */}
        <div className="flex p-1.5 bg-black/20 backdrop-blur-md rounded-xl border border-white/5 shadow-inner">
          <button
            type="button"
            onClick={() => setTipo("compra")}
            className={`flex-1 py-3 text-sm font-bold font-display rounded-lg transition-all duration-300 ${
              tipo === "compra" 
              ? "bg-[linear-gradient(135deg,var(--success),#22c55e)] text-black shadow-[0_4px_12px_rgba(74,222,128,0.3),inset_0_1px_0_rgba(255,255,255,0.3)]" 
              : "text-text-muted hover:text-text-secondary hover:bg-white/5"
            }`}
          >
            Compra
          </button>
          <button
            type="button"
            onClick={() => setTipo("venda")}
            className={`flex-1 py-3 text-sm font-bold font-display rounded-lg transition-all duration-300 ${
              tipo === "venda" 
              ? "bg-[linear-gradient(135deg,var(--danger),#ef4444)] text-white shadow-[0_4px_12px_rgba(248,113,113,0.3),inset_0_1px_0_rgba(255,255,255,0.3)]" 
              : "text-text-muted hover:text-text-secondary hover:bg-white/5"
            }`}
          >
            Venda
          </button>
        </div>

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

          <div>
            <label className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider px-1 mb-2 block">Preço por Cota</label>
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

          <div>
            <label className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider px-1 mb-2 block">Quantidade</label>
            <input
              type="number"
              min="1"
              required
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="1"
              className="w-full bg-black/20 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-xl px-4 py-4 text-text-primary font-mono text-lg focus:outline-none focus:border-brand-orange focus:bg-black/30 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(229,89,29,0.2)] hover:border-white/20 transition-all duration-300"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-display font-bold text-text-secondary uppercase tracking-wider px-1 mb-2 block">Data da Operação</label>
            <input
              type="date"
              required
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full bg-black/20 border border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] rounded-xl px-4 py-4 text-text-primary font-mono text-lg focus:outline-none focus:border-brand-orange focus:bg-black/30 focus:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2),0_0_0_3px_rgba(229,89,29,0.2)] hover:border-white/20 transition-all duration-300 [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Resumo do Valor Total */}
        <div className="bg-white/[0.02] backdrop-blur-md p-4 rounded-xl border border-white/5 flex justify-between items-center mt-2 shadow-inner">
          <span className="text-text-secondary font-display text-sm font-medium">Valor Total da Operação</span>
          <span className="font-mono font-bold text-xl text-brand-orange drop-shadow-[0_0_10px_rgba(229,89,29,0.3)]">
            R$ {(parseCurrency(valor) * Number(quantidade || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <button 
          type="submit"
          disabled={loading || !ativo || !valor}
          className="w-full bg-[linear-gradient(135deg,var(--orange),var(--amber))] shadow-[0_4px_16px_rgba(229,89,29,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_24px_rgba(229,89,29,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-1 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none text-white font-bold py-4 rounded-xl transition-all duration-300 text-lg tracking-wide"
        >
          {loading ? "Salvando..." : "Registrar Lançamento"}
        </button>
      </form>
    </div>
  );
}