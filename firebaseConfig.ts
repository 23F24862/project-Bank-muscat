// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDuARFkMTPBNhpSBKySSKV4ifU6vvR3xos",
  authDomain: "bankmuscat-7b75c.firebaseapp.com",
  projectId: "bankmuscat-7b75c",
  storageBucket: "bankmuscat-7b75c.firebasestorage.app",
  messagingSenderId: "690091034924",
  appId: "1:690091034924:web:8208cf0b1a6dc452788489",
  measurementId: "G-9RV7RY5DKV",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics only on web platform (not available in React Native)
if (Platform.OS === "web" && typeof window !== "undefined") {
  try {
    // Dynamic import to avoid errors in React Native
    import("firebase/analytics").then(({ getAnalytics }) => {
      getAnalytics(app);
    });
  } catch {
    // Analytics not available, continue without it
  }
}

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
