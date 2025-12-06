import { db, auth } from "@/firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  Timestamp,
  addDoc,
  setDoc,
  where,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Company } from "./companyService";
import { AppraisalRequest } from "./requestService";
import { UserData } from "./authService";

export const adminService = {
  async getAllCompanies(): Promise<Company[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "companies"));
      const companies = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Company[];
      // Sort by name on client side
      return companies.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch companies");
    }
  },

  async getAllUsers(): Promise<UserData[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const users = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
      })) as UserData[];
      // Sort by createdAt descending
      return users.sort((a, b) => {
        const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bDate - aDate;
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch users");
    }
  },

  async getAllRequests(): Promise<AppraisalRequest[]> {
    try {
      const querySnapshot = await getDocs(collection(db, "requests"));
      const requests = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AppraisalRequest[];
      // Sort by createdAt descending
      return requests.sort((a, b) => {
        const aDate =
          a.createdAt instanceof Timestamp
            ? a.createdAt.toDate()
            : new Date(a.createdAt || 0);
        const bDate =
          b.createdAt instanceof Timestamp
            ? b.createdAt.toDate()
            : new Date(b.createdAt || 0);
        return bDate.getTime() - aDate.getTime();
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch requests");
    }
  },

  async updateCompanyStatus(
    companyId: string,
    isApproved: boolean
  ): Promise<void> {
    try {
      const docRef = doc(db, "companies", companyId);
      await updateDoc(docRef, {
        isApproved,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to update company status");
    }
  },

  async suspendCompany(companyId: string): Promise<void> {
    try {
      const docRef = doc(db, "companies", companyId);
      await updateDoc(docRef, {
        isApproved: false,
        isSuspended: true,
        suspendedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to suspend company");
    }
  },

  async archiveCompany(companyId: string): Promise<void> {
    try {
      const docRef = doc(db, "companies", companyId);
      await updateDoc(docRef, {
        isApproved: false,
        isArchived: true,
        archivedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to archive company");
    }
  },

  async updateUserRole(userId: string, role: "customer" | "company" | "admin"): Promise<void> {
    try {
      const docRef = doc(db, "users", userId);
      await updateDoc(docRef, {
        role,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to update user role");
    }
  },

  async disableUser(userId: string): Promise<void> {
    try {
      const docRef = doc(db, "users", userId);
      await updateDoc(docRef, {
        isDisabled: true,
        disabledAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to disable user");
    }
  },

  async createCompany(
    companyData: {
      name: string;
      email: string;
      phone: string;
      location: string;
      services: string[];
      licenseNumber: string;
      description?: string;
      password: string;
    }
  ): Promise<Company> {
    try {
      // Check if company with same email already exists
      const emailQuery = query(
        collection(db, "companies"),
        where("email", "==", companyData.email)
      );
      const emailSnapshot = await getDocs(emailQuery);
      if (!emailSnapshot.empty) {
        throw new Error("Company with this email already exists");
      }

      // Check if license number already exists
      const licenseQuery = query(
        collection(db, "companies"),
        where("licenseNumber", "==", companyData.licenseNumber)
      );
      const licenseSnapshot = await getDocs(licenseQuery);
      if (!licenseSnapshot.empty) {
        throw new Error("Company with this license number already exists");
      }

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        companyData.email,
        companyData.password
      );
      const userId = userCredential.user.uid;

      // Prepare company data (remove password before storing)
      const { password, ...companyDocData } = companyData;

      // Create company document in Firestore
      const companyDocRef = await addDoc(collection(db, "companies"), {
        ...companyDocData,
        userId,
        rating: 0,
        totalRatings: 0,
        isApproved: false, // New companies start as pending
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      // Create user document in users collection
      await setDoc(doc(db, "users", userId), {
        uid: userId,
        email: companyData.email,
        fullName: companyData.name,
        role: "company",
        phone: companyData.phone,
        createdAt: Timestamp.now(),
      });

      // Return the created company
      const companyDoc = await getDoc(companyDocRef);
      return {
        id: companyDoc.id,
        ...companyDoc.data(),
      } as Company;
    } catch (error: any) {
      // If auth user was created but Firestore failed, we should handle cleanup
      // For now, we'll let the error propagate
      throw new Error(error.message || "Failed to create company");
    }
  },
};

