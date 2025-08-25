// src/utils/firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDMMAUR5KlJAEMN7kYxYGbTi7oQGR3IO8o",
  authDomain: "midjourneycompetition.firebaseapp.com",
  projectId: "midjourneycompetition",
  storageBucket: "midjourneycompetition.firebasestorage.app",
  messagingSenderId: "56402279673",
  appId: "1:56402279673:web:b7fdaed81c5438d0c4f628"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);