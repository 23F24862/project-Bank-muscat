import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ratingService } from "@/services/ratingService";
import { AppraisalRequest, requestService } from "@/services/requestService";
import { useAuthStore } from "@/stores/authStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Colors matching the design
const COLORS = {
  maroon: "#8d193c",
  gold: "#D4AF37",
  white: "#FFFFFF",
  black: "#000000",
  lightGray: "#F5F5F5",
  gray: "#E0E0E0",
  darkGray: "#9E9E9E",
  textGray: "#757575",
  lightPink: "#FCE4EC",
  green: "#4CAF50",
  blue: "#2196F3",
  orange: "#FF9800",
  red: "#F44336",
};

export default function RequestsScreen() {
  const { userData } = useAuthStore();
  const [requests, setRequests] = useState<AppraisalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<AppraisalRequest | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [hasRatedMap, setHasRatedMap] = useState<Record<string, boolean>>({});

  const loadRequests = useCallback(async () => {
    if (!userData) return;
    setIsLoading(true);
    try {
      const data = await requestService.getCustomerRequests(userData.uid);
      setRequests(data);

      // Check which requests have been rated
      const ratedMap: Record<string, boolean> = {};
      for (const request of data) {
        if (request.id && request.status === "completed") {
          try {
            const hasRated = await ratingService.hasRatedRequest(
              request.id,
              userData.uid
            );
            ratedMap[request.id] = hasRated;
          } catch (error) {
            console.error("Error checking rating:", error);
            ratedMap[request.id] = false;
          }
        }
      }
      setHasRatedMap(ratedMap);
    } catch (error: any) {
      console.error("Error loading requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    if (userData) {
      loadRequests();
    }
  }, [userData, loadRequests]);

  const handleRateCompany = (request: AppraisalRequest) => {
    if (!request.id) return;
    setSelectedRequest(request);
    setRating(0);
    setReviewText("");
    setShowRatingModal(true);
  };

  const handleSubmitRating = async () => {
    if (!selectedRequest || !selectedRequest.id || !userData) return;
    if (rating === 0) {
      Alert.alert("Error", "Please select a rating");
      return;
    }

    setIsSubmittingRating(true);
    try {
      await ratingService.submitRating(
        selectedRequest.companyId,
        userData.uid,
        selectedRequest.id,
        rating,
        reviewText.trim() || undefined
      );
      Alert.alert("Success", "Thank you for your rating!");
      setShowRatingModal(false);
      setSelectedRequest(null);
      setRating(0);
      setReviewText("");
      // Update hasRatedMap
      setHasRatedMap((prev) => ({
        ...prev,
        [selectedRequest.id!]: true,
      }));
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit rating");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return COLORS.green;
      case "in_progress":
        return COLORS.blue;
      case "pending":
      case "under_review":
        return COLORS.orange;
      case "incomplete_docs":
        return COLORS.red;
      case "rejected":
        return COLORS.red;
      default:
        return COLORS.orange;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In Progress";
      case "pending":
        return "Pending";
      case "under_review":
        return "Under Review";
      case "incomplete_docs":
        return "Incomplete Docs";
      case "rejected":
        return "Rejected";
      default:
        return status;
    }
  };

  const formatDate = (date: string | any) => {
    if (!date) return "N/A";
    try {
      const dateObj = date.toDate ? date.toDate() : new Date(date);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - dateObj.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch {
      return "N/A";
    }
  };

  const getTypeIcon = (type: string) => {
    if (type === "vehicle") {
      return "directions-car";
    }
    return "home";
  };

  const getTypeLabel = (type: string) => {
    if (type === "vehicle") {
      return "Car Valuation";
    }
    return "Home Valuation";
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />

      {/* Maroon Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appraisal Requests</Text>
        <Text style={styles.headerSubtitle}>
          Track and manage your valuation requests
        </Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.maroon} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {requests.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons
                name="assignment"
                size={64}
                color={COLORS.darkGray}
              />
              <Text style={styles.emptyTitle}>No Requests Yet</Text>
              <Text style={styles.emptySubtitle}>
                Your appraisal requests will appear here
              </Text>
            </View>
          ) : (
            requests.map((request) => {
              const statusColor = getStatusColor(request.status);
              return (
                <TouchableOpacity
                  key={request.id}
                  style={styles.requestCard}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                      <View
                        style={[
                          styles.iconContainer,
                          { backgroundColor: COLORS.lightPink },
                        ]}
                      >
                        <MaterialIcons
                          name={getTypeIcon(request.type) as any}
                          size={24}
                          color={COLORS.maroon}
                        />
                      </View>
                      <View style={styles.cardHeaderText}>
                        <Text style={styles.companyName}>
                          {request.companyName}
                        </Text>
                        <Text style={styles.requestType}>
                          {getTypeLabel(request.type)}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: statusColor + "20" },
                      ]}
                    >
                      <Text style={[styles.statusText, { color: statusColor }]}>
                        {getStatusLabel(request.status)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.cardBody}>
                    <View style={styles.infoRow}>
                      <MaterialIcons
                        name="description"
                        size={16}
                        color={COLORS.textGray}
                      />
                      <Text style={styles.infoText}>
                        {request.propertyType || "N/A"}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialIcons
                        name="location-on"
                        size={16}
                        color={COLORS.textGray}
                      />
                      <Text style={styles.infoText}>{request.location}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialIcons
                        name="access-time"
                        size={16}
                        color={COLORS.textGray}
                      />
                      <Text style={styles.infoText}>
                        {formatDate(request.createdAt)}
                      </Text>
                    </View>
                  </View>

                  {request.status === "completed" && (
                    <View style={styles.cardFooter}>
                      {request.reportUrl ? (
                        <TouchableOpacity
                          style={styles.viewButton}
                          onPress={() => {
                            // TODO: Implement PDF download
                            Alert.alert(
                              "Download Report",
                              "PDF download functionality is coming soon. The report will be available for download once this feature is implemented."
                            );
                          }}
                        >
                          <MaterialIcons
                            name="download"
                            size={16}
                            color={COLORS.maroon}
                          />
                          <Text style={styles.viewButtonText}>
                            Download Report
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.comingSoonCard}>
                          <MaterialIcons
                            name="description"
                            size={20}
                            color={COLORS.darkGray}
                          />
                          <Text style={styles.comingSoonText}>
                            Report will be available soon
                          </Text>
                        </View>
                      )}
                      {request.id && hasRatedMap[request.id] ? (
                        <View style={styles.ratedCard}>
                          <MaterialIcons
                            name="check-circle"
                            size={16}
                            color={COLORS.green}
                          />
                          <Text style={styles.ratedText}>Rated</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.rateButton}
                          onPress={() => handleRateCompany(request)}
                        >
                          <MaterialIcons
                            name="star"
                            size={16}
                            color={COLORS.gold}
                          />
                          <Text style={styles.rateButtonText}>
                            Rate Company
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Rating Modal */}
      <Modal
        visible={showRatingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRatingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LoadingSpinner visible={isSubmittingRating} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rate Company</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowRatingModal(false);
                  setRating(0);
                  setReviewText("");
                }}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={COLORS.textGray} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              {selectedRequest?.companyName}
            </Text>

            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.starButton}
                >
                  <MaterialIcons
                    name={star <= rating ? "star" : "star-border"}
                    size={40}
                    color={COLORS.gold}
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.ratingLabel}>
              {rating === 0
                ? "Select a rating"
                : rating === 1
                ? "Poor"
                : rating === 2
                ? "Fair"
                : rating === 3
                ? "Good"
                : rating === 4
                ? "Very Good"
                : "Excellent"}
            </Text>

            <View style={styles.reviewSection}>
              <Text style={styles.reviewLabel}>Review (Optional)</Text>
              <TextInput
                style={styles.reviewInput}
                value={reviewText}
                onChangeText={setReviewText}
                placeholder="Share your experience..."
                placeholderTextColor={COLORS.darkGray}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowRatingModal(false);
                  setRating(0);
                  setReviewText("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.submitButton,
                  rating === 0 && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitRating}
                disabled={rating === 0 || isSubmittingRating}
              >
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 8,
    textAlign: "left",
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: "left",
    opacity: 0.9,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: COLORS.textGray,
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  requestCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.maroon,
  },
  cardHeaderText: {
    flex: 1,
  },
  companyName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 4,
  },
  requestType: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardBody: {
    marginBottom: 16,
    paddingLeft: 4,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textGray,
    marginLeft: 8,
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
    paddingTop: 12,
  },
  viewButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.maroon,
  },
  comingSoonCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: COLORS.textGray,
    fontStyle: "italic",
  },
  rateButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
    paddingVertical: 8,
  },
  rateButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.gold,
  },
  ratedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 12,
    paddingVertical: 8,
  },
  ratedText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.green,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: COLORS.textGray,
    marginBottom: 24,
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    textAlign: "center",
    marginBottom: 24,
  },
  reviewSection: {
    marginBottom: 24,
  },
  reviewLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 8,
  },
  reviewInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.gray,
    minHeight: 100,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.lightGray,
  },
  cancelButtonText: {
    color: COLORS.black,
    fontSize: 16,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: COLORS.maroon,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
