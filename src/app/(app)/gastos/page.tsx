"use client";

import { useGastos } from "@/hooks/useFirebaseData";
import { formatBRL } from "@/lib/utils";
import { Plus, Receipt, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { doc, deleteDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";

export default function GastosPage() {
  const { data: gastos, isLoading } = useGastos();
  const queryClient = useQueryClient();

  const handleDelete = async (id: string) => {
    if (!auth.currentUser || !confirm("Tem certeza que deseja excluir este gasto?")) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/gastos`, id));
      await queryClient.invalidateQueries({ queryKey: ["gastos"] });
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full shadow-[0_0_15px_var(--orange-dim)]"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="font-display font-bold text-3xl text-text-primary tracking-tight drop-shadow-md">Gastos</h1>
          <p className="text-text-muted mt-1">Acompanhe suas despesas mensais.</p>
        </div>
        <Link 
          href="/gastos/novo"
          className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-orange/50 text-text-primary px-5 py-2.5 rounded-xl font-bold transition-all duration-300 hover:-translate-y-0.5 shadow-lg backdrop-blur-md"
        >
          <Plus size={20} className="text-brand-orange" /> Novo Gasto
        </Link>
      </header>

      <div className="bg-[linear-gradient(145deg,rgba(255,255,255,0.02)_0%,transparent_100%)] backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-all duration-300">
        <div className="space-y-4">
          {gastos?.map((gasto: any) => (
            <div 
              key={gasto.id} 
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-black/20 border border-white/5 flex items-center justify-center text-text-muted group-hover:text-brand-orange transition-colors duration-300 shadow-inner">
                  <Receipt size={22} />
                </div>
                <div>
                  <div className="font-display font-bold text-lg text-text-primary tracking-tight group-hover:text-white transition-colors">
                    {gasto.descricao}
                  </div>
                  <div className="font-display text-sm text-text-muted mt-0.5 flex items-center gap-2">
                    <span>{new Date(gasto.data).toLocaleDateString('pt-BR')}</span>
                    <span className="w-1 h-1 rounded-full bg-text-disabled"></span>
                    <span className="uppercase tracking-wider text-[11px] font-bold text-text-disabled group-hover:text-text-secondary transition-colors">
                      {gasto.categoria}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-left sm:text-right mt-4 sm:mt-0 px-2 sm:px-0">
                <div className="font-mono font-bold text-xl text-danger drop-shadow-[0_0_10px_rgba(248,113,113,0.2)] group-hover:drop-shadow-[0_0_15px_rgba(248,113,113,0.4)] transition-all">
                  -{formatBRL(gasto.valor || 0)}
                </div>
                
                {/* Ações */}
                <div className="flex items-center gap-2 mt-3 sm:justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link 
                    href={`/gastos/novo?id=${gasto.id}`}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted hover:text-white transition-all"
                    title="Editar"
                  >
                    <Pencil size={16} />
                  </Link>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(gasto.id);
                    }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-danger/20 text-text-muted hover:text-danger transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {(!gastos || gastos.length === 0) && (
            <div className="text-center py-20 text-text-muted flex flex-col items-center gap-4 opacity-50">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                <Receipt size={32} strokeWidth={1} />
              </div>
              <div className="font-display">Nenhum gasto registrado.</div>
            </div>
          )}
        </div>
      </div>

      {/* FAB Mobile */}
      <Link 
        href="/gastos/novo"
        className="md:hidden fixed bottom-24 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-brand-orange to-amber-500 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(229,89,29,0.4),inset_0_2px_4px_rgba(255,255,255,0.3)] active:scale-90 transition-all z-50"
      >
        <Plus size={28} />
      </Link>
    </div>
  );
}