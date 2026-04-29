"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import NotificationsPanel from "@/components/layout/NotificationsPanel";
import { useAlertChecker } from "@/hooks/useAlertChecker";
import { AlertCircle, Loader2 } from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  nome: string;
  onboardingCompleto: boolean;
  [key: string]: unknown;
}

// ─── constants ────────────────────────────────────────────────────────────────

const AVATAR_FALLBACK = "?";

// ─── loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div
      className="h-screen w-full flex flex-col items-center justify-center bg-[#0a0a0a]"
      role="status"
      aria-label="Autenticando..."
    >
      <div className="relative group">
        <div className="absolute inset-0 bg-orange-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-white/[0.01] border border-white/5 flex items-center justify-center shadow-2xl overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
           <Loader2 size={32} className="text-orange-500 animate-spin" strokeWidth={2} />
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center gap-2">
         <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/20 animate-pulse">Sincronizando Sessão</span>
         <div className="w-12 h-0.5 bg-white/[0.05] rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 w-1/2 animate-[shimmer_1.5s_infinite_ease-in-out]" />
         </div>
      </div>
    </div>
  );
}

// ─── error screen ─────────────────────────────────────────────────────────────

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-8 bg-[#0a0a0a] px-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-red-500/5 border border-red-500/10 flex items-center justify-center shadow-inner">
        <AlertCircle size={40} className="text-red-400/40" strokeWidth={1.5} />
      </div>
      <div>
         <h2 className="text-xl font-bold text-white tracking-tight">Falha na Autenticação</h2>
         <p className="text-sm font-medium text-white/30 mt-2 max-w-xs leading-relaxed">Não conseguimos validar sua identidade. Verifique sua conexão.</p>
      </div>
      <button
        onClick={onRetry}
        className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all shadow-xl active:scale-95"
      >
        Tentar Novamente
      </button>
    </div>
  );
}

// ─── layout ───────────────────────────────────────────────────────────────────

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState(false);

  useAlertChecker();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        router.push("/");
        return;
      }

      try {
        const docSnap = await getDoc(doc(db, "users", user.uid));

        if (!docSnap.exists() || !docSnap.data().onboardingCompleto) {
          router.push("/onboarding");
          return;
        }

        setProfile(docSnap.data() as UserProfile);
        setAuthError(false);
      } catch (err: unknown) {
        console.error("Erro ao checar perfil:", err);
        setAuthError(true);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  if (loading) return <LoadingScreen />;

  if (authError) {
    return (
      <ErrorScreen
        onRetry={() => {
          setAuthError(false);
          setLoading(true);
          window.location.reload();
        }}
      />
    );
  }

  const avatarInitial = profile?.nome?.[0]?.toUpperCase() ?? AVATAR_FALLBACK;
  const firstName = profile?.nome?.split(" ")[0] ?? "Investidor";

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex md:pl-64 relative overflow-hidden font-sans selection:bg-orange-500/30 selection:text-orange-200">

      {/* Atmospheric background glows */}
      <div className="fixed pointer-events-none inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-orange-500/[0.03] blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/[0.03] blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <Sidebar userProfile={profile} />

      <main className="flex-1 w-full pb-24 md:pb-0 flex flex-col relative z-10">

        {/* Top bar - Glassmorphism refined */}
        <div className="w-full h-18 border-b border-white/[0.03] flex items-center justify-between px-6 md:px-10 shrink-0 sticky top-0 bg-[#0a0a0a]/40 backdrop-blur-3xl z-40">
          
          {/* Subtle line decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />

          {/* Mobile Profile Display */}
          <div className="flex items-center gap-4 md:hidden" aria-hidden>
            <div className="relative group">
               <div className="absolute inset-0 bg-orange-500/20 blur-md rounded-lg scale-110 opacity-0 group-hover:opacity-100 transition-opacity" />
               <div
                className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center font-bold text-black text-xs shadow-lg"
              >
                {avatarInitial}
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-white/20 uppercase tracking-[0.2em] font-bold">
                Dashboard
              </span>
              <span className="font-bold text-[13px] text-white/90 leading-tight flex items-center gap-1.5">
                Olá, {firstName}
                <span className="animate-wave inline-block origin-bottom-right" aria-hidden>👋</span>
              </span>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-6 ml-auto">
            <NotificationsPanel />
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-12 lg:p-16 flex-1 max-w-[1400px] mx-auto w-full animate-in fade-in slide-in-from-bottom-2 duration-1000 ease-out">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}