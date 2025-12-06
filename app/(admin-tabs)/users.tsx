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
import { UserData } from "@/services/authService";
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

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "customer" | "company" | "admin">("all");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState<"disable" | "changeRole" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newRole, setNewRole] = useState<"customer" | "company" | "admin">("customer");

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAllUsers();
      setUsers(data);
      setFilteredUsers(data);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, users, filterRole]);

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.fullName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (filterRole !== "all") {
      filtered = filtered.filter((u) => u.role === filterRole);
    }

    setFilteredUsers(filtered);
  };

  const handleAction = (user: UserData, type: "disable" | "changeRole") => {
    setSelectedUser(user);
    setActionType(type);
    setNewRole(user.role);
    setShowActionModal(true);
  };

  const processAction = async () => {
    if (!selectedUser || !selectedUser.uid) return;

    setIsProcessing(true);
    try {
      if (actionType === "disable") {
        await adminService.disableUser(selectedUser.uid);
        Alert.alert("Success", "User disabled successfully");
      } else if (actionType === "changeRole") {
        await adminService.updateUserRole(selectedUser.uid, newRole);
        Alert.alert("Success", "User role updated successfully");
      }
      setShowActionModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update user");
    } finally {
      setIsProcessing(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return COLORS.maroon;
      case "company":
        return COLORS.blue;
      case "customer":
        return COLORS.green;
      default:
        return COLORS.textGray;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return "admin-panel-settings";
      case "company":
        return "business";
      case "customer":
        return "person";
      default:
        return "person";
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <LoadingSpinner visible={isProcessing} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Manage Users</Text>
        <Text style={styles.headerSubtitle}>
          View and manage all user accounts
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
          placeholder="Search users..."
          placeholderTextColor={COLORS.darkGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(["all", "customer", "company", "admin"] as const).map((role) => (
          <TouchableOpacity
            key={role}
            style={[
              styles.filterChip,
              filterRole === role && styles.filterChipActive,
            ]}
            onPress={() => setFilterRole(role)}
          >
            <Text
              style={[
                styles.filterChipText,
                filterRole === role && styles.filterChipTextActive,
              ]}
            >
              {role === "all"
                ? "All"
                : role.charAt(0).toUpperCase() + role.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.maroon} />
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="people" size={64} color={COLORS.darkGray} />
          <Text style={styles.emptyTitle}>No Users Found</Text>
          <Text style={styles.emptySubtitle}>
            {filterRole === "all"
              ? "No users in the system"
              : `No ${filterRole} users`}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredUsers.map((user) => {
            const roleColor = getRoleColor(user.role);
            return (
              <View key={user.uid} style={styles.userCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View
                      style={[
                        styles.iconContainer,
                        { backgroundColor: roleColor + "20" },
                      ]}
                    >
                      <MaterialIcons
                        name={getRoleIcon(user.role) as any}
                        size={24}
                        color={roleColor}
                      />
                    </View>
                    <View style={styles.cardHeaderText}>
                      <Text style={styles.userName}>{user.fullName}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.roleBadge,
                      { backgroundColor: roleColor + "20" },
                    ]}
                  >
                    <Text style={[styles.roleText, { color: roleColor }]}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardBody}>
                  {user.phone && (
                    <View style={styles.infoRow}>
                      <MaterialIcons
                        name="phone"
                        size={16}
                        color={COLORS.textGray}
                      />
                      <Text style={styles.infoText}>{user.phone}</Text>
                    </View>
                  )}
                  {user.createdAt && (
                    <View style={styles.infoRow}>
                      <MaterialIcons
                        name="calendar-today"
                        size={16}
                        color={COLORS.textGray}
                      />
                      <Text style={styles.infoText}>
                        Joined: {new Date(user.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardFooter}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.roleButton]}
                    onPress={() => handleAction(user, "changeRole")}
                  >
                    <MaterialIcons name="edit" size={16} color={COLORS.white} />
                    <Text style={styles.actionButtonText}>Change Role</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.disableButton]}
                    onPress={() => handleAction(user, "disable")}
                  >
                    <MaterialIcons name="block" size={16} color={COLORS.white} />
                    <Text style={styles.actionButtonText}>Disable</Text>
                  </TouchableOpacity>
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
              {actionType === "disable"
                ? "Disable User"
                : "Change User Role"}
            </Text>
            <Text style={styles.modalText}>
              {actionType === "disable"
                ? `Are you sure you want to disable ${selectedUser?.fullName}? They will not be able to access the system.`
                : `Change role for ${selectedUser?.fullName}:`}
            </Text>
            {actionType === "changeRole" && (
              <View style={styles.roleSelector}>
                {(["customer", "company", "admin"] as const).map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.roleOption,
                      newRole === role && styles.roleOptionActive,
                    ]}
                    onPress={() => setNewRole(role)}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        newRole === role && styles.roleOptionTextActive,
                      ]}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowActionModal(false);
                  setSelectedUser(null);
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
                  {actionType === "disable" ? "Disable" : "Update Role"}
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
  userCard: {
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
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  roleText: {
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
  roleButton: {
    backgroundColor: COLORS.blue,
  },
  disableButton: {
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
  roleSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray,
    backgroundColor: COLORS.lightGray,
    alignItems: "center",
  },
  roleOptionActive: {
    backgroundColor: COLORS.maroon,
    borderColor: COLORS.maroon,
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textGray,
  },
  roleOptionTextActive: {
    color: COLORS.white,
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

