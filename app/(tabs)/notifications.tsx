import {
  Notification,
  notificationService,
} from "@/services/notificationService";
import { useAuthStore } from "@/stores/authStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { StatusBar } from "expo-status-bar";
import { Timestamp } from "firebase/firestore";
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
  green: "#4CAF50",
  blue: "#2196F3",
  yellow: "#FFC107",
  orange: "#FF9800",
  red: "#F44336",
};

export default function NotificationsScreen() {
  const { userData } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = useCallback(async () => {
    if (!userData) return;
    setIsLoading(true);
    try {
      const data = await notificationService.getUserNotifications(
        userData.uid,
        userData.role
      );
      setNotifications(data);

      const count = await notificationService.getUnreadCount(
        userData.uid,
        userData.role
      );
      setUnreadCount(count);
    } catch (error) {
      console.error("Error loading notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userData]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      loadNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!userData) return;
    try {
      await notificationService.markAllAsRead(userData.uid, userData.role);
      loadNotifications();
    } catch (error) {
      console.error("Error marking all as read:", error);
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
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      const diffMinutes = Math.ceil(diffTime / (1000 * 60));

      if (diffMinutes < 1) return "Just now";
      if (diffMinutes < 60)
        return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
      if (diffHours < 24)
        return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30)
        return `${Math.floor(diffDays / 7)} week${
          Math.floor(diffDays / 7) > 1 ? "s" : ""
        } ago`;
      return `${Math.floor(diffDays / 30)} month${
        Math.floor(diffDays / 30) > 1 ? "s" : ""
      } ago`;
    } catch {
      return "N/A";
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "request_completed":
      case "account_verified":
        return "check-circle";
      case "request_submitted":
      case "request_in_progress":
        return "access-time";
      case "document_required":
        return "warning";
      case "request_rejected":
        return "cancel";
      case "report_uploaded":
        return "upload-file";
      default:
        return "info";
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "request_completed":
      case "account_verified":
        return COLORS.green;
      case "request_submitted":
      case "request_in_progress":
        return COLORS.blue;
      case "document_required":
        return COLORS.yellow;
      case "request_rejected":
        return COLORS.red;
      case "report_uploaded":
        return COLORS.orange;
      default:
        return COLORS.blue;
    }
  };
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />

      {/* Maroon Header Section */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              Stay updated with your appraisal activities
            </Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.maroon} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons
                name="notifications-none"
                size={64}
                color={COLORS.darkGray}
              />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptySubtitle}>
                You&apos;re all caught up! New notifications will appear here.
              </Text>
            </View>
          ) : (
            notifications.map((notification) => {
              const iconName = getNotificationIcon(notification.type);
              const iconColor = getNotificationColor(notification.type);
              return (
                <TouchableOpacity
                  key={notification.id}
                  style={[
                    styles.notificationCard,
                    !notification.isRead && styles.unreadCard,
                  ]}
                  onPress={() => {
                    if (!notification.isRead && notification.id) {
                      handleMarkAsRead(notification.id);
                    }
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardContent}>
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: iconColor },
                      ]}
                    >
                      <MaterialIcons
                        name={iconName as any}
                        size={24}
                        color={COLORS.white}
                      />
                    </View>
                    <View style={styles.textContainer}>
                      <View style={styles.titleRow}>
                        <Text style={styles.notificationTitle}>
                          {notification.title}
                        </Text>
                        {!notification.isRead && (
                          <View style={styles.newBadge}>
                            <Text style={styles.newBadgeText}>New</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.notificationBody}>
                        {notification.body}
                      </Text>
                      <Text style={styles.timestamp}>
                        {formatDate(notification.createdAt)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  header: {
    backgroundColor: COLORS.maroon,
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  markAllButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  markAllText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "600",
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
    padding: 16,
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
  notificationCard: {
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
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.maroon,
    backgroundColor: COLORS.lightGray,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    flexWrap: "wrap",
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.black,
    marginRight: 8,
  },
  newBadge: {
    backgroundColor: COLORS.yellow,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  newBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.black,
  },
  notificationBody: {
    fontSize: 14,
    color: COLORS.textGray,
    lineHeight: 20,
    marginBottom: 6,
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
});
