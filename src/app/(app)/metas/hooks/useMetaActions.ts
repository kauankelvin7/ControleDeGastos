import { useState, useCallback } from "react";
import { collection, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useQueryClient } from "@tanstack/react-query";
import { Meta, MetaFormData } from "../types";

export function useMetaActions() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Criar ou Editar Meta
  const saveMeta = async (data: MetaFormData, id?: string) => {
    if (!auth.currentUser) return false;
    setLoading(true);
    setError(null);

    try {
      // Remover campos undefined para não quebrar o Firebase
      const cleanData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined)
      );

      if (id) {
        const metaRef = doc(db, `users/${auth.currentUser.uid}/metas`, id);
        await updateDoc(metaRef, cleanData);
      } else {
        const metasRef = collection(db, `users/${auth.currentUser.uid}/metas`);
        await addDoc(metasRef, {
          ...data,
          valorAtual: 0,
          createdAt: new Date().toISOString(),
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["metas"] });
      return true;
    } catch (err: any) {
      setError(err.message || "Erro ao salvar meta");
      return false;
    } finally {
      setLoading(true); // Manter brevemente para UX ou resetar
      setLoading(false);
    }
  };

  // Adicionar Aporte
  const addAporte = async (id: string, valor: number, valorAtualAntigo: number) => {
    if (!auth.currentUser) return false;
    setLoading(true);
    setError(null);

    try {
      const metaRef = doc(db, `users/${auth.currentUser.uid}/metas`, id);
      await updateDoc(metaRef, {
        valorAtual: valorAtualAntigo + valor,
      });
      await queryClient.invalidateQueries({ queryKey: ["metas"] });
      return true;
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar aporte");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Deletar Meta
  const deleteMeta = async (id: string) => {
    if (!auth.currentUser) return false;
    setLoading(true);
    setError(null);

    try {
      const metaRef = doc(db, `users/${auth.currentUser.uid}/metas`, id);
      await deleteDoc(metaRef);
      await queryClient.invalidateQueries({ queryKey: ["metas"] });
      return true;
    } catch (err: any) {
      setError(err.message || "Erro ao excluir meta");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    saveMeta,
    addAporte,
    deleteMeta,
    loading,
    error,
    clearError
  };
}
