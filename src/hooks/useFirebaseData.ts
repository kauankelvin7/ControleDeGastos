"use client";

import { useQuery } from "@tanstack/react-query";
import { collection, query, where, getDocs, onSnapshot, orderBy, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// Custom hook helper to listen to firestore in real-time, wrapped in React Query
export function useAportes() {
  return useQuery({
    queryKey: ["aportes", auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser) return [];
      const q = query(
        collection(db, `users/${auth.currentUser.uid}/aportes`),
        orderBy("data", "desc")
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!auth.currentUser,
  });
}

export function useGastos(mesKey?: string) {
  return useQuery({
    queryKey: ["gastos", auth.currentUser?.uid, mesKey],
    queryFn: async () => {
      if (!auth.currentUser) return [];
      let q = query(collection(db, `users/${auth.currentUser.uid}/gastos`), orderBy("data", "desc"));
      if (mesKey) {
        q = query(q, where("mesKey", "==", mesKey));
      }
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!auth.currentUser,
  });
}

export function useReserva() {
  return useQuery({
    queryKey: ["reserva", auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser) return [];
      const q = query(collection(db, `users/${auth.currentUser.uid}/reserva`), orderBy("data", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!auth.currentUser,
  });
}

export function useDividendos() {
  return useQuery({
    queryKey: ["dividendos", auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser) return [];
      const q = query(collection(db, `users/${auth.currentUser.uid}/dividendos`), orderBy("data", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!auth.currentUser,
  });
}

export function useMetas() {
  return useQuery({
    queryKey: ["metas", auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser) return [];
      const q = query(collection(db, `users/${auth.currentUser.uid}/metas`), orderBy("dataLimite", "asc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!auth.currentUser,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications", auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser) return [];
      const q = query(collection(db, `users/${auth.currentUser.uid}/notifications`), orderBy("data", "desc"));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: !!auth.currentUser,
  });
}

// Hook para buscar um documento específico (útil para edição)
export function useGetDoc(subcollection: string, id: string | null) {
  return useQuery({
    queryKey: [subcollection, auth.currentUser?.uid, id],
    queryFn: async () => {
      if (!auth.currentUser || !id) return null;
      const d = await getDoc(doc(db, `users/${auth.currentUser.uid}/${subcollection}`, id));
      if (!d.exists()) return null;
      return { id: d.id, ...d.data() } as any;
    },
    enabled: !!auth.currentUser && !!id,
  });
}
