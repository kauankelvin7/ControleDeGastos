"use client";

import { useState } from "react";
import { useNotifications } from "@/hooks/useFirebaseData";
import { Bell, Check, Info, AlertTriangle, Lightbulb, Bot, X } from "lucide-react";
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
      case "alerta": return <AlertTriangle size={16} className="text-red-400" />;
      case "oportunidade": return <Lightbulb size={16} className="text-amber-400" />;
      default: return <Info size={16} className="text-sky-400" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button 
        onClick={() => setOpen(!open)}
        aria-label="Notificações"
        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 relative border ${
          open 
          ? "bg-white text-black border-white shadow-xl" 
          : "bg-white/[0.03] border-white/5 text-white/40 hover:bg-white/[0.06] hover:text-white"
        }`}
      >
        <Bell size={20} className={open ? "" : "group-hover:rotate-12 transition-transform"} />
        {unread.length > 0 && !open && (
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)] border-2 border-[#0a0a0a] animate-pulse" />
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          
          <div className="absolute right-0 mt-4 w-[22rem] sm:w-[26rem] bg-[#0a0a0a]/90 backdrop-blur-3xl border border-white/[0.05] rounded-[2.5rem] shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-500">
            
            {/* Header */}
            <div className="p-8 border-b border-white/[0.03] flex justify-between items-center bg-white/[0.01]">
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-3">
                  Notificações
                </h3>
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/20 mt-1">
                  {unread.length} novas mensagens
                </p>
              </div>
              <div className="flex items-center gap-2">
                {unread.length > 0 && (
                  <button 
                    onClick={markAllAsRead} 
                    className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-white/40 hover:text-white transition-all group"
                    title="Marcar todas como lidas"
                  >
                    <Check size={16} />
                  </button>
                )}
                <button 
                  onClick={() => setOpen(false)}
                  className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-white/40 hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            {/* List */}
            <div className="max-h-[450px] overflow-y-auto custom-scrollbar pb-4">
              {notifications && notifications.length > 0 ? (
                notifications.map((notif: any, index: number) => (
                  <div 
                    key={notif.id} 
                    style={{ animationDelay: `${index * 50}ms` }}
                    className={`group p-6 border-b border-white/[0.03] last:border-0 transition-all duration-500 flex gap-5 items-start cursor-pointer animate-in fade-in slide-in-from-right-4 ${
                      notif.lida 
                      ? 'opacity-40 grayscale-[0.5]' 
                      : 'bg-white/[0.01] hover:bg-white/[0.03]'
                    }`}
                    onClick={() => !notif.lida && markAsRead(notif.id)}
                  >
                    {/* Icon Container */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all duration-500 ${
                      notif.lida 
                      ? 'bg-white/[0.02] border-white/5 text-white/20' 
                      : 'bg-white/[0.03] border-white/10 group-hover:scale-110 shadow-inner'
                    }`}>
                      {getIcon(notif.tipo)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-4">
                        <div className={`text-sm font-bold tracking-tight transition-colors duration-500 ${
                          notif.lida ? 'text-white/40' : 'text-white/90 group-hover:text-white'
                        }`}>
                          {notif.titulo}
                        </div>
                        {!notif.lida && (
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)] mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-[13px] font-medium leading-relaxed mt-1.5 line-clamp-2 transition-colors duration-500 ${
                        notif.lida ? 'text-white/20' : 'text-white/40 group-hover:text-white/60'
                      }`}>
                        {notif.mensagem}
                      </p>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-white/10 mt-4 font-mono">
                        {new Date(notif.data).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-24 text-center flex flex-col items-center gap-6 opacity-20">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center shadow-inner">
                    <Bell size={32} strokeWidth={1} />
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.2em]">Silêncio por aqui</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-2">Nenhuma nova notificação</p>
                  </div>
                </div>
              )}
            </div>

            {/* AI Footer */}
            <div className="p-5 bg-white/[0.02] flex items-center justify-center gap-3 border-t border-white/[0.03]">
               <Bot size={14} className="text-purple-400 opacity-40" />
               <span className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-bold">KiNance Intelligence</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}