import { db } from "@/firebaseConfig";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  orderBy,
  Timestamp,
  limit,
} from "firebase/firestore";

export interface Notification {
  id?: string;
  userId: string;
  userRole: "customer" | "company" | "admin";
  type:
    | "request_submitted"
    | "request_accepted"
    | "request_rejected"
    | "request_in_progress"
    | "request_completed"
    | "document_required"
    | "report_uploaded"
    | "account_verified"
    | "system_alert";
  title: string;
  body: string;
  requestId?: string;
  companyId?: string;
  isRead: boolean;
  createdAt: string | Timestamp;
}

export const notificationService = {
  async createNotification(
    notification: Omit<Notification, "id" | "createdAt">
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "notifications"), {
        ...notification,
        isRead: false,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error: any) {
      throw new Error(error.message || "Failed to create notification");
    }
  },

  async getUserNotifications(
    userId: string,
    userRole: "customer" | "company" | "admin"
  ): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        where("userRole", "==", userRole)
      );
      const querySnapshot = await getDocs(q);
      const notifications = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Notification[];

      // Sort by createdAt descending on client side
      return notifications.sort((a, b) => {
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
      throw new Error(error.message || "Failed to fetch notifications");
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    try {
      const docRef = doc(db, "notifications", notificationId);
      await updateDoc(docRef, {
        isRead: true,
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to mark notification as read");
    }
  },

  async markAllAsRead(
    userId: string,
    userRole: "customer" | "company" | "admin"
  ): Promise<void> {
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        where("userRole", "==", userRole),
        where("isRead", "==", false)
      );
      const querySnapshot = await getDocs(q);
      const updatePromises = querySnapshot.docs.map((doc) =>
        updateDoc(doc.ref, { isRead: true })
      );
      await Promise.all(updatePromises);
    } catch (error: any) {
      throw new Error(error.message || "Failed to mark all as read");
    }
  },

  async getUnreadCount(
    userId: string,
    userRole: "customer" | "company" | "admin"
  ): Promise<number> {
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", userId),
        where("userRole", "==", userRole),
        where("isRead", "==", false)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error: any) {
      throw new Error(error.message || "Failed to get unread count");
    }
  },

  // Helper function to create notification for request events
  async notifyRequestStatusChange(
    request: {
      id: string;
      customerId: string;
      companyId: string;
      companyName: string;
      type: "property" | "vehicle";
      status: string;
    }
  ): Promise<void> {
    try {
      // Notify customer
      let customerTitle = "";
      let customerBody = "";

      switch (request.status) {
        case "in_progress":
          customerTitle = "Appraisal In Progress";
          customerBody = `${request.companyName} has started working on your ${request.type === "vehicle" ? "car" : "property"} appraisal request.`;
          break;
        case "completed":
          customerTitle = "Appraisal Completed";
          customerBody = `Your ${request.type === "vehicle" ? "car" : "property"} appraisal from ${request.companyName} has been completed. You can now download the report.`;
          break;
        case "rejected":
          customerTitle = "Request Rejected";
          customerBody = `${request.companyName} has rejected your appraisal request.`;
          break;
        case "incomplete_docs":
          customerTitle = "Documents Required";
          customerBody = `${request.companyName} requires additional documents for your appraisal request.`;
          break;
        default:
          return;
      }

      if (customerTitle) {
        await this.createNotification({
          userId: request.customerId,
          userRole: "customer",
          type: this.getNotificationType(request.status),
          title: customerTitle,
          body: customerBody,
          requestId: request.id,
          companyId: request.companyId,
          isRead: false,
        });
      }

      // Notify company when customer submits request
      if (request.status === "pending") {
        // Get company by companyId to find the userId
        const { companyService } = await import("./companyService");
        const company = await companyService.getCompanyById(request.companyId);
        
        if (company && (company as any).userId) {
          await this.createNotification({
            userId: (company as any).userId,
            userRole: "company",
            type: "request_submitted",
            title: "New Appraisal Request",
            body: `You have received a new ${request.type === "vehicle" ? "car" : "property"} appraisal request.`,
            requestId: request.id,
            companyId: request.companyId,
            isRead: false,
          });
        }
      }
    } catch (error: any) {
      console.error("Error creating notification:", error);
    }
  },

  getNotificationType(status: string): Notification["type"] {
    switch (status) {
      case "pending":
        return "request_submitted";
      case "in_progress":
        return "request_in_progress";
      case "completed":
        return "request_completed";
      case "rejected":
        return "request_rejected";
      case "incomplete_docs":
        return "document_required";
      default:
        return "system_alert";
    }
  },
};

