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
import { adminService } from "@/services/adminService";
import { useAuthStore } from "@/stores/authStore";

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

export default function AdminDashboardScreen() {
  const { userData } = useAuthStore();
  const [stats, setStats] = useState({
    totalCompanies: 0,
    approvedCompanies: 0,
    totalUsers: 0,
    totalRequests: 0,
    pendingRequests: 0,
    completedRequests: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      const [companies, users, requests] = await Promise.all([
        adminService.getAllCompanies(),
        adminService.getAllUsers(),
        adminService.getAllRequests(),
      ]);

      const approvedCompanies = companies.filter((c) => c.isApproved).length;
      const pendingRequests = requests.filter(
        (r) => r.status === "pending" || r.status === "under_review"
      ).length;
      const completedRequests = requests.filter(
        (r) => r.status === "completed"
      ).length;

      setStats({
        totalCompanies: companies.length,
        approvedCompanies,
        totalUsers: users.length,
        totalRequests: requests.length,
        pendingRequests,
        completedRequests,
      });
    } catch (error) {
      console.error("Error loading admin stats:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

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

      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconCircle}>
            <MaterialIcons
              name="admin-panel-settings"
              size={32}
              color={COLORS.maroon}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Admin Dashboard</Text>
            <Text style={styles.headerSubtitle}>
              Welcome, {userData?.fullName || "Administrator"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* System Overview Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <MaterialIcons name="business" size={32} color={COLORS.blue} />
              <Text style={styles.statNumber}>{stats.totalCompanies}</Text>
              <Text style={styles.statLabel}>Total Companies</Text>
              <Text style={styles.statSubtext}>
                {stats.approvedCompanies} approved
              </Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="people" size={32} color={COLORS.green} />
              <Text style={styles.statNumber}>{stats.totalUsers}</Text>
              <Text style={styles.statLabel}>Total Users</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="assignment" size={32} color={COLORS.orange} />
              <Text style={styles.statNumber}>{stats.totalRequests}</Text>
              <Text style={styles.statLabel}>Total Requests</Text>
              <Text style={styles.statSubtext}>
                {stats.completedRequests} completed
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Summary</Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <MaterialIcons name="pending" size={24} color={COLORS.orange} />
                <Text style={styles.summaryTitle}>Pending Requests</Text>
              </View>
              <Text style={styles.summaryNumber}>{stats.pendingRequests}</Text>
              <Text style={styles.summaryText}>
                Requests awaiting company response
              </Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.summaryHeader}>
                <MaterialIcons name="check-circle" size={24} color={COLORS.green} />
                <Text style={styles.summaryTitle}>Completed</Text>
              </View>
              <Text style={styles.summaryNumber}>
                {stats.completedRequests}
              </Text>
              <Text style={styles.summaryText}>Successfully completed appraisals</Text>
            </View>
          </View>
        </View>

        {/* Management Quick Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <View style={styles.quickActionCard}>
              <MaterialIcons
                name="business-center"
                size={32}
                color={COLORS.maroon}
              />
              <Text style={styles.quickActionText}>Manage Companies</Text>
            </View>
            <View style={styles.quickActionCard}>
              <MaterialIcons name="people" size={32} color={COLORS.maroon} />
              <Text style={styles.quickActionText}>Manage Users</Text>
            </View>
            <View style={styles.quickActionCard}>
              <MaterialIcons name="assessment" size={32} color={COLORS.maroon} />
              <Text style={styles.quickActionText}>Monitor Requests</Text>
            </View>
            <View style={styles.quickActionCard}>
              <MaterialIcons name="bar-chart" size={32} color={COLORS.maroon} />
              <Text style={styles.quickActionText}>View Reports</Text>
            </View>
          </View>
        </View>
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
    fontWeight: "500",
  },
  statSubtext: {
    fontSize: 10,
    color: COLORS.darkGray,
    marginTop: 4,
    textAlign: "center",
  },
  summaryContainer: {
    gap: 12,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
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
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 4,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickActionCard: {
    width: "47%",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
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
  quickActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    marginTop: 12,
    textAlign: "center",
  },
});

