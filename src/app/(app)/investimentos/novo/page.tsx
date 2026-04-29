"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Wallet, ArrowLeft, CheckCircle2, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { maskCurrency, parseCurrency, formatBRL } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { useGetDoc } from "@/hooks/useFirebaseData";
import { useState, useEffect, Suspense } from "react";

function NovoInvestimentoForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);
  
  const { data: editData, isLoading: loadingEdit } = useGetDoc("aportes", editId);

  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [ativo, setAtivo] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<"compra" | "venda">("compra");
  const [data, setData] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (editData) {
      const d = editData as any;
      setAtivo(d.ativo || "");
      setQuantidade(String(d.quantidade || "1"));
      const valorFormatado = (d.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
      setValor(maskCurrency(valorFormatado));
      setTipo(d.tipo || "compra");
      setData(d.data?.split("T")[0] || new Date().toISOString().split("T")[0]);
    }
  }, [editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    
    if (!auth.currentUser) {
      setGlobalError("Sessão expirada. Faça login novamente.");
      return;
    }

    if (!ativo || !valor || !quantidade) {
      setGlobalError("Preencha todos os campos obrigatórios.");
      return;
    }

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
    } catch (err: any) {
      console.error(err);
      setGlobalError(err.message || "Erro ao salvar investimento");
      setLoading(false);
    }
  };

  if (loadingEdit) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4" aria-label="Carregando">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-center animate-pulse">
           <div className="w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin shadow-[0_0_20px_rgba(249,115,22,0.1)]" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Preparando Ativo</span>
      </div>
    );
  }

  const totalOperacao = parseCurrency(valor) * Number(quantidade || 0);

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 max-w-xl mx-auto pb-12">
      
      {/* Header */}
      <header className="mb-10 flex items-center gap-5 px-2">
        <Link 
          href="/investimentos" 
          aria-label="Voltar"
          className="group w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 flex items-center justify-center text-white/40 hover:text-white transition-all duration-300 shadow-xl backdrop-blur-md"
        >
          <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white/95 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.1)]">
              <Wallet className="text-orange-400" size={22} />
            </div>
            {isEditMode ? "Editar Ordem" : "Nova Ordem"}
          </h1>
          <p className="text-sm font-medium text-white/40 mt-1.5 ml-1">
            {isEditMode ? "Atualize os dados da sua operação." : "Registre uma nova compra ou venda de ativos."}
          </p>
        </div>
      </header>

      {/* Form Card */}
      <form 
        onSubmit={handleSubmit} 
        noValidate
        className="relative bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl space-y-8 overflow-hidden"
      >
        {/* Subtle Decorative Background Element */}
        <TrendingUp
          size={200}
          className="absolute -right-12 -top-12 text-white/[0.01] pointer-events-none select-none rotate-12"
          aria-hidden
        />

        <div className="space-y-8 relative z-10">
          
          {/* Compra/Venda Switcher */}
          <div className="flex p-1.5 bg-black/20 backdrop-blur-md rounded-2xl border border-white/5 shadow-inner">
            <button
              type="button"
              onClick={() => setTipo("compra")}
              className={`flex-1 py-4 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all duration-500 ${
                tipo === "compra" 
                ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20" 
                : "text-white/20 hover:text-white/40 hover:bg-white/5"
              }`}
            >
              Compra
            </button>
            <button
              type="button"
              onClick={() => setTipo("venda")}
              className={`flex-1 py-4 text-[11px] font-bold uppercase tracking-widest rounded-xl transition-all duration-500 ${
                tipo === "venda" 
                ? "bg-red-500 text-white shadow-lg shadow-red-500/20" 
                : "text-white/20 hover:text-white/40 hover:bg-white/5"
              }`}
            >
              Venda
            </button>
          </div>

          {/* Ativo Ticker */}
          <div className="group">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-1 mb-3 block">Código do Ativo</label>
            <input
              type="text"
              required
              autoComplete="off"
              value={ativo}
              onChange={(e) => setAtivo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              placeholder="Ex: PETR4, MXRF11"
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white font-mono text-2xl tracking-tight focus:outline-none focus:bg-white/[0.04] focus:border-white/20 transition-all duration-300 placeholder:text-white/10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Preço Unitário */}
            <div className="group">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-1 mb-3 block">Preço por Cota</label>
              <div className="relative">
                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-mono font-bold text-xl select-none">R$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={valor}
                  onChange={(e) => setValor(maskCurrency(e.target.value))}
                  placeholder="0,00"
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-16 pr-6 py-5 text-white font-mono text-2xl tracking-tight focus:outline-none focus:bg-white/[0.04] focus:border-white/20 transition-all duration-300 placeholder:text-white/10"
                />
              </div>
            </div>

            {/* Quantidade */}
            <div className="group">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-1 mb-3 block">Quantidade</label>
              <input
                type="number"
                min="1"
                required
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
                placeholder="1"
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white font-mono text-2xl tracking-tight focus:outline-none focus:bg-white/[0.04] focus:border-white/20 transition-all duration-300"
              />
            </div>
          </div>

          {/* Data */}
          <div className="group">
            <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-1 mb-3 block">Data da Operação</label>
            <input
              type="date"
              required
              value={data}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => setData(e.target.value)}
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-5 text-white font-mono text-lg tracking-tight focus:outline-none focus:border-white/20 focus:bg-white/[0.04] transition-all duration-300 [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Feedback & Summary */}
        <div className="space-y-6 pt-2 relative z-10">
          
          {/* Valor Total Summary */}
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex justify-between items-center shadow-inner">
             <div className="flex flex-col">
                <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-1">Total da Operação</span>
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${tipo === "compra" ? "bg-emerald-500" : "bg-red-500"}`} />
                   <span className="text-white/60 font-medium text-xs uppercase tracking-wide">{tipo}</span>
                </div>
             </div>
             <span className={`font-mono font-bold text-2xl tracking-tighter ${tipo === "compra" ? "text-emerald-400" : "text-red-400"}`}>
               {formatBRL(totalOperacao)}
             </span>
          </div>

          {globalError && (
            <div role="alert" className="flex items-start gap-4 bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shrink-0">
                <AlertCircle size={18} className="text-red-400" />
              </div>
              <p className="text-sm font-medium text-red-300/80 leading-relaxed pt-1.5">{globalError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={loading || !ativo || !valor || Number(quantidade) <= 0}
            className="w-full relative group/btn overflow-hidden rounded-2xl py-5 transition-all duration-500 disabled:opacity-20 disabled:cursor-not-allowed active:scale-[0.98] shadow-xl"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-500 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-orange-400 opacity-0 group-hover/btn:opacity-20 transition-opacity blur-xl" />
            
            <span className="relative z-10 flex items-center justify-center gap-3 text-white font-bold text-lg tracking-wide">
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {isEditMode ? "Atualizar Registro" : "Confirmar Lançamento"}
                  <CheckCircle2 size={20} className="group-hover/btn:scale-110 transition-transform" />
                </>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NovoInvestimentoPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500/20 border-t-orange-500 rounded-full" />
      </div>
    }>
      <NovoInvestimentoForm />
    </Suspense>
  );
}