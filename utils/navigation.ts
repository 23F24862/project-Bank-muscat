import { UserData } from "@/services/authService";

export const getHomeRoute = (userData: UserData | null): string => {
  if (!userData) {
    return "/login";
  }

  switch (userData.role) {
    case "customer":
      return "/(tabs)";
    case "company":
      return "/(company-tabs)";
    case "admin":
      return "/(admin-tabs)";
    default:
      return "/login";
  }
};
