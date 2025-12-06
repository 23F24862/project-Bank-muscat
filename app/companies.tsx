import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
};

export default function CompaniesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const serviceType = (params.type as "property" | "vehicle") || undefined;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("all");
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<"name" | "rating" | "reviews">("name");

  useEffect(() => {
    loadCompanies();
  }, [serviceType]);

  useEffect(() => {
    filterCompanies();
  }, [searchQuery, companies, selectedLocation, minRating, sortBy]);

  const loadCompanies = async () => {
    setIsLoading(true);
    try {
      let data: Company[];
      if (serviceType) {
        data = await companyService.getCompaniesByService(serviceType);
      } else {
        data = await companyService.getApprovedCompanies();
      }
      setCompanies(data);
      setFilteredCompanies(data);
    } catch (error: any) {
      console.error("Error loading companies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterCompanies = () => {
    let filtered = [...companies];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (company) =>
          company.name.toLowerCase().includes(query) ||
          company.location.toLowerCase().includes(query)
      );
    }

    // Location filter
    if (selectedLocation !== "all") {
      filtered = filtered.filter((company) =>
        company.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter((company) => company.rating >= minRating);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "reviews":
          return b.totalRatings - a.totalRatings;
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    setFilteredCompanies(filtered);
  };

  const getUniqueLocations = () => {
    const locations = new Set<string>();
    companies.forEach((company) => {
      const locationParts = company.location.split(",");
      if (locationParts.length > 0) {
        locations.add(locationParts[0].trim());
      }
    });
    return Array.from(locations).sort();
  };

  const handleCompanyPress = (companyId: string) => {
    router.push(`/company/${companyId}` as any);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <MaterialIcons key={i} name="star" size={16} color={COLORS.gold} />
      );
    }
    if (hasHalfStar) {
      stars.push(
        <MaterialIcons
          key="half"
          name="star-half"
          size={16}
          color={COLORS.gold}
        />
      );
    }
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <MaterialIcons
          key={`empty-${i}`}
          name="star-border"
          size={16}
          color={COLORS.gold}
        />
      );
    }
    return stars;
  };

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
        <Text style={styles.headerTitle}>
          {serviceType === "vehicle"
            ? "Car Valuation Companies"
            : serviceType === "property"
            ? "Home Valuation Companies"
            : "Appraisal Companies"}
        </Text>
        <Text style={styles.headerSubtitle}>
          Select a company to view details
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color={COLORS.textGray}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or location..."
          placeholderTextColor={COLORS.darkGray}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={styles.filterButton}
        >
          <MaterialIcons
            name={showFilters ? "filter-list" : "tune"}
            size={20}
            color={showFilters ? COLORS.maroon : COLORS.textGray}
          />
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Location</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterOptions}
            >
              <TouchableOpacity
                style={[
                  styles.filterChip,
                  selectedLocation === "all" && styles.filterChipActive,
                ]}
                onPress={() => setSelectedLocation("all")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedLocation === "all" &&
                      styles.filterChipTextActive,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {getUniqueLocations().map((location) => (
                <TouchableOpacity
                  key={location}
                  style={[
                    styles.filterChip,
                    selectedLocation === location &&
                      styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedLocation(location)}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedLocation === location &&
                        styles.filterChipTextActive,
                    ]}
                  >
                    {location}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Minimum Rating</Text>
            <View style={styles.ratingFilter}>
              {[0, 3, 4, 4.5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingChip,
                    minRating === rating && styles.ratingChipActive,
                  ]}
                  onPress={() => setMinRating(rating)}
                >
                  <Text
                    style={[
                      styles.ratingChipText,
                      minRating === rating && styles.ratingChipTextActive,
                    ]}
                  >
                    {rating === 0 ? "All" : `${rating}+ ⭐`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.sortOptions}>
              {[
                { key: "name", label: "Name" },
                { key: "rating", label: "Rating" },
                { key: "reviews", label: "Reviews" },
              ].map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.sortChip,
                    sortBy === option.key && styles.sortChipActive,
                  ]}
                  onPress={() => setSortBy(option.key as any)}
                >
                  <Text
                    style={[
                      styles.sortChipText,
                      sortBy === option.key && styles.sortChipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.maroon} />
        </View>
      ) : filteredCompanies.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons
            name="business"
            size={64}
            color={COLORS.darkGray}
          />
          <Text style={styles.emptyText}>No companies found</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredCompanies.map((company) => (
            <TouchableOpacity
              key={company.id}
              style={styles.companyCard}
              activeOpacity={0.7}
              onPress={() => handleCompanyPress(company.id)}
            >
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
                    <View style={styles.ratingContainer}>
                      {renderStars(company.rating)}
                      <Text style={styles.ratingText}>
                        {company.rating.toFixed(1)} ({company.totalRatings})
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
                  <MaterialIcons
                    name="phone"
                    size={16}
                    color={COLORS.textGray}
                  />
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
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: COLORS.textGray,
    marginTop: 16,
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
    marginBottom: 12,
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
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.textGray,
    marginLeft: 4,
  },
  cardBody: {
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
    backgroundColor: COLORS.gold,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceTagText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.white,
  },
  filterButton: {
    padding: 8,
    marginLeft: 8,
  },
  filtersPanel: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    marginRight: 8,
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
  ratingFilter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  ratingChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  ratingChipActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.gold,
  },
  ratingChipText: {
    fontSize: 14,
    color: COLORS.textGray,
    fontWeight: "500",
  },
  ratingChipTextActive: {
    color: COLORS.white,
  },
  sortOptions: {
    flexDirection: "row",
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    borderWidth: 1,
    borderColor: COLORS.gray,
  },
  sortChipActive: {
    backgroundColor: COLORS.maroon,
    borderColor: COLORS.maroon,
  },
  sortChipText: {
    fontSize: 14,
    color: COLORS.textGray,
    fontWeight: "500",
  },
  sortChipTextActive: {
    color: COLORS.white,
  },
});

