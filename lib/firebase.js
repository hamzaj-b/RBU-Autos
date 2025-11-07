// /lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCxQgHTILu1Shqu9s46MG4od1bmAsNQWOM",
  authDomain: "rbu-autos.firebaseapp.com",
  projectId: "rbu-autos",
  storageBucket: "rbu-autos.appspot.com", // 👈 fixed typo: should be .appspot.com not .firebasestorage.app
  messagingSenderId: "36304355521",
  appId: "1:36304355521:web:52604765cc3005a702d440",
};

// Initialize Firebase (prevent re-init on hot reload)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth, RecaptchaVerifier, signInWithPhoneNumber };
