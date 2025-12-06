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
import { companyService } from "@/services/companyService";
import {
  requestService,
  AppraisalRequest,
  RequestStatus,
} from "@/services/requestService";
import { useAuthStore } from "@/stores/authStore";
import { LoadingSpinner } from "@/components/LoadingSpinner";

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
  blue: "#2196F3",
  orange: "#FF9800",
  red: "#F44336",
};

export default function CompanyRequestsScreen() {
  const { userData } = useAuthStore();
  const [company, setCompany] = useState<any>(null);
  const [requests, setRequests] = useState<AppraisalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<AppraisalRequest | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"accept" | "reject" | "upload" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadData = useCallback(async () => {
    if (!userData) return;
    setIsLoading(true);
    try {
      const companyData = await companyService.getCompanyByUserId(userData.uid);
      setCompany(companyData);

      if (companyData) {
        const companyRequests = await requestService.getCompanyRequests(
          companyData.id
        );
        setRequests(companyRequests);
      }
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const handleRequestAction = (request: AppraisalRequest, type: "accept" | "reject" | "upload") => {
    setSelectedRequest(request);
    setActionType(type);
    setShowActionModal(true);
  };

  const processAction = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      let newStatus: RequestStatus;

      if (actionType === "accept") {
        newStatus = "in_progress";
      } else if (actionType === "reject") {
        newStatus = "rejected";
      } else {
        // Upload report - mark as completed
        newStatus = "completed";
      }

      await requestService.updateRequestStatus(selectedRequest.id!, newStatus);
      Alert.alert(
        "Success",
        actionType === "accept"
          ? "Request accepted and moved to In Progress"
          : actionType === "reject"
          ? "Request rejected"
          : "Request marked as completed. Customer has been notified."
      );
      setShowActionModal(false);
      setSelectedRequest(null);
      loadData();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update request");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredRequests =
    filterStatus === "all"
      ? requests
      : requests.filter((r) => r.status === filterStatus);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <LoadingSpinner visible={isProcessing} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Appraisal Requests</Text>
        <Text style={styles.headerSubtitle}>
          Manage customer requests and upload reports
        </Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {["all", "pending", "in_progress", "completed"].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filterStatus === status && styles.filterChipActive,
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === status && styles.filterChipTextActive,
                ]}
              >
                {status === "all"
                  ? "All"
                  : status
                      .split("_")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ")}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.maroon} />
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons
            name="assignment"
            size={64}
            color={COLORS.darkGray}
          />
          <Text style={styles.emptyTitle}>No Requests Found</Text>
          <Text style={styles.emptySubtitle}>
            {filterStatus === "all"
              ? "You don't have any requests yet"
              : `No ${filterStatus.replace("_", " ")} requests`}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredRequests.map((request) => {
            const statusColor = getStatusColor(request.status);
            return (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: COLORS.lightGray },
                      ]}
                    >
                      <MaterialIcons
                        name={
                          request.type === "vehicle"
                            ? "directions-car"
                            : "home"
                        }
                        size={24}
                        color={COLORS.maroon}
                      />
                    </View>
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.requestType}>
                        {request.type === "vehicle"
                          ? "Car Valuation"
                          : "Property Valuation"}
                      </Text>
                      <Text style={styles.propertyType}>
                        {request.propertyType || "N/A"}
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
                  {request.description && (
                    <View style={styles.descriptionRow}>
                      <Text style={styles.descriptionText}>
                        {request.description}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Action Buttons */}
                <View style={styles.cardFooter}>
                  {request.status === "pending" || request.status === "under_review" ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.acceptButton]}
                        onPress={() => handleRequestAction(request, "accept")}
                      >
                        <MaterialIcons name="check" size={16} color={COLORS.white} />
                        <Text style={styles.actionButtonText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.rejectButton]}
                        onPress={() => handleRequestAction(request, "reject")}
                      >
                        <MaterialIcons name="close" size={16} color={COLORS.white} />
                        <Text style={styles.actionButtonText}>Reject</Text>
                      </TouchableOpacity>
                    </>
                  ) : request.status === "in_progress" ? (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.uploadButton]}
                      onPress={() => handleRequestAction(request, "upload")}
                    >
                      <MaterialIcons name="upload" size={16} color={COLORS.white} />
                      <Text style={styles.actionButtonText}>Complete Request</Text>
                    </TouchableOpacity>
                  ) : request.status === "completed" ? (
                    <View style={styles.completedBadge}>
                      <MaterialIcons name="check-circle" size={16} color={COLORS.green} />
                      <Text style={styles.completedText}>Completed</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {actionType === "accept"
                ? "Accept Request"
                : actionType === "reject"
                ? "Reject Request"
                : "Complete Request"}
            </Text>
            <Text style={styles.modalText}>
              {actionType === "accept"
                ? "Are you sure you want to accept this request and start the appraisal process?"
                : actionType === "reject"
                ? "Are you sure you want to reject this request?"
                : "Mark this appraisal request as completed. The customer will be notified and can download the report once PDF upload is implemented."}
            </Text>
            {actionType === "upload" && (
              <View style={styles.uploadPlaceholder}>
                <MaterialIcons name="check-circle" size={48} color={COLORS.green} />
                <Text style={styles.uploadText}>
                  Note: PDF report upload will be available soon. For now, this will mark the request as completed.
                </Text>
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowActionModal(false);
                  setSelectedRequest(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={processAction}
                disabled={isProcessing}
              >
                <Text style={styles.confirmButtonText}>
                  {actionType === "accept"
                    ? "Accept"
                    : actionType === "reject"
                    ? "Reject"
                    : "Mark as Completed"}
                </Text>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
  },
  filterContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  filterChipActive: {
    backgroundColor: COLORS.maroon,
    borderColor: COLORS.maroon,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.textGray,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
  requestType: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 4,
  },
  propertyType: {
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
  descriptionRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.textGray,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: COLORS.green,
  },
  rejectButton: {
    backgroundColor: COLORS.red,
  },
  uploadButton: {
    backgroundColor: COLORS.maroon,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  completedText: {
    color: COLORS.green,
    fontSize: 14,
    fontWeight: "600",
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.textGray,
    marginBottom: 20,
    lineHeight: 22,
  },
  uploadPlaceholder: {
    alignItems: "center",
    padding: 20,
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    marginBottom: 20,
  },
  uploadText: {
    fontSize: 14,
    color: COLORS.textGray,
    marginTop: 8,
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
  confirmButton: {
    backgroundColor: COLORS.maroon,
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});

