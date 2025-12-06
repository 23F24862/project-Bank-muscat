import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
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
  blue: "#2196F3",
  orange: "#FF9800",
};

export default function AdminReportsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
        <Text style={styles.headerSubtitle}>
          Performance, compliance, and usage statistics
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Coming Soon Cards */}
        <View style={styles.section}>
          <View style={styles.comingSoonCard}>
            <MaterialIcons
              name="bar-chart"
              size={64}
              color={COLORS.darkGray}
            />
            <Text style={styles.comingSoonTitle}>Performance Reports</Text>
            <Text style={styles.comingSoonText}>
              Generate detailed performance reports for companies, including
              completion rates, average processing times, and customer
              satisfaction metrics.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.comingSoonCard}>
            <MaterialIcons
              name="verified-user"
              size={64}
              color={COLORS.darkGray}
            />
            <Text style={styles.comingSoonTitle}>Compliance Reports</Text>
            <Text style={styles.comingSoonText}>
              Monitor compliance with bank policies, verify license validity,
              and track quality standards across all appraisal companies.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.comingSoonCard}>
            <MaterialIcons
              name="trending-up"
              size={64}
              color={COLORS.darkGray}
            />
            <Text style={styles.comingSoonTitle}>Usage Statistics</Text>
            <Text style={styles.comingSoonText}>
              View platform usage statistics, request trends, user growth, and
              system activity metrics.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.comingSoonCard}>
            <MaterialIcons
              name="download"
              size={64}
              color={COLORS.darkGray}
            />
            <Text style={styles.comingSoonTitle}>Export Reports</Text>
            <Text style={styles.comingSoonText}>
              Export reports in various formats (PDF, Excel, CSV) for
              documentation and analysis purposes.
            </Text>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={24} color={COLORS.blue} />
          <Text style={styles.infoText}>
            Report generation functionality is coming soon. You&apos;ll be able
            to generate comprehensive reports on performance, compliance, and
            usage statistics.
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  comingSoonCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.gray,
    borderStyle: "dashed",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.black,
    marginTop: 16,
    marginBottom: 12,
  },
  comingSoonText: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: "center",
    lineHeight: 22,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.blue,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textGray,
    lineHeight: 20,
  },
});

