import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { adminService } from "@/services/adminService";
import { AppraisalRequest } from "@/services/requestService";
import { Timestamp } from "firebase/firestore";

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

export default function AdminRequestsScreen() {
  const [requests, setRequests] = useState<AppraisalRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AppraisalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const loadRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllRequests();
      setRequests(data);
      setFilteredRequests(data);
    } catch (error) {
      console.error("Error loading requests:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    filterRequests();
  }, [searchQuery, requests, filterStatus]);

  const filterRequests = () => {
    let filtered = [...requests];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (request) =>
          request.companyName.toLowerCase().includes(query) ||
          request.location.toLowerCase().includes(query) ||
          (request.propertyType && request.propertyType.toLowerCase().includes(query))
      );
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    setFilteredRequests(filtered);
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
      const dateObj =
        date instanceof Timestamp
          ? date.toDate()
          : date.toDate
          ? date.toDate()
          : new Date(date);
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

  const uniqueStatuses = Array.from(
    new Set(requests.map((r) => r.status))
  ).sort();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Monitor Requests</Text>
        <Text style={styles.headerSubtitle}>
          Track all appraisal activity across the platform
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color={COLORS.textGray}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by company, location..."
          placeholderTextColor={COLORS.darkGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              filterStatus === "all" && styles.filterChipActive,
            ]}
            onPress={() => setFilterStatus("all")}
          >
            <Text
              style={[
                styles.filterChipText,
                filterStatus === "all" && styles.filterChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {uniqueStatuses.map((status) => (
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
                {getStatusLabel(status)}
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
          <MaterialIcons name="assignment" size={64} color={COLORS.darkGray} />
          <Text style={styles.emptyTitle}>No Requests Found</Text>
          <Text style={styles.emptySubtitle}>
            {filterStatus === "all"
              ? "No requests in the system"
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
                      <Text style={styles.companyName}>
                        {request.companyName}
                      </Text>
                      <Text style={styles.requestType}>
                        {request.type === "vehicle"
                          ? "Car Valuation"
                          : "Property Valuation"}
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
                  {request.description && (
                    <View style={styles.descriptionRow}>
                      <Text style={styles.descriptionText}>
                        {request.description}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.black,
  },
  filterContainer: {
    paddingVertical: 12,
    paddingHorizontal: 20,
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
});

