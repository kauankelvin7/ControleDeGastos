"use client";

import { useState, useMemo, useCallback } from "react";
import { useAportes, useMetas } from "@/hooks/useFirebaseData";
import { calcularAporteMedioMensal } from "@/lib/utils";
import { Sparkles, BrainCircuit, Target, AlertCircle } from "lucide-react";

// Componentes Modularizados
import { Meta } from "./types";
import { useMetaActions } from "./hooks/useMetaActions";
import { MetaCard } from "./components/MetaCard";
import { MetaForm } from "./components/MetaForm";
import { AporteModal } from "./components/AporteModal";
import { ConfirmDeleteModal } from "./components/ConfirmDeleteModal";

export default function MetasPage() {
  const { data: rawMetas, isLoading: loadingMetas } = useMetas();
  const { data: aportes } = useAportes();
  const metas = (rawMetas as Meta[] | undefined) ?? [];

  // Hooks de Ações
  const { saveMeta, addAporte, deleteMeta, loading: processing, error: actionError } = useMetaActions();

  // Estados de Controle de Modais
  const [editingMeta, setEditingMeta] = useState<Meta | null>(null);
  const [aporteTarget, setAporteTarget] = useState<Meta | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Meta | null>(null);

  // Média de aportes global (janela de 3 meses)
  const avgAporteMensal = useMemo(() => {
    return calcularAporteMedioMensal(aportes as any[], 3);
  }, [aportes]);

  // Handlers Memolizados para Performance
  const handleEdit = useCallback((meta: Meta) => {
    setEditingMeta(meta);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const handleDeleteRequest = useCallback((meta: Meta) => setDeleteTarget(meta), []);
  const handleAporteRequest = useCallback((meta: Meta) => setAporteTarget(meta), []);

  const handleSave = async (data: any, id?: string) => {
    const success = await saveMeta(data, id);
    if (success) setEditingMeta(null);
    return success;
  };

  const handleAporteConfirm = async (valor: number) => {
    if (!aporteTarget) return false;
    const success = await addAporte(aporteTarget.id, valor, aporteTarget.valorAtual);
    if (success) setAporteTarget(null);
    return success;
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    const success = await deleteMeta(deleteTarget.id);
    if (success) setDeleteTarget(null);
  };

  return (
    <div className="animate-in fade-in zoom-in-95 duration-700 pb-20 space-y-12">
      {/* Header */}
      <header className="px-2">
        <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white/95 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.25rem] bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-[0_0_20px_rgba(249,115,22,0.1)]">
            <Target className="text-orange-500" size={28} />
          </div>
          Metas Financeiras
        </h1>
        <p className="text-sm font-medium text-white/40 mt-3 max-w-xl leading-relaxed ml-1">
          Transforme seus sonhos em números. Acompanhe o progresso e projete seu futuro com inteligência.
        </p>
      </header>

      {/* Formulário de Meta */}
      <MetaForm 
        metaToEdit={editingMeta} 
        loading={processing}
        onSave={handleSave}
        onCancel={() => setEditingMeta(null)}
      />

      {/* Seção de Projeções e Lista */}
      <section className="space-y-8">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-xl font-bold text-white/90 tracking-tight flex items-center gap-3">
            <BrainCircuit size={22} className="text-orange-500" />
            Seus Objetivos
          </h2>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/5 border border-orange-500/10">
            <Sparkles size={14} className="text-orange-500" />
            <span className="text-[10px] font-bold text-orange-500/80 uppercase tracking-widest">
              Análise Ativa: {metas.length} Ativos
            </span>
          </div>
        </div>

        {loadingMetas ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-pulse">
            {[1, 2].map(i => <div key={i} className="h-64 bg-white/[0.02] border border-white/5 rounded-[2.5rem]" />)}
          </div>
        ) : metas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/[0.01] border border-dashed border-white/5 rounded-[3rem] gap-4">
            <Target size={48} className="text-white/10" strokeWidth={1} />
            <p className="text-sm font-bold text-white/20 uppercase tracking-[0.2em]">Nenhuma meta cadastrada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {metas.map(meta => (
              <MetaCard 
                key={meta.id} 
                meta={meta} 
                avgAporteMensal={avgAporteMensal}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
                onAporte={handleAporteRequest}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modais de Suporte */}
      {aporteTarget && (
        <AporteModal 
          meta={aporteTarget}
          loading={processing}
          onConfirm={handleAporteConfirm}
          onCancel={() => setAporteTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmDeleteModal 
          titulo={deleteTarget.titulo}
          loading={processing}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Erros Globais de Ação */}
      {actionError && (
        <div className="fixed bottom-8 right-8 z-[110] bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-4 duration-500">
          <AlertCircle size={20} />
          <span className="text-sm font-bold">{actionError}</span>
        </div>
      )}
    </div>
  );
}