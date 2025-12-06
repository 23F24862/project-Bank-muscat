import { Company, companyService } from "@/services/companyService";
import { ratingService, Review } from "@/services/ratingService";
import { useAuthStore } from "@/stores/authStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Timestamp } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const COLORS = {
  maroon: "#8d193c",
  gold: "#D4AF37",
  white: "#FFFFFF",
  black: "#000000",
  lightGray: "#F5F5F5",
  gray: "#E0E0E0",
  darkGray: "#9E9E9E",
  textGray: "#757575",
  green: "#4CAF50",
};

export default function CompanyDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userData } = useAuthStore();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);

  const loadCompany = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await companyService.getCompanyById(id);
      setCompany(data);
    } catch (error: any) {
      console.error("Error loading company:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const loadReviews = useCallback(async () => {
    if (!id) return;
    setIsLoadingReviews(true);
    try {
      const data = await ratingService.getCompanyReviews(id);
      setReviews(data);
    } catch (error: any) {
      console.error("Error loading reviews:", error);
    } finally {
      setIsLoadingReviews(false);
    }
  }, [id]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  useEffect(() => {
    if (id) {
      loadReviews();
    }
  }, [id, loadReviews]);

  const handleSubmitRequest = () => {
    if (!userData) {
      router.push("/login" as any);
      return;
    }
    router.push(`/submit-request?companyId=${id}` as any);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <MaterialIcons key={i} name="star" size={20} color={COLORS.gold} />
      );
    }
    if (hasHalfStar) {
      stars.push(
        <MaterialIcons
          key="half"
          name="star-half"
          size={20}
          color={COLORS.gold}
        />
      );
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <MaterialIcons
          key={`empty-${i}`}
          name="star-border"
          size={20}
          color={COLORS.gold}
        />
      );
    }
    return stars;
  };

  const formatReviewDate = (date: string | Timestamp) => {
    if (!date) return "N/A";
    try {
      let dateObj: Date;
      if (date instanceof Timestamp) {
        dateObj = date.toDate();
      } else if (typeof date === "string") {
        dateObj = new Date(date);
      } else {
        dateObj = new Date();
      }
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - dateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const diffMonths = Math.floor(diffDays / 30);

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffMonths < 12) return `${diffMonths} months ago`;
      return `${Math.floor(diffMonths / 12)} years ago`;
    } catch {
      return "N/A";
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.maroon} />
        </View>
      </SafeAreaView>
    );
  }

  if (!company) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Company not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{company.name}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.companyInfoCard}>
          <View style={styles.iconContainer}>
            <MaterialIcons name="business" size={48} color={COLORS.maroon} />
          </View>

          <Text style={styles.companyName}>{company.name}</Text>

          <View style={styles.ratingSection}>
            <View style={styles.ratingContainer}>
              {renderStars(company.rating)}
            </View>
            <Text style={styles.ratingText}>
              {company.rating.toFixed(1)} / 5.0 ({company.totalRatings} reviews)
            </Text>
          </View>

          {company.description && (
            <Text style={styles.description}>{company.description}</Text>
          )}

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <MaterialIcons
                name="location-on"
                size={20}
                color={COLORS.maroon}
              />
              <Text style={styles.detailText}>{company.location}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="phone" size={20} color={COLORS.maroon} />
              <Text style={styles.detailText}>{company.phone}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="email" size={20} color={COLORS.maroon} />
              <Text style={styles.detailText}>{company.email}</Text>
            </View>

            <View style={styles.detailRow}>
              <MaterialIcons name="verified" size={20} color={COLORS.green} />
              <Text style={styles.detailText}>
                License: {company.licenseNumber}
              </Text>
            </View>
          </View>

          <View style={styles.servicesSection}>
            <Text style={styles.sectionTitle}>Services Offered</Text>
            <View style={styles.servicesRow}>
              {company.services.map((service, index) => (
                <View key={index} style={styles.serviceTag}>
                  <MaterialIcons
                    name={service === "property" ? "home" : "directions-car"}
                    size={16}
                    color={COLORS.white}
                  />
                  <Text style={styles.serviceTagText}>
                    {service === "property" ? "Property" : "Vehicle"}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Reviews Section */}
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <Text style={styles.sectionTitle}>Customer Reviews</Text>
              <Text style={styles.reviewsCount}>
                {company.totalRatings}{" "}
                {company.totalRatings === 1 ? "Review" : "Reviews"}
              </Text>
            </View>

            {isLoadingReviews ? (
              <View style={styles.reviewsLoadingContainer}>
                <ActivityIndicator size="small" color={COLORS.maroon} />
              </View>
            ) : reviews.length === 0 ? (
              <View style={styles.emptyReviewsCard}>
                <MaterialIcons
                  name="rate-review"
                  size={48}
                  color={COLORS.darkGray}
                />
                <Text style={styles.emptyReviewsTitle}>No Reviews Yet</Text>
                <Text style={styles.emptyReviewsText}>
                  Be the first to review this company
                </Text>
              </View>
            ) : (
              <View style={styles.reviewsList}>
                {reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <View style={styles.reviewHeaderLeft}>
                        <View style={styles.reviewerIcon}>
                          <MaterialIcons
                            name="person"
                            size={20}
                            color={COLORS.maroon}
                          />
                        </View>
                        <View>
                          <Text style={styles.reviewerName}>
                            {review.customerName}
                          </Text>
                          <View style={styles.reviewRating}>
                            {renderStars(review.rating)}
                          </View>
                        </View>
                      </View>
                      <Text style={styles.reviewDate}>
                        {formatReviewDate(review.createdAt)}
                      </Text>
                    </View>
                    {review.reviewText && (
                      <Text style={styles.reviewText}>{review.reviewText}</Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmitRequest}
        >
          <Text style={styles.submitButtonText}>Submit Appraisal Request</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    backgroundColor: COLORS.maroon,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  backButton: {
    marginBottom: 16,
    padding: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textGray,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  companyInfoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.gray,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.lightGray,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.maroon,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 12,
  },
  ratingSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  ratingContainer: {
    flexDirection: "row",
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: COLORS.textGray,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: "center",
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  detailText: {
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 12,
    flex: 1,
  },
  servicesSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 12,
  },
  servicesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  serviceTag: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  serviceTagText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.white,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
    backgroundColor: COLORS.white,
  },
  submitButton: {
    backgroundColor: COLORS.maroon,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  reviewsSection: {
    marginTop: 24,
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewsCount: {
    fontSize: 14,
    color: COLORS.textGray,
    fontWeight: "500",
  },
  comingSoonCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderStyle: "dashed",
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginTop: 12,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: "center",
    lineHeight: 20,
  },
  reviewsLoadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyReviewsCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderStyle: "dashed",
  },
  emptyReviewsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginTop: 12,
    marginBottom: 8,
  },
  emptyReviewsText: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: "center",
    lineHeight: 20,
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  reviewHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  reviewerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.maroon,
  },
  reviewerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: "row",
  },
  reviewDate: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  reviewText: {
    fontSize: 14,
    color: COLORS.black,
    lineHeight: 20,
  },
});
