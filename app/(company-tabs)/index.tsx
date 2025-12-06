import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { companyService } from "@/services/companyService";
import { requestService, AppraisalRequest } from "@/services/requestService";
import { useAuthStore } from "@/stores/authStore";

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
  green: "#4CAF50",
  blue: "#2196F3",
  orange: "#FF9800",
  red: "#F44336",
};

export default function CompanyDashboardScreen() {
  const { userData } = useAuthStore();
  const [company, setCompany] = useState<any>(null);
  const [requests, setRequests] = useState<AppraisalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!userData) return;
    setIsLoading(true);
    try {
      // Load company data
      const companyData = await companyService.getCompanyByUserId(userData.uid);
      setCompany(companyData);

      if (companyData) {
        // Load company requests
        const companyRequests = await requestService.getCompanyRequests(
          companyData.id
        );
        setRequests(companyRequests);
      }
    } catch (error) {
      console.error("Error loading company dashboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStats = () => {
    const pending = requests.filter(
      (r) => r.status === "pending" || r.status === "under_review"
    ).length;
    const inProgress = requests.filter((r) => r.status === "in_progress").length;
    const completed = requests.filter((r) => r.status === "completed").length;
    return { pending, inProgress, completed };
  };

  const stats = getStats();

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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="business" size={32} color={COLORS.maroon} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              {company?.name || "Company Dashboard"}
            </Text>
            <Text style={styles.headerSubtitle}>
              Welcome, {userData?.fullName || "Company"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <MaterialIcons name="assignment" size={32} color={COLORS.blue} />
              <Text style={styles.statNumber}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending Requests</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="work" size={32} color={COLORS.orange} />
              <Text style={styles.statNumber}>{stats.inProgress}</Text>
              <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="check-circle" size={32} color={COLORS.green} />
              <Text style={styles.statNumber}>{stats.completed}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
          </View>
        </View>

        {/* Company Info */}
        {company && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Company Information</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MaterialIcons
                  name="location-on"
                  size={20}
                  color={COLORS.maroon}
                />
                <Text style={styles.infoText}>{company.location}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="phone" size={20} color={COLORS.maroon} />
                <Text style={styles.infoText}>{company.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="email" size={20} color={COLORS.maroon} />
                <Text style={styles.infoText}>{company.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons name="verified" size={20} color={COLORS.green} />
                <Text style={styles.infoText}>
                  License: {company.licenseNumber}
                </Text>
              </View>
              <View style={styles.servicesRow}>
                <Text style={styles.servicesLabel}>Services:</Text>
                {company.services.map((service: string, index: number) => (
                  <View key={index} style={styles.serviceTag}>
                    <Text style={styles.serviceTagText}>
                      {service === "property" ? "Property" : "Vehicle"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Recent Requests */}
        {requests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Requests</Text>
            {requests.slice(0, 3).map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <Text style={styles.requestType}>
                    {request.type === "vehicle" ? "Car" : "Property"} Valuation
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          request.status === "completed"
                            ? COLORS.green + "20"
                            : request.status === "in_progress"
                            ? COLORS.blue + "20"
                            : COLORS.orange + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color:
                            request.status === "completed"
                              ? COLORS.green
                              : request.status === "in_progress"
                              ? COLORS.blue
                              : COLORS.orange,
                        },
                      ]}
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
                <Text style={styles.requestLocation}>{request.location}</Text>
              </View>
            ))}
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
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
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
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.black,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textGray,
    textAlign: "center",
  },
  infoCard: {
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
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 12,
    flex: 1,
  },
  servicesRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  servicesLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginRight: 8,
  },
  serviceTag: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  serviceTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  requestType: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  requestLocation: {
    fontSize: 14,
    color: COLORS.textGray,
  },
});

