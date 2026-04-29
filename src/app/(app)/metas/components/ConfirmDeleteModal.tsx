import { Trash2, AlertTriangle } from "lucide-react";

interface ConfirmDeleteModalProps {
  titulo: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteModal({ titulo, loading, onConfirm, onCancel }: ConfirmDeleteModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onCancel} 
      />
      
      <div className="relative z-10 w-full max-w-sm bg-[#0a0a0a] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-inner">
            <Trash2 size={28} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Excluir Meta</h2>
            <p className="text-white/40 text-sm mt-2 leading-relaxed">
              Deseja remover a meta <span className="text-white font-semibold">"{titulo}"</span>? Esta ação não pode ser desfeita.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 w-full pt-2">
            <button
              onClick={onCancel}
              disabled={loading}
              className="py-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] text-white/60 font-bold text-sm transition-all duration-300"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="py-4 rounded-2xl bg-red-500/90 hover:bg-red-500 text-white font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : "Excluir"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
