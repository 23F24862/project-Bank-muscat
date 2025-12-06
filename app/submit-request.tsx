import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { companyService, Company } from "@/services/companyService";
import { requestService, RequestType } from "@/services/requestService";
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
};

export default function SubmitRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const companyId = params.companyId as string;
  const { userData } = useAuthStore();

  const [company, setCompany] = useState<Company | null>(null);
  const [requestType, setRequestType] = useState<RequestType>("property");
  const [propertyType, setPropertyType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingCompany, setIsLoadingCompany] = useState(true);

  useEffect(() => {
    if (!userData) {
      Alert.alert("Login Required", "Please login to submit a request", [
        { text: "OK", onPress: () => router.push("/login" as any) },
      ]);
      return;
    }
    loadCompany();
  }, [companyId]);

  const loadCompany = async () => {
    if (!companyId) return;
    setIsLoadingCompany(true);
    try {
      const data = await companyService.getCompanyById(companyId);
      setCompany(data);
      if (data?.services.length === 1) {
        setRequestType(data.services[0] as RequestType);
      }
    } catch (error: any) {
      Alert.alert("Error", "Failed to load company details");
    } finally {
      setIsLoadingCompany(false);
    }
  };

  const handleSubmit = async () => {
    if (!userData || !company) return;

    if (!propertyType.trim() || !location.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      await requestService.createRequest({
        customerId: userData.uid,
        companyId: company.id,
        companyName: company.name,
        type: requestType,
        status: "pending",
        propertyType,
        location,
        description: description.trim() || undefined,
      });

      Alert.alert("Success", "Appraisal request submitted successfully", [
        {
          text: "OK",
          onPress: () => {
            router.push("/(tabs)/requests" as any);
          },
        },
      ]);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit request");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingCompany) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
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
        <Text style={styles.headerTitle}>Submit Appraisal Request</Text>
        <Text style={styles.headerSubtitle}>{company.name}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formCard}>
          <View style={styles.inputSection}>
            <Text style={styles.label}>Request Type *</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  requestType === "property" && styles.typeButtonActive,
                ]}
                onPress={() => setRequestType("property")}
                disabled={!company.services.includes("property")}
              >
                <MaterialIcons
                  name="home"
                  size={20}
                  color={
                    requestType === "property"
                      ? COLORS.white
                      : COLORS.textGray
                  }
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    requestType === "property" && styles.typeButtonTextActive,
                  ]}
                >
                  Property
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  requestType === "vehicle" && styles.typeButtonActive,
                ]}
                onPress={() => setRequestType("vehicle")}
                disabled={!company.services.includes("vehicle")}
              >
                <MaterialIcons
                  name="directions-car"
                  size={20}
                  color={
                    requestType === "vehicle"
                      ? COLORS.white
                      : COLORS.textGray
                  }
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    requestType === "vehicle" && styles.typeButtonTextActive,
                  ]}
                >
                  Vehicle
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>
              {requestType === "property" ? "Property Type" : "Vehicle Details"} *
            </Text>
            <TextInput
              style={styles.input}
              placeholder={
                requestType === "property"
                  ? "e.g., Villa, Apartment, Land"
                  : "e.g., Toyota Camry 2020"
              }
              placeholderTextColor={COLORS.darkGray}
              value={propertyType}
              onChangeText={setPropertyType}
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Muscat, Oman"
              placeholderTextColor={COLORS.darkGray}
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.label}>Additional Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add any additional details..."
              placeholderTextColor={COLORS.darkGray}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Document Upload Section - Coming Soon */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Supporting Documents</Text>
            <View style={styles.uploadCard}>
              <MaterialIcons
                name="cloud-upload"
                size={48}
                color={COLORS.darkGray}
              />
              <Text style={styles.uploadTitle}>Document Upload</Text>
              <Text style={styles.uploadText}>
                Upload property/vehicle documents, photos, and other supporting
                files. This feature is coming soon.
              </Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonBadgeText}>Coming Soon</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={styles.submitButtonText}>
            {isLoading ? "Submitting..." : "Submit Request"}
          </Text>
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
  loadingText: {
    fontSize: 16,
    color: COLORS.textGray,
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
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 8,
    fontWeight: "500",
  },
  typeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray,
    backgroundColor: COLORS.lightGray,
    gap: 8,
  },
  typeButtonActive: {
    backgroundColor: COLORS.maroon,
    borderColor: COLORS.maroon,
  },
  typeButtonText: {
    fontSize: 16,
    color: COLORS.textGray,
    fontWeight: "500",
  },
  typeButtonTextActive: {
    color: COLORS.white,
  },
  input: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
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
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  uploadCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: COLORS.gray,
    borderStyle: "dashed",
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginTop: 12,
    marginBottom: 8,
  },
  uploadText: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  comingSoonBadge: {
    backgroundColor: COLORS.gold,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  comingSoonBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
  },
});

