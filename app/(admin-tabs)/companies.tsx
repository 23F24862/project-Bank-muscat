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
import { adminService } from "@/services/adminService";
import { companyService, Company } from "@/services/companyService";
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

export default function AdminCompaniesScreen() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "approved" | "pending">("all");
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "suspend" | "archive" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    licenseNumber: "",
    description: "",
    password: "",
    services: [] as string[],
  });

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllCompanies();
      setCompanies(data);
      setFilteredCompanies(data);
    } catch (error) {
      console.error("Error loading companies:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    filterCompanies();
  }, [searchQuery, companies, filterStatus]);

  const filterCompanies = () => {
    let filtered = [...companies];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(query) ||
          company.location.toLowerCase().includes(query) ||
          company.email.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus === "approved") {
      filtered = filtered.filter((c) => c.isApproved);
    } else if (filterStatus === "pending") {
      filtered = filtered.filter((c) => !c.isApproved);
    }

    setFilteredCompanies(filtered);
  };

  const handleAction = (company: Company, type: "approve" | "suspend" | "archive") => {
    setSelectedCompany(company);
    setActionType(type);
    setShowActionModal(true);
  };

  const processAction = async () => {
    if (!selectedCompany || !selectedCompany.id) return;

    setIsProcessing(true);
    try {
      if (actionType === "approve") {
        await adminService.updateCompanyStatus(selectedCompany.id, true);
        Alert.alert("Success", "Company approved successfully");
      } else if (actionType === "suspend") {
        await adminService.suspendCompany(selectedCompany.id);
        Alert.alert("Success", "Company suspended successfully");
      } else if (actionType === "archive") {
        await adminService.archiveCompany(selectedCompany.id);
        Alert.alert("Success", "Company archived successfully");
      }
      setShowActionModal(false);
      setSelectedCompany(null);
      loadCompanies();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update company");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateCompany = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert("Error", "Company name is required");
      return;
    }
    if (!formData.email.trim()) {
      Alert.alert("Error", "Email is required");
      return;
    }
    if (!formData.phone.trim()) {
      Alert.alert("Error", "Phone number is required");
      return;
    }
    if (!formData.location.trim()) {
      Alert.alert("Error", "Location is required");
      return;
    }
    if (!formData.licenseNumber.trim()) {
      Alert.alert("Error", "License number is required");
      return;
    }
    if (formData.services.length === 0) {
      Alert.alert("Error", "At least one service type must be selected");
      return;
    }
    if (!formData.password.trim() || formData.password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setIsCreating(true);
    try {
      await adminService.createCompany({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        location: formData.location.trim(),
        licenseNumber: formData.licenseNumber.trim(),
        description: formData.description.trim() || undefined,
        services: formData.services,
        password: formData.password,
      });
      Alert.alert("Success", "Company created successfully");
      setShowCreateModal(false);
      loadCompanies();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to create company");
    } finally {
      setIsCreating(false);
    }
  };

  const toggleService = (service: "property" | "vehicle") => {
    setFormData((prev) => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter((s) => s !== service)
        : [...prev.services, service],
    }));
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <LoadingSpinner visible={isProcessing} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Companies</Text>
        <Text style={styles.headerSubtitle}>
          Add, update, suspend or remove companies
        </Text>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color={COLORS.textGray}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search companies..."
          placeholderTextColor={COLORS.darkGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(["all", "approved", "pending"] as const).map((status) => (
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
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Add Company Button */}
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setFormData({
              name: "",
              email: "",
              phone: "",
              location: "",
              licenseNumber: "",
              description: "",
              password: "",
              services: [],
            });
            setShowCreateModal(true);
          }}
        >
          <MaterialIcons name="add" size={20} color={COLORS.white} />
          <Text style={styles.addButtonText}>Add Company</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.maroon} />
        </View>
      ) : filteredCompanies.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="business" size={64} color={COLORS.darkGray} />
          <Text style={styles.emptyTitle}>No Companies Found</Text>
          <Text style={styles.emptySubtitle}>
            {filterStatus === "all"
              ? "No companies in the system"
              : `No ${filterStatus} companies`}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredCompanies.map((company) => (
            <View key={company.id} style={styles.companyCard}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.iconContainer}>
                    <MaterialIcons
                      name="business"
                      size={24}
                      color={COLORS.maroon}
                    />
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.companyName}>{company.name}</Text>
                    <View style={styles.badgeRow}>
                      {company.isApproved ? (
                        <View style={[styles.badge, styles.approvedBadge]}>
                          <Text style={styles.badgeText}>Approved</Text>
                        </View>
                      ) : (
                        <View style={[styles.badge, styles.pendingBadge]}>
                          <Text style={styles.badgeText}>Pending</Text>
                        </View>
                      )}
                      <Text style={styles.licenseText}>
                        License: {company.licenseNumber}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="location-on"
                    size={16}
                    color={COLORS.textGray}
                  />
                  <Text style={styles.infoText}>{company.location}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="email" size={16} color={COLORS.textGray} />
                  <Text style={styles.infoText}>{company.email}</Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons name="phone" size={16} color={COLORS.textGray} />
                  <Text style={styles.infoText}>{company.phone}</Text>
                </View>
                <View style={styles.servicesRow}>
                  {company.services.map((service, index) => (
                    <View key={index} style={styles.serviceTag}>
                      <Text style={styles.serviceTagText}>
                        {service === "property" ? "Property" : "Vehicle"}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.cardFooter}>
                {!company.isApproved ? (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.approveButton]}
                    onPress={() => handleAction(company, "approve")}
                  >
                    <MaterialIcons name="check" size={16} color={COLORS.white} />
                    <Text style={styles.actionButtonText}>Approve</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.suspendButton]}
                      onPress={() => handleAction(company, "suspend")}
                    >
                      <MaterialIcons name="block" size={16} color={COLORS.white} />
                      <Text style={styles.actionButtonText}>Suspend</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.archiveButton]}
                      onPress={() => handleAction(company, "archive")}
                    >
                      <MaterialIcons name="archive" size={16} color={COLORS.white} />
                      <Text style={styles.actionButtonText}>Archive</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))}
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
              {actionType === "approve"
                ? "Approve Company"
                : actionType === "suspend"
                ? "Suspend Company"
                : "Archive Company"}
            </Text>
            <Text style={styles.modalText}>
              {actionType === "approve"
                ? `Are you sure you want to approve ${selectedCompany?.name}? This will make them visible to customers.`
                : actionType === "suspend"
                ? `Are you sure you want to suspend ${selectedCompany?.name}? They will not be able to receive new requests.`
                : `Are you sure you want to archive ${selectedCompany?.name}? This will remove them from active listings.`}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowActionModal(false);
                  setSelectedCompany(null);
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
                  {actionType === "approve"
                    ? "Approve"
                    : actionType === "suspend"
                    ? "Suspend"
                    : "Archive"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Company Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            contentContainerStyle={styles.createModalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.createModalHeader}>
              <Text style={styles.modalTitle}>Add New Company</Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color={COLORS.textGray} />
              </TouchableOpacity>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Company Name *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                placeholder="Enter company name"
                placeholderTextColor={COLORS.darkGray}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Email *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="Enter email address"
                placeholderTextColor={COLORS.darkGray}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Phone *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                placeholder="Enter phone number"
                placeholderTextColor={COLORS.darkGray}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Location *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                placeholder="Enter location"
                placeholderTextColor={COLORS.darkGray}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>License Number *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.licenseNumber}
                onChangeText={(text) =>
                  setFormData({ ...formData, licenseNumber: text })
                }
                placeholder="Enter license number"
                placeholderTextColor={COLORS.darkGray}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Services *</Text>
              <View style={styles.servicesContainer}>
                <TouchableOpacity
                  style={[
                    styles.serviceChip,
                    formData.services.includes("property") && styles.serviceChipActive,
                  ]}
                  onPress={() => toggleService("property")}
                >
                  <Text
                    style={[
                      styles.serviceChipText,
                      formData.services.includes("property") &&
                        styles.serviceChipTextActive,
                    ]}
                  >
                    Property
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.serviceChip,
                    formData.services.includes("vehicle") && styles.serviceChipActive,
                  ]}
                  onPress={() => toggleService("vehicle")}
                >
                  <Text
                    style={[
                      styles.serviceChipText,
                      formData.services.includes("vehicle") &&
                        styles.serviceChipTextActive,
                    ]}
                  >
                    Vehicle
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.textArea]}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                placeholder="Enter company description (optional)"
                placeholderTextColor={COLORS.darkGray}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Password *</Text>
              <TextInput
                style={styles.formInput}
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                placeholder="Enter password (min 6 characters)"
                placeholderTextColor={COLORS.darkGray}
                secureTextEntry
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCreateCompany}
                disabled={isCreating}
              >
                <Text style={styles.confirmButtonText}>
                  {isCreating ? "Creating..." : "Create Company"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
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
  addButtonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  addButton: {
    backgroundColor: COLORS.maroon,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
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
  companyCard: {
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
    marginBottom: 16,
  },
  cardHeaderLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: COLORS.lightGray,
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
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvedBadge: {
    backgroundColor: COLORS.green + "20",
  },
  pendingBadge: {
    backgroundColor: COLORS.orange + "20",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.green,
  },
  licenseText: {
    fontSize: 12,
    color: COLORS.textGray,
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
  servicesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 8,
  },
  serviceTag: {
    backgroundColor: COLORS.maroon,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
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
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: COLORS.green,
  },
  suspendButton: {
    backgroundColor: COLORS.orange,
  },
  archiveButton: {
    backgroundColor: COLORS.red,
  },
  actionButtonText: {
    color: COLORS.white,
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
  createModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    maxHeight: "90%",
  },
  createModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  closeButton: {
    padding: 4,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.black,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  servicesContainer: {
    flexDirection: "row",
    gap: 12,
  },
  serviceChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  serviceChipActive: {
    backgroundColor: COLORS.maroon,
    borderColor: COLORS.maroon,
  },
  serviceChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textGray,
  },
  serviceChipTextActive: {
    color: COLORS.white,
  },
});

