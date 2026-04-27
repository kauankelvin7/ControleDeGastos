// js/db.js — KiNance Firestore CRUD
import {
  collection, addDoc, deleteDoc, doc, updateDoc, setDoc, getDoc,
  onSnapshot, query, orderBy, limit, where, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { db } from "./firebase.js";

// ── User Profile ────────────────────────────────────────
export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data() : null;
}

export async function saveUserProfile(uid, dados) {
  await setDoc(doc(db, "users", uid), dados, { merge: true });
}

// ── Aportes ─────────────────────────────────────────────
export function onAportes(uid, callback, onError) {
  const q = query(
    collection(db, `users/${uid}/aportes`),
    orderBy("data", "desc"),
    limit(100)
  );
  return onSnapshot(q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => { console.error("[KiNance] onAportes:", err); onError?.(err); }
  );
}

export async function addAporte(uid, dados) {
  _validateAporte(dados);
  const cotas = Number(dados.cotas);
  const valorCota = Number(dados.valorCota);
  await addDoc(collection(db, `users/${uid}/aportes`), {
    ticker: dados.ticker.toUpperCase(),
    cotas,
    valorCota,
    valorTotal: cotas * valorCota,
    tipo: dados.tipo,
    observacao: dados.observacao || "",
    data: serverTimestamp(),
    criadoEm: serverTimestamp(),
  });
}

export async function deleteAporte(uid, id) {
  await deleteDoc(doc(db, `users/${uid}/aportes/${id}`));
}

// ── Dividendos ──────────────────────────────────────────
export function onDividendos(uid, callback, onError) {
  const q = query(
    collection(db, `users/${uid}/dividendos`),
    orderBy("data", "desc"),
    limit(50)
  );
  return onSnapshot(q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => { console.error("[KiNance] onDividendos:", err); onError?.(err); }
  );
}

export async function addDividendo(uid, dados) {
  _validateDividendo(dados);
  const valorPorCota = Number(dados.valorPorCota);
  const totalCotas   = Number(dados.totalCotas);
  await addDoc(collection(db, `users/${uid}/dividendos`), {
    ticker: dados.ticker.toUpperCase(),
    valorPorCota,
    totalCotas,
    valorRecebido: valorPorCota * totalCotas,
    competencia: dados.competencia || "",
    reinvestido: Boolean(dados.reinvestido),
    data: serverTimestamp(),
  });
}

export async function deleteDividendo(uid, id) {
  await deleteDoc(doc(db, `users/${uid}/dividendos/${id}`));
}

// ── Gastos ──────────────────────────────────────────────
export function onGastos(uid, mesKey, callback, onError) {
  const q = query(
    collection(db, `users/${uid}/gastos`),
    where("mes", "==", mesKey),
    orderBy("data", "desc")
  );
  return onSnapshot(q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => { console.error("[KiNance] onGastos:", err); onError?.(err); }
  );
}

export async function addGasto(uid, dados) {
  _validateGasto(dados);
  const mesKey = dados.mes || (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,"0")}`;
  })();
  await addDoc(collection(db, `users/${uid}/gastos`), {
    descricao: dados.descricao.trim(),
    valor: Number(dados.valor),
    categoria: dados.categoria,
    recorrente: Boolean(dados.recorrente),
    mes: mesKey,
    data: serverTimestamp(),
  });
}

export async function deleteGasto(uid, id) {
  await deleteDoc(doc(db, `users/${uid}/gastos/${id}`));
}

// ── Reserva ─────────────────────────────────────────────
export function onReserva(uid, callback, onError) {
  const q = query(
    collection(db, `users/${uid}/reserva`),
    orderBy("data", "desc"),
    limit(100)
  );
  return onSnapshot(q,
    (snap) => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
    (err) => { console.error("[KiNance] onReserva:", err); onError?.(err); }
  );
}

export async function addReserva(uid, dados) {
  if (!dados.valor || Number(dados.valor) <= 0) throw new Error("Valor inválido");
  if (!["deposito", "retirada"].includes(dados.tipo)) throw new Error("Tipo inválido");
  await addDoc(collection(db, `users/${uid}/reserva`), {
    valor: Number(dados.valor),
    tipo: dados.tipo,
    onde: dados.onde || "",
    data: serverTimestamp(),
  });
}

// ── Validações ───────────────────────────────────────────
function _validateAporte(d) {
  if (!d.ticker || !/^[A-Z]{4}\d{2}$/.test(d.ticker.toUpperCase()))
    throw new Error("Ticker inválido (ex: MXRF11)");
  if (!d.cotas || Number(d.cotas) <= 0)
    throw new Error("Quantidade de cotas deve ser maior que zero");
  if (!d.valorCota || Number(d.valorCota) <= 0)
    throw new Error("Valor da cota deve ser maior que zero");
  if (!["compra", "venda"].includes(d.tipo))
    throw new Error("Tipo inválido");
}

function _validateDividendo(d) {
  if (!d.ticker) throw new Error("Ticker obrigatório");
  if (!d.valorPorCota || Number(d.valorPorCota) <= 0)
    throw new Error("Valor por cota inválido");
  if (!d.totalCotas || Number(d.totalCotas) <= 0)
    throw new Error("Total de cotas inválido");
}

function _validateGasto(d) {
  if (!d.valor || Number(d.valor) <= 0) throw new Error("Valor inválido");
  if (!d.categoria) throw new Error("Categoria obrigatória");
  if (!d.descricao || d.descricao.trim().length < 2)
    throw new Error("Descrição muito curta");
}
