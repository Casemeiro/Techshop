import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-analytics.js";
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import { collection, deleteDoc, doc, getDocs, getFirestore, setDoc } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAhSQiE1r1_NCzjDs8p58fSJZOtcOg0gLU",
    authDomain: "techshop-13eeb.firebaseapp.com",
    projectId: "techshop-13eeb",
    storageBucket: "techshop-13eeb.firebasestorage.app",
    messagingSenderId: "428252217967",
    appId: "1:428252217967:web:115d2839a66e630b8ac39a",
    measurementId: "G-6J36QJWM09"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

isSupported()
    .then(supported => {
        if (supported) getAnalytics(app);
    })
    .catch(error => console.warn("Firebase Analytics could not initialize.", error));

export { collection, createUserWithEmailAndPassword, deleteDoc, doc, getDocs, onAuthStateChanged, setDoc, signInWithEmailAndPassword, signOut };
