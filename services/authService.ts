import { auth, db } from "@/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface UserData {
  uid: string;
  email: string;
  fullName: string;
  role: "customer" | "company" | "admin";
  phone?: string;
  createdAt?: string;
}

export const authService = {
  async register(
    email: string,
    password: string,
    fullName: string,
    role: "customer" | "company" | "admin" = "customer"
  ): Promise<User> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userData: UserData = {
        uid: user.uid,
        email,
        fullName,
        role,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", user.uid), userData);
      await AsyncStorage.setItem("userToken", user.uid);

      return user;
    } catch (error: any) {
      throw new Error(error.message || "Registration failed");
    }
  },

  async login(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      await AsyncStorage.setItem("userToken", user.uid);
      return user;
    } catch (error: any) {
      throw new Error(error.message || "Login failed");
    }
  },

  async getUserData(uid: string): Promise<UserData | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserData;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch user data");
    }
  },

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      await AsyncStorage.removeItem("userToken");
    } catch (error: any) {
      throw new Error(error.message || "Logout failed");
    }
  },
};
