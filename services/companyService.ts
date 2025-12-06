import { db } from "@/firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export interface Company {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  services: string[]; // ["property", "vehicle"]
  licenseNumber: string;
  rating: number;
  totalRatings: number;
  isApproved: boolean;
  description?: string;
  createdAt?: string;
}

export const companyService = {
  async getApprovedCompanies(): Promise<Company[]> {
    try {
      const q = query(
        collection(db, "companies"),
        where("isApproved", "==", true)
      );
      const querySnapshot = await getDocs(q);
      const companies = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Company[];
      // Sort by name on client side to avoid index requirement
      return companies.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch companies");
    }
  },

  async getCompanyById(companyId: string): Promise<Company | null> {
    try {
      const docRef = doc(db, "companies", companyId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Company;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch company");
    }
  },

  async getCompanyByUserId(userId: string): Promise<Company | null> {
    try {
      const q = query(
        collection(db, "companies"),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const companyDoc = querySnapshot.docs[0];
        return { id: companyDoc.id, ...companyDoc.data() } as Company;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch company by user ID");
    }
  },

  async getCompaniesByService(
    serviceType: "property" | "vehicle"
  ): Promise<Company[]> {
    try {
      // First get all approved companies, then filter by service
      // This avoids the need for a composite index
      const q = query(
        collection(db, "companies"),
        where("isApproved", "==", true)
      );
      const querySnapshot = await getDocs(q);
      const companies = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Company[];
      // Filter by service type and sort by name on client side
      return companies
        .filter((company) => company.services.includes(serviceType))
        .sort((a, b) => a.name.localeCompare(b.name));
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch companies");
    }
  },

  async updateCompany(
    companyId: string,
    updateData: {
      name?: string;
      phone?: string;
      email?: string;
      location?: string;
      description?: string;
    }
  ): Promise<void> {
    try {
      const docRef = doc(db, "companies", companyId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to update company");
    }
  },
};
