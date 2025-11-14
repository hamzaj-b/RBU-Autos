// /lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCjR8LNDK03jQhKyT7mwkl3UhCIOb_MrXo",
  authDomain: "rbu-otp.firebaseapp.com",
  projectId: "rbu-otp",
  storageBucket: "rbu-otp.firebasestorage.app",
  messagingSenderId: "112993020788",
  appId: "1:112993020788:web:99068f4f20ec9ee0361a21",
  measurementId: "G-M3P5740X1G"
};

// Initialize Firebase (prevent re-init on hot reload)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth, RecaptchaVerifier, signInWithPhoneNumber };
