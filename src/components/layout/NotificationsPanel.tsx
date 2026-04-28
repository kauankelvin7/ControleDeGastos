"use client";

import { useState } from "react";
import { useNotifications } from "@/hooks/useFirebaseData";
import { Bell, Check, Info, AlertTriangle, Lightbulb } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export default function NotificationsPanel() {
  const { data: notifications } = useNotifications();
  const [open, setOpen] = useState(false);

  const unread = notifications?.filter((n: any) => !n.lida) || [];

  const markAsRead = async (id: string) => {
    if (!auth.currentUser) return;
    try {
      await updateDoc(doc(db, `users/${auth.currentUser.uid}/notifications`, id), {
        lida: true,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    if (!auth.currentUser) return;
    for (const n of unread) {
      await markAsRead(n.id);
    }
    setOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "alerta": return <AlertTriangle size={18} className="text-danger drop-shadow-[0_0_8px_rgba(248,113,113,0.4)]" />;
      case "oportunidade": return <Lightbulb size={18} className="text-info drop-shadow-[0_0_8px_rgba(96,165,250,0.4)]" />;
      default: return <Info size={18} className="text-brand-orange drop-shadow-[0_0_8px_rgba(229,89,29,0.4)]" />;
    }
  };

  return (
    <div className="relative">
      {/* Botão do Sino com Efeito de Vidro */}
      <button 
        onClick={() => setOpen(!open)}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 relative border ${
          open 
          ? "bg-white/10 border-white/20 text-white shadow-glow" 
          : "bg-white/5 border-white/5 text-text-muted hover:bg-white/10 hover:text-text-primary"
        }`}
      >
        <Bell size={20} className={open ? "animate-none" : "hover:rotate-12 transition-transform"} />
        {unread.length > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-orange rounded-full shadow-[0_0_10px_var(--orange)] animate-pulse border border-bg-base"></span>
        )}
      </button>

      {/* Dropdown de Notificações (Glassmorphism) */}
      {open && (
        <>
          {/* Overlay invisível para fechar ao clicar fora */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          
          <div className="absolute right-0 mt-3 w-85 sm:w-96 bg-[#0a0907] border border-white/10 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300">
            
            {/* Header do Painel */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.03]">
              <h3 className="font-display font-bold text-text-primary flex items-center gap-2 tracking-tight">
                <Bell size={16} className="text-brand-orange" /> Notificações
              </h3>
              {unread.length > 0 && (
                <button 
                  onClick={markAllAsRead} 
                  className="text-[10px] font-bold uppercase tracking-widest text-text-disabled hover:text-brand-orange transition-colors flex items-center gap-1.5"
                >
                  <Check size={14} /> Marcar todas
                </button>
              )}
            </div>
            
            {/* Lista de Notificações */}
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications && notifications.length > 0 ? (
                notifications.map((notif: any) => (
                  <div 
                    key={notif.id} 
                    className={`group p-5 border-b border-white/5 last:border-0 transition-all duration-300 flex gap-4 items-start cursor-pointer ${
                      notif.lida 
                      ? 'opacity-75 hover:opacity-100 bg-black/10' 
                      : 'bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                    onClick={() => !notif.lida && markAsRead(notif.id)}
                  >
                    {/* Ícone com Background Esculpido */}
                    <div className={`p-2.5 rounded-xl transition-all duration-300 shadow-inner border ${
                      notif.lida 
                      ? 'bg-black/20 border-transparent' 
                      : 'bg-white/5 border-white/5 group-hover:border-white/10 group-hover:bg-white/10'
                    }`}>
                      {getIcon(notif.tipo)}
                    </div>

                    <div className="flex-1">
                      <div className="flex justify-between items-start gap-2">
                        <div className={`font-bold font-display text-sm tracking-tight transition-colors ${
                          notif.lida ? 'text-text-secondary' : 'text-text-primary group-hover:text-white'
                        }`}>
                          {notif.titulo}
                        </div>
                        {!notif.lida && (
                          <div className="w-1.5 h-1.5 rounded-full bg-brand-orange shadow-[0_0_8px_var(--orange)] mt-1.5 flex-shrink-0"></div>
                        )}
                      </div>
                      <div className="text-xs text-text-muted leading-relaxed mt-1 group-hover:text-text-secondary transition-colors">
                        {notif.mensagem}
                      </div>
                      <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-text-disabled mt-3 font-mono">
                        {new Date(notif.data).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center flex flex-col items-center gap-3 opacity-40">
                  <Bell size={40} strokeWidth={1} className="text-text-disabled" />
                  <p className="text-sm font-display font-medium text-text-muted">Nenhuma notificação por enquanto.</p>
                </div>
              )}
            </div>

            {/* Footer sutil */}
            <div className="p-3 bg-white/[0.01] text-center border-t border-white/5">
               <span className="text-[9px] uppercase tracking-[0.2em] text-text-disabled font-bold">KiNance Intelligence</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}