import React, { useState, useEffect } from "react";
import { Meta, MetaFormData } from "../types";
import { maskCurrency, parseCurrency } from "@/lib/utils";
import { Plus, Flag, X, Check, Calendar } from "lucide-react";

interface MetaFormProps {
  metaToEdit: Meta | null;
  loading: boolean;
  onSave: (data: MetaFormData, id?: string) => Promise<boolean>;
  onCancel: () => void;
}

const CATEGORIAS = ["Investimento", "Reserva", "Objetivo", "Viagem", "Bens", "Outros"];
const CORES = ["#e5591d", "#8b5cf6", "#10b981", "#3b82f6", "#f59e0b", "#ef4444"];

export function MetaForm({ metaToEdit, loading, onSave, onCancel }: MetaFormProps) {
  const [formData, setFormData] = useState<MetaFormData>({
    titulo: "",
    valorAlvo: 0,
    categoria: "Investimento",
    cor: "#e5591d",
    prazo: ""
  });
  const [valorAlvoInput, setValorAlvoInput] = useState("");

  useEffect(() => {
    if (metaToEdit) {
      setFormData({
        titulo: metaToEdit.titulo || "",
        valorAlvo: metaToEdit.valorAlvo || 0,
        categoria: metaToEdit.categoria || "Investimento",
        cor: metaToEdit.cor || "#e5591d",
        prazo: metaToEdit.prazo || ""
      });
      setValorAlvoInput((metaToEdit.valorAlvo || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
    }
  }, [metaToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseCurrency(valorAlvoInput);
    if (!formData.titulo || valor <= 0) return;

    const success = await onSave({ ...formData, valorAlvo: valor }, metaToEdit?.id);
    if (success && !metaToEdit) {
      // Reset if new
      setFormData({ titulo: "", valorAlvo: 0, categoria: "Investimento", cor: "#e5591d", prazo: "" });
      setValorAlvoInput("");
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="bg-[#0a0a0a] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 rounded-[2.5rem] p-8 lg:p-10 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-700"
    >
      <div className="flex flex-col gap-8 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
              <Flag className="text-orange-500" size={18} />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {metaToEdit ? "Editar Meta" : "Nova Meta"}
            </h2>
          </div>
          {metaToEdit && (
            <button 
              type="button" 
              onClick={onCancel}
              className="p-2 rounded-xl bg-white/[0.03] border border-white/5 text-white/20 hover:text-white transition-all"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-1">Título do Objetivo</label>
            <input
              type="text"
              required
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Liberdade Financeira"
              className="w-full bg-white/[0.02] border border-white/5 rounded-2xl px-6 py-4 text-white placeholder:text-white/5 focus:outline-none focus:border-orange-500/50 transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-1">Valor Alvo</label>
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-mono font-bold">R$</span>
              <input
                type="text"
                required
                value={valorAlvoInput}
                onChange={(e) => setValorAlvoInput(maskCurrency(e.target.value))}
                placeholder="0,00"
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white font-mono focus:outline-none focus:border-orange-500/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-1">Categoria</label>
            <select
              value={formData.categoria}
              onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl px-6 py-4 text-white focus:outline-none focus:border-orange-500/50 transition-all appearance-none"
            >
              {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-1">Prazo (Opcional)</label>
            <div className="relative">
              <Calendar className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type="date"
                value={formData.prazo}
                onChange={(e) => setFormData({ ...formData, prazo: e.target.value })}
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-14 pr-6 py-4 text-white focus:outline-none focus:border-orange-500/50 transition-all [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-1">Cor do Card</span>
            <div className="flex gap-2">
              {CORES.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFormData({ ...formData, cor: c })}
                  className={`w-6 h-6 rounded-full border-2 transition-all hover:scale-110 ${formData.cor === c ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.2)]' : 'border-transparent opacity-50'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto bg-white text-black px-10 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {loading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : (
              <>
                {metaToEdit ? "Salvar Alterações" : "Criar Meta Financeira"}
                <Check size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
