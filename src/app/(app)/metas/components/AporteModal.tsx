import React, { useState, useEffect } from "react";
import { Meta } from "../types";
import { formatBRL, maskCurrency, parseCurrency } from "@/lib/utils";
import { Plus, X, AlertCircle } from "lucide-react";

interface AporteModalProps {
  meta: Meta;
  loading: boolean;
  onConfirm: (valor: number) => Promise<boolean>;
  onCancel: () => void;
}

export function AporteModal({ meta, loading, onConfirm, onCancel }: AporteModalProps) {
  const [valorInput, setValorInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = parseCurrency(valorInput);
    
    if (valor <= 0) {
      setError("Informe um valor válido");
      return;
    }

    const success = await onConfirm(valor);
    if (!success) {
      setError("Erro ao processar aporte");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onCancel} />
      
      <div className="relative z-10 w-full max-w-sm bg-[#0a0a0a] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col items-center gap-6 text-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner border"
              style={{ backgroundColor: `${meta.cor}10`, borderColor: `${meta.cor}20`, color: meta.cor }}
            >
              <Plus size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Novo Aporte</h2>
              <p className="text-white/40 text-sm mt-2">
                Quanto você deseja guardar para <span className="text-white font-semibold">"{meta.titulo}"</span>?
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/20 font-mono font-bold text-xl">R$</span>
              <input
                autoFocus
                type="text"
                required
                value={valorInput}
                onChange={(e) => {
                  setValorInput(maskCurrency(e.target.value));
                  setError(null);
                }}
                placeholder="0,00"
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-16 pr-6 py-5 text-white font-mono text-2xl tracking-tight focus:outline-none focus:border-white/20 transition-all placeholder:text-white/5"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-xs font-bold uppercase tracking-wide px-2 animate-in fade-in duration-300">
                <AlertCircle size={14} />
                {error}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="py-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-white/60 font-bold text-sm transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="py-4 rounded-2xl bg-white text-black font-bold text-sm transition-all hover:shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
