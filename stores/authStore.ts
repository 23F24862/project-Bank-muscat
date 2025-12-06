import { create } from "zustand";
import { User } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UserData {
  uid: string;
  email: string;
  fullName: string;
  role: "customer" | "company" | "admin";
  phone?: string;
}

interface AuthState {
  user: User | null;
  userData: UserData | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setUserData: (userData: UserData | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  userData: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setUserData: (userData) => set({ userData }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: async () => {
    await AsyncStorage.removeItem("userToken");
    set({ user: null, userData: null });
  },
}));

