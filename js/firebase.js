// js/firebase.js — KiNance Firebase Init (versão modular 10.14.1)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCBg8jEMsA274ZUrvgLmKj59Bf1jALEYoQ",
  authDomain: "controle-de-gastos-717c3.firebaseapp.com",
  projectId: "controle-de-gastos-717c3",
  storageBucket: "controle-de-gastos-717c3.firebasestorage.app",
  messagingSenderId: "60352648303",
  appId: "1:60352648303:web:84c8a9a04083af36a8a99a"
};

export const app  = initializeApp(firebaseConfig);
export const db   = getFirestore(app);
export const auth = getAuth(app);
