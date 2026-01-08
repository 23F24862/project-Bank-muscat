// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBLR_upM3rwGQyVVfFI1kMxGbgZrtZGZkM",
  authDomain: "bank-muscat-4fa06.firebaseapp.com",
  projectId: "bank-muscat-4fa06",
  storageBucket: "bank-muscat-4fa06.firebasestorage.app",
  messagingSenderId: "238133204042",
  appId: "1:238133204042:web:f77625729047be8c8882b3",
  measurementId: "G-GY8DE6GKS2"
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
