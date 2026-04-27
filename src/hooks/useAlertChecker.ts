import { useEffect } from "react";
import { collection, query, orderBy, limit, getDocs, doc, getDoc, updateDoc, addDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export function useAlertChecker() {
  useEffect(() => {
    const checkAlerts = async () => {
      if (!auth.currentUser) return;
      const uid = auth.currentUser.uid;

      try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return;

        const userData = userSnap.data();
        const lastCheck = userData.lastAlertCheck || 0;
        const now = Date.now();

        // Só verifica a cada 24 horas (86400000 ms)
        if (now - lastCheck < 86400000) return;

        console.log("[KiNance] Rodando verificação de alertas de comportamento...");

        // 1. Checar Ociosidade de Aportes
        const qAportes = query(collection(db, `users/${uid}/aportes`), orderBy("data", "desc"), limit(1));
        const snapAportes = await getDocs(qAportes);
        
        let needsAporteAlert = false;
        if (snapAportes.empty) {
          needsAporteAlert = true;
        } else {
          const ultimoAporteData = new Date(snapAportes.docs[0].data().data).getTime();
          const diasSemAporte = (now - ultimoAporteData) / (1000 * 60 * 60 * 24);
          if (diasSemAporte > 30) needsAporteAlert = true;
        }

        if (needsAporteAlert) {
          // Checar se já existe um alerta recente de ociosidade
          const qNotif = query(collection(db, `users/${uid}/notifications`), orderBy("data", "desc"), limit(10));
          const snapNotif = await getDocs(qNotif);
          const alreadyAlerted = snapNotif.docs.some(d => d.data().tipo === "alerta" && d.data().titulo === "Ociosidade de Investimento" && (now - new Date(d.data().data).getTime()) < 86400000 * 7); // Sem alerta duplicado por 7 dias

          if (!alreadyAlerted) {
            await addDoc(collection(db, `users/${uid}/notifications`), {
              tipo: "alerta",
              titulo: "Ociosidade de Investimento",
              mensagem: "Notamos que você não realiza aportes há mais de 30 dias. A consistência é o segredo dos juros compostos. Que tal investir uma pequena quantia hoje?",
              data: new Date().toISOString(),
              lida: false
            });
          }
        }

        // 2. Atualizar data da última checagem
        await updateDoc(userRef, { lastAlertCheck: now });

      } catch (err) {
        console.error("Erro no motor de alertas:", err);
      }
    };

    // Delay the check slightly so it doesn't block initial render
    const timeout = setTimeout(checkAlerts, 3000);
    return () => clearTimeout(timeout);
  }, []);
}
