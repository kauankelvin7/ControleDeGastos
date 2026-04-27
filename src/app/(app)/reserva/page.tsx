"use client";

import { useState, useEffect } from "react";
import { useReserva } from "@/hooks/useFirebaseData";
import { formatBRL, maskCurrency, parseCurrency } from "@/lib/utils";
import { ShieldAlert, Plus, History, Pencil, Trash2, X } from "lucide-react";
import { doc, getDoc, addDoc, updateDoc, deleteDoc, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";

export default function ReservaPage() {
  const { data: historico, isLoading } = useReserva();
  const queryClient = useQueryClient();
  const [meta, setMeta] = useState(15000);
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [valorAdd, setValorAdd] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  const totalReserva = historico?.reduce((acc: number, cur: any) => acc + (cur.valor || 0), 0) || 0;
  const porcentagem = Math.min((totalReserva / meta) * 100, 100);

  useEffect(() => {
    const fetchMeta = async () => {
      if (!auth.currentUser) return;
      const d = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (d.exists() && d.data().reservaEmergenciaAlvo) {
        setMeta(d.data().reservaEmergenciaAlvo);
      }
    };
    fetchMeta();
  }, []);

  const handleAddReserva = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !valorAdd || parseCurrency(valorAdd) <= 0) return;
    
    setLoadingAdd(true);
    try {
      if (editId) {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/reserva`, editId), {
          valor: parseCurrency(valorAdd),
        });
      } else {
        await addDoc(collection(db, `users/${auth.currentUser.uid}/reserva`), {
          valor: parseCurrency(valorAdd),
          data: new Date().toISOString(),
          descricao: "Aporte na Reserva",
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["reserva"] });
      setValorAdd("");
      setEditId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleDeleteReserva = async (id: string) => {
    if (!auth.currentUser || !confirm("Deseja realmente excluir este aporte da reserva?")) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/reserva`, id));
      await queryClient.invalidateQueries({ queryKey: ["reserva"] });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditClick = (item: any) => {
    setEditId(item.id);
    const valorFormatado = (item.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    setValorAdd(maskCurrency(valorFormatado));
    // Rola para o topo (formulário) suavemente se tiver no mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setValorAdd("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full shadow-[0_0_15px_rgba(229,89,29,0.3)]"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="font-display font-bold text-3xl text-text-primary flex items-center gap-3 tracking-tight drop-shadow-md">
          <ShieldAlert className="text-brand-orange drop-shadow-[0_0_8px_rgba(229,89,29,0.5)]" size={32} />
          Reserva de Emergência
        </h1>
        <p className="text-text-muted mt-2">Sua base de segurança financeira para imprevistos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Painel Principal */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card de Saldo e Meta */}
          <div className="bg-[linear-gradient(145deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-2xl border border-white/5 rounded-2xl p-7 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] transition-all hover:border-white/10">
            <div className="flex justify-between items-end mb-6 relative z-10">
              <div>
                <div className="text-text-disabled font-display text-[10px] uppercase tracking-widest mb-1 font-bold">Saldo Protegido</div>
                <div className="font-mono font-bold text-4xl text-text-primary tracking-tighter drop-shadow-sm">{formatBRL(totalReserva)}</div>
              </div>
              <div className="text-right">
                <div className="text-text-disabled font-display text-[10px] uppercase tracking-widest mb-1 font-bold">Meta atual</div>
                <div className="font-mono text-lg text-text-secondary opacity-80">{formatBRL(meta)}</div>
              </div>
            </div>

            {/* Progress Bar Premium */}
            <div className="relative z-10">
              <div className="w-full bg-black/40 rounded-full h-4 mb-3 overflow-hidden border border-white/5 shadow-inner">
                <div 
                  className="h-full bg-[linear-gradient(90deg,var(--orange),var(--amber))] transition-all duration-1000 ease-out relative shadow-[0_0_20px_rgba(229,89,29,0.3)]"
                  style={{ width: `${porcentagem}%` }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.2),transparent)] opacity-40" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase text-text-disabled font-bold tracking-widest">Evolução</span>
                <span className="font-mono text-sm text-brand-orange font-bold drop-shadow-[0_0_8px_rgba(229,89,29,0.2)]">
                  {porcentagem.toFixed(1)}% concluído
                </span>
              </div>
            </div>
          </div>

          {/* Formulário de Aporte Rápido */}
          <form 
            onSubmit={handleAddReserva} 
            className="bg-[linear-gradient(145deg,rgba(255,255,255,0.02)_0%,transparent_100%)] backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex flex-col sm:flex-row gap-5 items-end transition-all hover:border-white/10 relative"
          >
            {editId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="absolute top-4 right-4 text-text-muted hover:text-white bg-black/20 p-2 rounded-full transition-colors"
                title="Cancelar edição"
              >
                <X size={16} />
              </button>
            )}
            
            <div className="flex-1 w-full">
              <label className="text-[10px] font-display font-bold text-text-disabled uppercase tracking-widest px-1 mb-2 block">
                {editId ? "Editar Valor" : "Adicionar à Reserva"}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-disabled font-bold">R$</span>
                <input
                  type="text"
                  value={valorAdd}
                  onChange={(e) => setValorAdd(maskCurrency(e.target.value))}
                  placeholder="0,00"
                  className={`w-full bg-black/20 border shadow-inner rounded-xl pl-12 pr-4 py-4 text-text-primary font-mono text-lg focus:outline-none transition-all placeholder:text-text-disabled ${editId ? 'border-brand-amber focus:border-brand-orange focus:bg-black/30' : 'border-white/10 focus:border-brand-orange focus:bg-black/30'}`}
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={loadingAdd || !valorAdd}
              className="w-full sm:w-auto bg-[linear-gradient(135deg,var(--orange),var(--amber))] shadow-[0_4px_16px_rgba(229,89,29,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_24px_rgba(229,89,29,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none text-white font-bold py-4 px-8 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 tracking-wide"
            >
              {loadingAdd ? "Salvando..." : editId ? "Atualizar" : <><Plus size={20} /> Guardar</>}
            </button>
          </form>
        </div>

        {/* Histórico Lateral */}
        <div className="bg-[linear-gradient(145deg,rgba(255,255,255,0.02)_0%,transparent_100%)] backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all hover:border-white/10 h-fit">
          <h3 className="font-display font-bold text-text-primary mb-6 flex items-center gap-2 tracking-tight">
            <History size={18} className="text-text-disabled" /> Histórico
          </h3>
          <div className="space-y-4">
            {historico?.map((item: any) => (
              <div key={item.id} className="group flex justify-between items-center py-3 px-3 rounded-xl hover:bg-white/[0.03] transition-all border border-transparent hover:border-white/5 relative overflow-hidden">
                <div className="flex-1">
                  <div className="font-display font-bold text-sm text-text-primary group-hover:text-white transition-colors">{item.descricao}</div>
                  <div className="text-[10px] text-text-muted mt-0.5 uppercase tracking-wider font-semibold">{new Date(item.data).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className="font-mono font-bold text-success drop-shadow-[0_0_8px_rgba(74,222,128,0.2)] flex-shrink-0 mr-2 transition-all group-hover:opacity-0 group-hover:-translate-x-4 absolute right-3">+{formatBRL(item.valor)}</div>
                
                {/* Ações */}
                <div className="flex items-center gap-1 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all absolute right-2 bg-black/40 backdrop-blur-md p-1 rounded-lg">
                  <button 
                    onClick={() => handleEditClick(item)}
                    className="p-1.5 rounded-md hover:bg-white/10 text-text-muted hover:text-white transition-all"
                    title="Editar"
                  >
                    <Pencil size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteReserva(item.id)}
                    className="p-1.5 rounded-md hover:bg-danger/20 text-text-muted hover:text-danger transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {(!historico || historico.length === 0) && (
              <div className="text-center py-12 text-sm text-text-muted flex flex-col items-center gap-3 opacity-50">
                <History size={32} strokeWidth={1} />
                Nenhum valor guardado ainda.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}