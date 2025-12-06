import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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
  const router = useRouter();
  const { userData } = useAuthStore();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />

      {/* Header */}
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
        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Overview</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <MaterialIcons name="business" size={32} color={COLORS.blue} />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Companies</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="people" size={32} color={COLORS.green} />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="assignment" size={32} color={COLORS.orange} />
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Requests</Text>
            </View>
          </View>
        </View>

        {/* Management Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>

          <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.lightGray }]}>
              <MaterialIcons name="business-center" size={24} color={COLORS.maroon} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Companies</Text>
              <Text style={styles.actionSubtitle}>
                Add, update, suspend or remove companies
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.textGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.lightGray }]}>
              <MaterialIcons name="people" size={24} color={COLORS.maroon} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Manage Users</Text>
              <Text style={styles.actionSubtitle}>
                View and manage all user accounts
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.textGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.lightGray }]}>
              <MaterialIcons name="assessment" size={24} color={COLORS.maroon} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Monitor Requests</Text>
              <Text style={styles.actionSubtitle}>
                Track all appraisal activity
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.textGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.lightGray }]}>
              <MaterialIcons name="bar-chart" size={24} color={COLORS.maroon} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Generate Reports</Text>
              <Text style={styles.actionSubtitle}>
                Performance and compliance statistics
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.textGray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
            <View style={[styles.actionIconContainer, { backgroundColor: COLORS.lightGray }]}>
              <MaterialIcons name="notifications" size={24} color={COLORS.maroon} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>System Communication</Text>
              <Text style={styles.actionSubtitle}>
                Send alerts and policy updates
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color={COLORS.textGray} />
          </TouchableOpacity>
        </View>

        {/* Info Message */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color={COLORS.blue} />
          <Text style={styles.infoText}>
            Admin dashboard features will be available soon. You can manage
            companies, users, monitor requests, and generate reports.
          </Text>
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
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textGray,
    lineHeight: 20,
  },
});

