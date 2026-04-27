"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import NotificationsPanel from "@/components/layout/NotificationsPanel";
import { useAlertChecker } from "@/hooks/useAlertChecker";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Inicia o motor de alertas em background
  useAlertChecker();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists() || !docSnap.data().onboardingCompleto) {
          router.push("/onboarding");
          return;
        } else {
          setProfile(docSnap.data());
        }
      } catch (err) {
        console.error("Erro ao checar perfil:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#050403]">
        <div className="relative">
          <div className="animate-spin w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full shadow-[0_0_20px_rgba(229,89,29,0.3)]"></div>
          <div className="absolute inset-0 w-12 h-12 border-4 border-white/5 rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex md:pl-64 relative overflow-hidden">
      {/* Luzes de fundo atmosféricas (Linear Design) */}
      <div className="fixed pointer-events-none inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-orange/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full" />
      </div>

      <Sidebar userProfile={profile} />
      
      <main className="flex-1 w-full pb-20 md:pb-0 flex flex-col relative z-10">
        {/* Top Bar para Mobile / Global Actions */}
        <div className="w-full h-16 border-b border-white/5 flex items-center justify-end px-4 md:px-8 shrink-0 sticky top-0 bg-black/40 backdrop-blur-2xl z-40 shadow-sm">
          <div className="flex items-center gap-4">
             <NotificationsPanel />
             {/* Espaço reservado para ações globais futuras */}
          </div>
        </div>
        
        <div className="p-4 md:p-8 flex-1 max-w-[1600px] mx-auto w-full">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}