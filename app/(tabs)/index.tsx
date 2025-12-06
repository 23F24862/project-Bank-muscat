import { companyService } from "@/services/companyService";
import { AppraisalRequest, requestService } from "@/services/requestService";
import { useAuthStore } from "@/stores/authStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
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
};

export default function HomeScreen() {
  const router = useRouter();
  const { userData } = useAuthStore();
  const [vehicleCount, setVehicleCount] = useState(0);
  const [propertyCount, setPropertyCount] = useState(0);
  const [recentRequests, setRecentRequests] = useState<AppraisalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load company counts
      const vehicleCompanies = await companyService.getCompaniesByService(
        "vehicle"
      );
      const propertyCompanies = await companyService.getCompaniesByService(
        "property"
      );
      setVehicleCount(vehicleCompanies.length);
      setPropertyCount(propertyCompanies.length);

      // Load recent requests if user is logged in
      if (userData) {
        const requests = await requestService.getCustomerRequests(userData.uid);
        setRecentRequests(requests.slice(0, 3)); // Show only 3 most recent
      }
    } catch (error) {
      console.error("Error loading home data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCarValuation = () => {
    router.push("/companies?type=vehicle" as any);
  };

  const handleHomeValuation = () => {
    router.push("/companies?type=property" as any);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return COLORS.green;
      case "in_progress":
        return COLORS.blue;
      case "pending":
      case "under_review":
        return COLORS.orange || "#FF9800";
      default:
        return COLORS.blue;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />

      {/* Maroon Header Section */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Welcome Back!</Text>
        <Text style={styles.headerSubtitle}>
          Select a valuation service to get started
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Valuation Services Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Valuation Services</Text>

          {/* Car Valuation Card */}
          <TouchableOpacity
            style={styles.serviceCard}
            activeOpacity={0.7}
            onPress={handleCarValuation}
          >
            <View style={styles.cardContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: COLORS.lightPink },
                ]}
              >
                <MaterialIcons
                  name="directions-car"
                  size={32}
                  color={COLORS.maroon}
                />
              </View>
              <View style={styles.cardTextContainer}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Car Valuation</Text>
                  <View style={styles.tagContainer}>
                    <Text style={styles.tagText}>
                      {isLoading ? "..." : `${vehicleCount} Companies`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardSubtitle}>
                  Find authorized car appraisers
                </Text>
                <Text style={styles.cardDescription}>
                  Access verified appraisal companies for your car loan
                  requirements
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Home Valuation Card */}
          <TouchableOpacity
            style={styles.serviceCard}
            activeOpacity={0.7}
            onPress={handleHomeValuation}
          >
            <View style={styles.cardContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: COLORS.lightPink },
                ]}
              >
                <MaterialIcons name="home" size={32} color={COLORS.maroon} />
              </View>
              <View style={styles.cardTextContainer}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Home Valuation</Text>
                  <View style={styles.tagContainer}>
                    <Text style={styles.tagText}>
                      {isLoading ? "..." : `${propertyCount} Companies`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.cardSubtitle}>
                  Find authorized home appraisers
                </Text>
                <Text style={styles.cardDescription}>
                  Access verified appraisal companies for your home loan
                  requirements
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Recent Activity Section */}
        {userData && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              {recentRequests.length > 0 && (
                <TouchableOpacity
                  onPress={() => router.push("/(tabs)/requests" as any)}
                >
                  <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
              )}
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={COLORS.maroon} />
              </View>
            ) : recentRequests.length === 0 ? (
              <View style={styles.emptyActivityCard}>
                <MaterialIcons
                  name="assignment"
                  size={32}
                  color={COLORS.darkGray}
                />
                <Text style={styles.emptyActivityText}>No recent requests</Text>
                <Text style={styles.emptyActivitySubtext}>
                  Submit your first appraisal request to get started
                </Text>
              </View>
            ) : (
              recentRequests.map((request) => {
                const statusColor = getStatusColor(request.status);
                return (
                  <TouchableOpacity
                    key={request.id}
                    style={styles.activityCard}
                    onPress={() => router.push("/(tabs)/requests" as any)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.activityDot,
                        { backgroundColor: statusColor },
                      ]}
                    />
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>
                        {request.companyName}
                      </Text>
                      <Text style={styles.activitySubtitle}>
                        {request.type === "vehicle"
                          ? "Car Valuation"
                          : "Home Valuation"}{" "}
                        • {formatDate(request.createdAt)}
                      </Text>
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: statusColor + "20" },
                          ]}
                        >
                          <Text
                            style={[styles.statusText, { color: statusColor }]}
                          >
                            {request.status
                              .split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
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
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.maroon,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyActivityCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderStyle: "dashed",
  },
  emptyActivityText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyActivitySubtext: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: "center",
  },
  statusRow: {
    marginTop: 8,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  serviceCard: {
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
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    borderWidth: 1,
    borderColor: COLORS.maroon,
  },
  cardTextContainer: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    flex: 1,
  },
  tagContainer: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textGray,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 12,
    color: COLORS.darkGray,
    lineHeight: 18,
  },
  activityCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  activityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
    marginTop: 4,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  activitySubtitle: {
    fontSize: 14,
    color: COLORS.textGray,
  },
});
