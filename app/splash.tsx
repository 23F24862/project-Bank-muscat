import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Colors from the design - matching the image
const COLORS = {
  darkRed: "#8d193c", // Maroon/dark red background
  gold: "#D4AF37", // Gold for icon and button
  white: "#FFFFFF",
  darkRedText: "#8d193c", // Dark red for button text
};

export default function SplashScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    // Navigate to the login screen
    router.push("/login" as any);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {/* Top section with icon, title, and description */}
        <View style={styles.topSection}>
          {/* Icon with gold background */}
          <View style={styles.iconWrapper}>
            <View style={styles.iconCircle}>
              <MaterialIcons
                name="account-balance"
                size={70}
                color={COLORS.darkRed}
              />
            </View>
          </View>

          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Bank Muscat</Text>
            <Text style={styles.subtitle}>Appraisal Services</Text>
          </View>

          {/* Description */}
          <Text style={styles.description}>
            Find and verify authorized appraisal companies for your home loans
            and car loans with confidence and ease.
          </Text>
        </View>

        {/* Bottom section with button and footer */}
        <View style={styles.bottomSection}>
          {/* Get Started Button */}
          <TouchableOpacity
            style={styles.button}
            onPress={handleGetStarted}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footer}>
            Trusted valuation services since 1982.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkRed,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  topSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  bottomSection: {
    width: "100%",
    alignItems: "center",
    paddingBottom: 20,
  },
  iconWrapper: {
    marginBottom: 32,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: COLORS.gold,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  titleContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.white,
    textAlign: "center",
  },
  description: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 16,
    maxWidth: 320,
  },
  button: {
    backgroundColor: COLORS.gold,
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    minWidth: 200,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.darkRedText,
  },
  footer: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: "center",
  },
});
