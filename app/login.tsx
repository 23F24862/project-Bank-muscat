import { LoadingSpinner } from "@/components/LoadingSpinner";
import { authService } from "@/services/authService";
import { useAuthStore } from "@/stores/authStore";
import { getHomeRoute } from "@/utils/navigation";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
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
  blue: "#2196F3",
};

/**
 * Converts Firebase error messages to user-friendly messages
 */
const getErrorMessage = (error: any): string => {
  const errorMessage = error?.message || error?.code || "";
  const errorCode = error?.code || "";

  // Firebase Auth error codes
  if (
    errorCode.includes("auth/invalid-email") ||
    errorMessage.includes("invalid-email")
  ) {
    return "Please enter a valid email address.";
  }
  if (
    errorCode.includes("auth/user-not-found") ||
    errorMessage.includes("user-not-found")
  ) {
    return "No account found with this email address. Please check your email or sign up for a new account.";
  }
  if (
    errorCode.includes("auth/wrong-password") ||
    errorMessage.includes("wrong-password")
  ) {
    return "Incorrect password. Please try again or use the 'Forgot Password' option if you've forgotten it.";
  }
  if (
    errorCode.includes("auth/invalid-credential") ||
    errorMessage.includes("invalid-credential")
  ) {
    return "Invalid email or password. Please check your credentials and try again.";
  }
  if (
    errorCode.includes("auth/email-already-in-use") ||
    errorMessage.includes("email-already-in-use")
  ) {
    return "This email address is already registered. Please use a different email or try logging in instead.";
  }
  if (
    errorCode.includes("auth/weak-password") ||
    errorMessage.includes("weak-password")
  ) {
    return "Password is too weak. Please use at least 6 characters with a mix of letters and numbers.";
  }
  if (
    errorCode.includes("auth/network-request-failed") ||
    errorMessage.includes("network")
  ) {
    return "Network connection failed. Please check your internet connection and try again.";
  }
  if (
    errorCode.includes("auth/too-many-requests") ||
    errorMessage.includes("too-many-requests")
  ) {
    return "Too many failed login attempts. Please wait a few minutes before trying again.";
  }
  if (
    errorCode.includes("auth/user-disabled") ||
    errorMessage.includes("user-disabled")
  ) {
    return "This account has been disabled. Please contact Bank Muscat support for assistance.";
  }
  if (
    errorCode.includes("auth/operation-not-allowed") ||
    errorMessage.includes("operation-not-allowed")
  ) {
    return "This operation is not allowed. Please contact support if you need assistance.";
  }

  // Generic fallback
  return errorMessage || "An unexpected error occurred. Please try again.";
};

export default function LoginScreen() {
  const router = useRouter();
  const { setUser, setUserData } = useAuthStore();
  const [activeTab, setActiveTab] = React.useState<"login" | "signup">("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [showLoginPassword, setShowLoginPassword] = React.useState(false);
  const [showSignupPassword, setShowSignupPassword] = React.useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleLogin = async () => {
    // Validate email format
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      Alert.alert(
        "Email Required",
        "Please enter your email address to continue."
      );
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address (e.g., yourname@example.com)."
      );
      return;
    }

    if (!password) {
      Alert.alert(
        "Password Required",
        "Please enter your password to continue."
      );
      return;
    }

    setIsLoading(true);
    try {
      const user = await authService.login(emailTrimmed, password);
      const userData = await authService.getUserData(user.uid);

      if (!userData) {
        Alert.alert(
          "Account Issue",
          "We couldn't find your account information. Please contact Bank Muscat support for assistance."
        );
        setIsLoading(false);
        return;
      }

      setUser(user);
      setUserData(userData);

      // Route based on user type
      const homeRoute = getHomeRoute(userData);
      router.replace(homeRoute as any);
    } catch (error: any) {
      const friendlyMessage = getErrorMessage(error);
      Alert.alert("Unable to Sign In", friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    // Validate full name
    const fullNameTrimmed = fullName.trim();
    if (!fullNameTrimmed) {
      Alert.alert(
        "Full Name Required",
        "Please enter your full name to create your account."
      );
      return;
    }

    if (fullNameTrimmed.length < 2) {
      Alert.alert(
        "Invalid Name",
        "Please enter your complete full name (at least 2 characters)."
      );
      return;
    }

    // Validate email format
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      Alert.alert(
        "Email Required",
        "Please enter your email address to create your account."
      );
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      Alert.alert(
        "Invalid Email",
        "Please enter a valid email address (e.g., yourname@example.com)."
      );
      return;
    }

    // Validate password
    if (!password) {
      Alert.alert(
        "Password Required",
        "Please create a password for your account."
      );
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Password Too Short",
        "Your password must be at least 6 characters long. Please choose a stronger password."
      );
      return;
    }

    setIsLoading(true);
    try {
      // Only customers can register themselves
      const user = await authService.register(
        emailTrimmed,
        password,
        fullNameTrimmed,
        "customer"
      );
      const userData = await authService.getUserData(user.uid);

      if (!userData) {
        Alert.alert(
          "Account Creation Issue",
          "Your account was created, but we couldn't set up your profile. Please try logging in, or contact support if the problem persists."
        );
        setIsLoading(false);
        return;
      }

      setUser(user);
      setUserData(userData);

      // Route based on user type
      const homeRoute = getHomeRoute(userData);
      router.replace(homeRoute as any);
    } catch (error: any) {
      const friendlyMessage = getErrorMessage(error);
      Alert.alert("Unable to Create Account", friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <LoadingSpinner visible={isLoading} />

      {/* Maroon Header Section */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.iconCircle}>
            <MaterialIcons
              name="account-balance"
              size={35}
              color={COLORS.maroon}
            />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Bank Muscat</Text>
            <Text style={styles.headerSubtitle}>Appraisal Services</Text>
          </View>
        </View>
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "login" && styles.activeTab]}
          onPress={() => setActiveTab("login")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "login" && styles.activeTabText,
            ]}
          >
            Login
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "signup" && styles.activeTab]}
          onPress={() => setActiveTab("signup")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "signup" && styles.activeTabText,
            ]}
          >
            Sign Up
          </Text>
        </TouchableOpacity>
      </View>

      {/* Form Section */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.formContainer}>
          {activeTab === "login" ? (
            <>
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeTitle}>Welcome Back</Text>
                <Text style={styles.welcomeSubtitle}>
                  Enter your credentials to access your account
                </Text>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={COLORS.darkGray}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password"
                    placeholderTextColor={COLORS.darkGray}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showLoginPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowLoginPassword(!showLoginPassword)}
                    disabled={isLoading}
                  >
                    <MaterialIcons
                      name={showLoginPassword ? "visibility" : "visibility-off"}
                      size={24}
                      color={COLORS.darkGray}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.welcomeSection}>
                <Text style={styles.welcomeTitle}>Create Customer Account</Text>
                <Text style={styles.welcomeSubtitle}>
                  Fill in your details to create a new customer account
                </Text>
              </View>

              <View style={styles.infoBox}>
                <MaterialIcons name="info" size={20} color={COLORS.blue} />
                <Text style={styles.infoText}>
                  Companies and Administrators: Please contact Bank Muscat
                  support to get your account credentials.
                </Text>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  placeholderTextColor={COLORS.darkGray}
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="your.email@example.com"
                  placeholderTextColor={COLORS.darkGray}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter your password (min. 6 characters)"
                    placeholderTextColor={COLORS.darkGray}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showSignupPassword}
                    autoCapitalize="none"
                    editable={!isLoading}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowSignupPassword(!showSignupPassword)}
                    disabled={isLoading}
                  >
                    <MaterialIcons
                      name={
                        showSignupPassword ? "visibility" : "visibility-off"
                      }
                      size={24}
                      color={COLORS.darkGray}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.loginButton,
                  isLoading && styles.loginButtonDisabled,
                ]}
                onPress={handleSignUp}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </>
          )}
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
    paddingBottom: 32,
    paddingHorizontal: 16,
    minHeight: 200,
    justifyContent: "flex-start",
  },
  backButton: {
    marginBottom: 24,
    padding: 4,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingTop: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
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
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
    gap: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.lightGray,
    borderRadius: 6,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  activeTab: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.gray,
  },
  tabText: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: "500",
  },
  activeTabText: {
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  welcomeSection: {
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: COLORS.textGray,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: COLORS.black,
    marginBottom: 8,
    fontWeight: "500",
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.black,
  },
  eyeButton: {
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButton: {
    backgroundColor: COLORS.maroon,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 16,
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
  loginButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.blue,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textGray,
    lineHeight: 18,
  },
});
