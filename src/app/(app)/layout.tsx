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
import { AlertCircle } from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  nome: string;
  onboardingCompleto: boolean;
  [key: string]: unknown; // campos extras do Firestore sem quebrar a tipagem
}

// ─── constants ────────────────────────────────────────────────────────────────

const AVATAR_FALLBACK = "?";

// ─── loading screen ───────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div
      className="h-screen w-full flex items-center justify-center bg-[#050403]"
      role="status"
      aria-label="Verificando autenticação..."
    >
      <div className="relative">
        <div className="animate-spin w-12 h-12 border-4 border-brand-orange border-t-transparent rounded-full shadow-[0_0_20px_rgba(229,89,29,0.3)]" />
        <div className="absolute inset-0 w-12 h-12 border-4 border-white/5 rounded-full" aria-hidden />
      </div>
    </div>
  );
}

// ─── error screen ─────────────────────────────────────────────────────────────

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-4 bg-[#050403] text-text-muted">
      <AlertCircle size={40} className="text-danger opacity-60" />
      <p className="font-display text-lg text-text-primary">Não foi possível verificar sua sessão.</p>
      <p className="text-sm text-text-disabled">Verifique sua conexão e tente novamente.</p>
      <button
        onClick={onRetry}
        className="mt-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-text-primary font-bold transition-all duration-200"
      >
        Tentar novamente
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
    // onAuthStateChanged é um listener de longa duração — deve ser registrado
    // UMA única vez no mount. Colocar pathname ou router nos deps recriaria o
    // listener a cada navegação, gerando leituras desnecessárias no Firestore
    // e possíveis race conditions entre listeners sobrepostos.
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Garante que o spinner seja removido antes do redirect,
        // evitando que o finally nunca seja alcançado neste branch.
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // deps vazias intencionais — ver comentário acima

  if (loading) return <LoadingScreen />;

  if (authError) {
    return (
      <ErrorScreen
        onRetry={() => {
          setAuthError(false);
          setLoading(true);
          // Reautenticar via reload é a forma mais segura de re-disparar
          // o listener do Firebase sem reimplementar a lógica manualmente.
          window.location.reload();
        }}
      />
    );
  }

  const avatarInitial = profile?.nome?.[0]?.toUpperCase() ?? AVATAR_FALLBACK;
  const firstName = profile?.nome?.split(" ")[0] ?? "Investidor";

  return (
    <div className="min-h-screen bg-bg-base flex md:pl-64 relative overflow-hidden">

      {/* Atmospheric background lights */}
      <div className="fixed pointer-events-none inset-0 z-0" aria-hidden>
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-orange/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/5 blur-[120px] rounded-full" />
      </div>

      <Sidebar userProfile={profile} />

      <main className="flex-1 w-full pb-20 md:pb-0 flex flex-col relative z-10">

        {/* Top bar */}
        <div className="w-full h-16 border-b border-white/5 flex items-center justify-between px-4 md:px-8 shrink-0 sticky top-0 bg-black/40 backdrop-blur-2xl z-40 shadow-sm">

          {/* Mobile: brand/profile (hidden on desktop) */}
          <div className="flex items-center gap-3 md:invisible" aria-hidden>
            <div
              className="w-8 h-8 rounded-lg bg-[linear-gradient(135deg,var(--orange),var(--amber))] flex items-center justify-center font-bold text-white shadow-[0_4px_10px_rgba(229,89,29,0.3)] text-xs select-none"
            >
              {avatarInitial}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-text-muted uppercase tracking-widest font-bold">
                Bem-vindo
              </span>
              <span className="font-display font-bold text-sm text-text-primary leading-tight flex items-center gap-1">
                {firstName}{" "}
                <span className="animate-wave inline-block origin-bottom-right" aria-hidden>
                  👋
                </span>
              </span>
            </div>
          </div>

          {/* Right: actions */}
          <div className="flex items-center gap-4">
            <NotificationsPanel />
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