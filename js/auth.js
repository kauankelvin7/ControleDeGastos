// js/auth.js — KiNance Auth Module
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { app, db } from "./firebase.js";

const auth = getAuth(app);

/**
 * Garante que o usuário está autenticado.
 * Se não, redireciona para login.
 * Resolve com o user object.
 */
export function requireAuth(callback) {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      unsub(); // remove listener após primeira verificação
      if (!user) {
        window.location.replace("/index.html");
        reject(new Error("Não autenticado"));
      } else {
        callback?.(user);
        resolve(user);
      }
    });
  });
}

/**
 * Verifica se o onboarding foi completado.
 * Se não, redireciona para /onboarding.html.
 */
export async function checkOnboarding(uid) {
  try {
    const snap = await getDoc(doc(db, "users", uid));
    if (!snap.exists() || !snap.data().onboardingCompleto) {
      window.location.replace("/onboarding.html");
      return false;
    }
    return snap.data();
  } catch (err) {
    console.warn("[KiNance] checkOnboarding:", err.message);
    return false;
  }
}

/**
 * Faz logout e redireciona para login.
 */
export async function logout() {
  try {
    await signOut(auth);
    window.location.replace("/index.html");
  } catch (err) {
    console.error("[KiNance] logout:", err.message);
    window.location.replace("/index.html");
  }
}

/**
 * Timer de inatividade — logout automático após 30 dias.
 */
export function initInactivityTimer() {
  const MAX = 30 * 24 * 60 * 60 * 1000;
  let timer = setTimeout(() => signOut(auth), MAX);
  const reset = () => {
    clearTimeout(timer);
    timer = setTimeout(() => signOut(auth), MAX);
  };
  ["click", "keydown", "touchstart"].forEach(e => document.addEventListener(e, reset, { passive: true }));
}

export { auth };
