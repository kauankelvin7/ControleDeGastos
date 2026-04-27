"use client";

import { useState } from "react";
import { useMetas } from "@/hooks/useFirebaseData";
import { formatBRL, maskCurrency, parseCurrency } from "@/lib/utils";
import { Target, Plus, Flag, Calendar, X, Pencil, Trash2 } from "lucide-react";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";

export default function MetasPage() {
  const { data: metas, isLoading } = useMetas();
  const queryClient = useQueryClient();
  const [loadingAdd, setLoadingAdd] = useState(false);

  // Form State
  const [titulo, setTitulo] = useState("");
  const [valorAlvo, setValorAlvo] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [editMetaId, setEditMetaId] = useState<string | null>(null);

  // Aporte State
  const [aporteMetaId, setAporteMetaId] = useState<string | null>(null);
  const [valorAporte, setValorAporte] = useState("");
  const [loadingAporte, setLoadingAporte] = useState(false);

  const handleAddMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseCurrency(valorAlvo);
    if (!auth.currentUser || !titulo || valor <= 0) return;
    
    setLoadingAdd(true);
    try {
      if (editMetaId) {
        await updateDoc(doc(db, `users/${auth.currentUser.uid}/metas`, editMetaId), {
          titulo,
          valorAlvo: valor,
          dataLimite: dataLimite || null,
        });
      } else {
        await addDoc(collection(db, `users/${auth.currentUser.uid}/metas`), {
          titulo,
          valorAlvo: valor,
          valorAtual: 0,
          dataLimite: dataLimite || null,
          criadoEm: new Date().toISOString(),
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["metas"] });
      setTitulo("");
      setValorAlvo("");
      setDataLimite("");
      setEditMetaId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdd(false);
    }
  };

  const handleEditClick = (meta: any) => {
    setEditMetaId(meta.id);
    setTitulo(meta.titulo);
    const valorFormatado = (meta.valorAlvo || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
    setValorAlvo(maskCurrency(valorFormatado));
    setDataLimite(meta.dataLimite || "");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditMetaId(null);
    setTitulo("");
    setValorAlvo("");
    setDataLimite("");
  };

  const handleDeleteMeta = async (id: string) => {
    if (!auth.currentUser || !confirm("Deseja realmente excluir esta meta? Todo o histórico associado a ela será perdido.")) return;
    try {
      await deleteDoc(doc(db, `users/${auth.currentUser.uid}/metas`, id));
      await queryClient.invalidateQueries({ queryKey: ["metas"] });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAporteMeta = async (e: React.FormEvent, metaId: string, valorAtualAnterior: number) => {
    e.preventDefault();
    const valorAdicional = parseCurrency(valorAporte);
    if (!auth.currentUser || valorAdicional <= 0) return;

    setLoadingAporte(true);
    try {
      await updateDoc(doc(db, `users/${auth.currentUser.uid}/metas`, metaId), {
        valorAtual: valorAtualAnterior + valorAdicional,
      });
      await queryClient.invalidateQueries({ queryKey: ["metas"] });
      setAporteMetaId(null);
      setValorAporte("");
    } catch (err) {
      console.error(err);
      alert("Erro ao realizar aporte na meta.");
    } finally {
      setLoadingAporte(false);
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
    <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">
      <header className="mb-10">
        <h1 className="font-display font-bold text-3xl text-text-primary flex items-center gap-3 tracking-tight drop-shadow-md">
          <Target className="text-brand-orange drop-shadow-[0_0_8px_rgba(229,89,29,0.5)]" size={32} />
          Minhas Metas
        </h1>
        <p className="text-text-muted mt-2 max-w-2xl">Dê um propósito para o seu dinheiro e acompanhe sua evolução para realizar seus sonhos.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Painel Principal de Metas */}
        <div className="lg:col-span-2 space-y-5">
          {metas?.map((meta: any) => {
            const porcentagem = Math.min(((meta.valorAtual || 0) / (meta.valorAlvo || 1)) * 100, 100);
            const isAportando = aporteMetaId === meta.id;

            return (
              <div 
                key={meta.id} 
                className="group bg-[linear-gradient(145deg,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] hover:border-white/10 transition-all duration-300 relative overflow-hidden"
              >
                {/* Indicador de Status Glow */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-brand-orange to-brand-amber opacity-70 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Ações Rápidas (Editar/Excluir) */}
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all z-20">
                  <button 
                    onClick={() => handleEditClick(meta)}
                    className="p-1.5 rounded-md hover:bg-white/10 text-text-muted hover:text-white transition-all bg-black/20 backdrop-blur-md"
                    title="Editar Meta"
                  >
                    <Pencil size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteMeta(meta.id)}
                    className="p-1.5 rounded-md hover:bg-danger/20 text-text-muted hover:text-danger transition-all bg-black/20 backdrop-blur-md"
                    title="Excluir Meta"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex justify-between items-start mb-5 relative z-10 pr-16">
                  <div>
                    <h3 className="font-display font-bold text-xl text-text-primary flex items-center gap-2 tracking-tight group-hover:text-white transition-colors">
                      <Flag size={18} className="text-brand-orange" /> {meta.titulo}
                    </h3>
                    {meta.dataLimite && (
                      <div className="text-xs text-text-muted mt-1.5 flex items-center gap-1.5 font-medium">
                        <Calendar size={14} className="opacity-70" /> 
                        <span>Alvo: {new Date(meta.dataLimite + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <div>
                      <div className="text-text-disabled font-display text-[10px] uppercase tracking-widest mb-1 font-bold">Valor da Meta</div>
                      <div className="font-mono text-xl text-text-primary drop-shadow-sm">{formatBRL(meta.valorAlvo)}</div>
                    </div>
                    {!isAportando && (
                      <button 
                        onClick={() => {
                          setAporteMetaId(meta.id);
                          setValorAporte("");
                        }}
                        className="text-xs font-bold text-brand-orange hover:text-white bg-brand-orange/10 hover:bg-brand-orange/30 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0"
                      >
                        <Plus size={12} /> Guardar
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Bar Container */}
                <div className="relative z-10 mb-3">
                  <div className="w-full bg-black/40 rounded-full h-3 border border-white/5 overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-[linear-gradient(90deg,var(--orange),var(--amber))] transition-all duration-1000 ease-out relative shadow-[0_0_15px_rgba(229,89,29,0.3)]"
                      style={{ width: `${porcentagem}%` }}
                    >
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.2),transparent)] opacity-50" />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center text-sm relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-brand-orange text-lg drop-shadow-[0_0_8px_rgba(229,89,29,0.2)]">
                      {porcentagem.toFixed(1)}%
                    </span>
                    <span className="text-[10px] uppercase text-text-disabled font-bold tracking-tighter">concluído</span>
                  </div>
                  <span className="font-mono text-text-secondary font-medium">
                    <span className="text-text-disabled text-xs mr-1 font-display uppercase tracking-wider">Guardado:</span> 
                    {formatBRL(meta.valorAtual || 0)}
                  </span>
                </div>

                {/* Área de Aporte (Expansível) */}
                {isAportando && (
                  <form 
                    onSubmit={(e) => handleAporteMeta(e, meta.id, meta.valorAtual || 0)}
                    className="mt-4 pt-4 border-t border-white/5 relative z-10 animate-in slide-in-from-top-4 fade-in duration-300"
                  >
                    <button
                      type="button"
                      onClick={() => setAporteMetaId(null)}
                      className="absolute right-0 -top-8 text-text-muted hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                    >
                      <X size={16} />
                    </button>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled font-bold text-xs">R$</span>
                        <input
                          type="text"
                          required
                          value={valorAporte}
                          onChange={(e) => setValorAporte(maskCurrency(e.target.value))}
                          placeholder="0,00"
                          className="w-full bg-black/30 border border-brand-orange/30 shadow-inner rounded-xl pl-9 pr-3 py-2.5 text-text-primary font-mono text-sm focus:outline-none focus:border-brand-orange transition-all placeholder:text-text-disabled"
                          autoFocus
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={loadingAporte || !valorAporte}
                        className="bg-[linear-gradient(135deg,var(--orange),var(--amber))] text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:shadow-[0_4px_12px_rgba(229,89,29,0.3)] active:scale-95 disabled:opacity-50 transition-all whitespace-nowrap"
                      >
                        {loadingAporte ? "..." : "Adicionar"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}

          {(!metas || metas.length === 0) && (
            <div className="text-center py-20 bg-white/[0.02] border border-white/5 border-dashed rounded-2xl flex flex-col items-center justify-center opacity-60 transition-opacity hover:opacity-100">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/5">
                <Target size={32} className="text-text-disabled stroke-[1.5px]" />
              </div>
              <div className="text-text-secondary font-display font-bold mb-2">Você ainda não definiu nenhuma meta.</div>
              <div className="text-text-muted text-sm max-w-xs mx-auto leading-relaxed">
                Ter um objetivo claro é o primeiro passo para o sucesso financeiro. Use o formulário lateral para começar.
              </div>
            </div>
          )}
        </div>

        {/* Formulário de Nova/Editar Meta */}
        <div className="lg:sticky lg:top-8 h-fit">
          <div className="bg-[linear-gradient(145deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.01)_100%)] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 shadow-[0_32px_64px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] relative">
            
            {editMetaId && (
              <button
                onClick={handleCancelEdit}
                className="absolute top-6 right-6 text-text-muted hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors"
                title="Cancelar Edição"
              >
                <X size={18} />
              </button>
            )}

            <h3 className="font-display font-bold text-text-primary mb-6 flex items-center gap-2 tracking-tight">
              <div className="w-8 h-8 rounded-lg bg-brand-orange/10 flex items-center justify-center">
                {editMetaId ? (
                  <Pencil size={18} className="text-brand-orange" />
                ) : (
                  <Plus size={18} className="text-brand-orange" />
                )}
              </div>
              {editMetaId ? "Editar Meta" : "Nova Meta"}
            </h3>
            
            <form onSubmit={handleAddMeta} className="space-y-5">
              <div>
                <label className="text-[10px] font-display font-bold text-text-disabled uppercase tracking-widest px-1 mb-2 block">Objetivo</label>
                <input
                  type="text"
                  required
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ex: Viagem, Carro, Casamento"
                  className="w-full bg-black/20 border border-white/10 shadow-inner rounded-xl px-4 py-3 text-text-primary font-display text-sm focus:outline-none focus:border-brand-orange focus:bg-black/30 transition-all placeholder:text-text-disabled"
                />
              </div>

              <div>
                <label className="text-[10px] font-display font-bold text-text-disabled uppercase tracking-widest px-1 mb-2 block">Valor necessário</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-disabled font-bold text-sm">R$</span>
                  <input
                    type="text"
                    required
                    value={valorAlvo}
                    onChange={(e) => setValorAlvo(maskCurrency(e.target.value))}
                    placeholder="0,00"
                    className="w-full bg-black/20 border border-white/10 shadow-inner rounded-xl pl-10 pr-4 py-3 text-text-primary font-mono text-sm focus:outline-none focus:border-brand-orange focus:bg-black/30 transition-all placeholder:text-text-disabled"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-display font-bold text-text-disabled uppercase tracking-widest px-1 mb-2 block">Data Alvo (Opcional)</label>
                <input
                  type="date"
                  value={dataLimite}
                  onChange={(e) => setDataLimite(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 shadow-inner rounded-xl px-4 py-3 text-text-primary font-mono text-sm focus:outline-none focus:border-brand-orange focus:bg-black/30 transition-all [color-scheme:dark]"
                />
              </div>

              <button 
                type="submit"
                disabled={loadingAdd || !titulo || !valorAlvo}
                className="w-full bg-[linear-gradient(135deg,var(--orange),var(--amber))] shadow-[0_4px_16px_rgba(229,89,29,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_24px_rgba(229,89,29,0.4),inset_0_1px_0_rgba(255,255,255,0.4)] hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none text-white font-bold py-4 rounded-xl transition-all duration-300 text-sm tracking-wide mt-2"
              >
                {loadingAdd ? "Salvando..." : editMetaId ? "Atualizar Meta" : "Criar Meta"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}