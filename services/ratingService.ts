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

export interface Review {
  id: string;
  companyId: string;
  companyName: string;
  customerId: string;
  customerName: string;
  requestId: string;
  rating: number; // 1-5
  reviewText?: string;
  createdAt: string | Timestamp;
}

export const ratingService = {
  async submitRating(
    companyId: string,
    customerId: string,
    requestId: string,
    rating: number,
    reviewText?: string
  ): Promise<void> {
    try {
      // Validate rating
      if (rating < 1 || rating > 5) {
        throw new Error("Rating must be between 1 and 5");
      }

      // Check if customer has already rated this request
      const existingReviewQuery = query(
        collection(db, "reviews"),
        where("requestId", "==", requestId),
        where("customerId", "==", customerId)
      );
      const existingReviews = await getDocs(existingReviewQuery);
      if (!existingReviews.empty) {
        throw new Error("You have already rated this request");
      }

      // Get company data
      const companyDoc = await getDoc(doc(db, "companies", companyId));
      if (!companyDoc.exists()) {
        throw new Error("Company not found");
      }
      const companyData = companyDoc.data();

      // Get customer data
      const customerDoc = await getDoc(doc(db, "users", customerId));
      if (!customerDoc.exists()) {
        throw new Error("Customer not found");
      }
      const customerData = customerDoc.data();

      // Create review document
      await addDoc(collection(db, "reviews"), {
        companyId,
        companyName: companyData.name,
        customerId,
        customerName: customerData.fullName || "Anonymous",
        requestId,
        rating,
        reviewText: reviewText?.trim() || null,
        createdAt: Timestamp.now(),
      });

      // Update company rating
      await this.updateCompanyRating(companyId);
    } catch (error: any) {
      throw new Error(error.message || "Failed to submit rating");
    }
  },

  async getCompanyReviews(companyId: string): Promise<Review[]> {
    try {
      const q = query(
        collection(db, "reviews"),
        where("companyId", "==", companyId)
      );
      const querySnapshot = await getDocs(q);
      const reviews = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Review[];

      // Sort by createdAt descending (newest first)
      return reviews.sort((a, b) => {
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
      throw new Error(error.message || "Failed to fetch reviews");
    }
  },

  async updateCompanyRating(companyId: string): Promise<void> {
    try {
      // Get all reviews for this company
      const q = query(
        collection(db, "reviews"),
        where("companyId", "==", companyId)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // No reviews, set default values
        await updateDoc(doc(db, "companies", companyId), {
          rating: 0,
          totalRatings: 0,
          updatedAt: Timestamp.now(),
        });
        return;
      }

      // Calculate average rating
      let totalRating = 0;
      querySnapshot.forEach((doc) => {
        const reviewData = doc.data();
        totalRating += reviewData.rating || 0;
      });

      const averageRating = totalRating / querySnapshot.size;
      const totalRatings = querySnapshot.size;

      // Update company document
      await updateDoc(doc(db, "companies", companyId), {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
        totalRatings,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      throw new Error(error.message || "Failed to update company rating");
    }
  },

  async hasRatedRequest(
    requestId: string,
    customerId: string
  ): Promise<boolean> {
    try {
      const q = query(
        collection(db, "reviews"),
        where("requestId", "==", requestId),
        where("customerId", "==", customerId)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error: any) {
      console.error("Error checking rating:", error);
      return false;
    }
  },
};
