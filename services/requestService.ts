import { db } from "@/firebaseConfig";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export type RequestStatus =
  | "pending"
  | "under_review"
  | "incomplete_docs"
  | "in_progress"
  | "completed"
  | "rejected";

export type RequestType = "property" | "vehicle";

export interface AppraisalRequest {
  id?: string;
  customerId: string;
  companyId: string;
  companyName: string;
  type: RequestType;
  status: RequestStatus;
  propertyType?: string; // e.g., "Villa", "Apartment", "Toyota Camry 2020"
  location: string;
  description?: string;
  documents?: string[]; // URLs to uploaded documents
  reportUrl?: string; // URL to final PDF report
  createdAt: string | Timestamp;
  updatedAt: string | Timestamp;
}

export const requestService = {
  async createRequest(
    request: Omit<AppraisalRequest, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, "requests"), {
        ...request,
        createdAt: now,
        updatedAt: now,
      });

      // Create notification for company
      const { notificationService } = await import("./notificationService");
      await notificationService.notifyRequestStatusChange({
        id: docRef.id,
        customerId: request.customerId,
        companyId: request.companyId,
        companyName: request.companyName,
        type: request.type,
        status: "pending",
      });

      return docRef.id;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create request");
    }
  },

  async getCustomerRequests(customerId: string): Promise<AppraisalRequest[]> {
    try {
      const q = query(
        collection(db, "requests"),
        where("customerId", "==", customerId)
      );
      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AppraisalRequest[];
      // Sort by createdAt descending on client side to avoid index requirement
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

  async getCompanyRequests(companyId: string): Promise<AppraisalRequest[]> {
    try {
      const q = query(
        collection(db, "requests"),
        where("companyId", "==", companyId)
      );
      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AppraisalRequest[];
      // Sort by createdAt descending on client side to avoid index requirement
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
      throw new Error(error.message || "Failed to fetch company requests");
    }
  },

  async getRequestById(requestId: string): Promise<AppraisalRequest | null> {
    try {
      const docRef = doc(db, "requests", requestId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as AppraisalRequest;
      }
      return null;
    } catch (error: any) {
      throw new Error(error.message || "Failed to fetch request");
    }
  },

  async updateRequestStatus(
    requestId: string,
    status: RequestStatus
  ): Promise<void> {
    try {
      const docRef = doc(db, "requests", requestId);
      const requestDoc = await getDoc(docRef);

      if (!requestDoc.exists()) {
        throw new Error("Request not found");
      }

      const requestData = requestDoc.data() as AppraisalRequest;

      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now(),
      });

      // Create notification for status change
      const { notificationService } = await import("./notificationService");
      await notificationService.notifyRequestStatusChange({
        id: requestId,
        customerId: requestData.customerId,
        companyId: requestData.companyId,
        companyName: requestData.companyName,
        type: requestData.type,
        status,
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to update request");
    }
  },
};
