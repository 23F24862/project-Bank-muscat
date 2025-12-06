import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { getHomeRoute } from "@/utils/navigation";
import SplashScreen from "./splash";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function Index() {
  const router = useRouter();
  const { user, userData, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (user && userData) {
        // User is logged in, route to appropriate home
        const homeRoute = getHomeRoute(userData);
        router.replace(homeRoute as any);
      }
      // If not logged in, show splash screen
    }
  }, [user, userData, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner visible={true} message="Loading..." />;
  }

  return <SplashScreen />;
}

