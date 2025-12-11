import * as Location from "expo-location";
import { collection, onSnapshot } from "firebase/firestore";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import MapView, {
  Callout,
  Marker,
  PROVIDER_GOOGLE,
  Region,
} from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import ScreenContainer from "@/components/ScreenContainer";
import { Ionicons } from "@expo/vector-icons";
import { db } from "@/firebase/config";
import { configureMobileAds } from "@/services/ads";
import { trackEvent } from "@/services/analytics";
import { Colors } from "@/theme";
import { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";

/* ---------------------------------------------------------
   BUSINESS TYPE
---------------------------------------------------------- */

type Business = {
  id: string;
  name: string;
  owner?: string;
  description?: string;
  category?: string;
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
  latitude: number;
  longitude: number;
  isCommunitySeller?: boolean;
};

/* ---------------------------------------------------------
   FINAL 6 CATEGORIES
---------------------------------------------------------- */

const CATEGORY_OPTIONS = [
  "All Categories",
  "Cultural Goods & Handmade Items",
  "Traditional Foods, Crafts & Firewood",
  "Restaurants, Food Carts & Coffee",
  "Professional Services",
  "Business Storefronts & Retail",
  "Tribal Enterprises",
] as const;

/* ---------------------------------------------------------
   FINAL CATEGORY COLORS (high-contrast)
---------------------------------------------------------- */

const categoryColors: Record<string, string> = {
  "Cultural Goods & Handmade Items": Colors.palette.mapPins.cat1, // red
  "Traditional Foods, Crafts & Firewood": Colors.palette.mapPins.cat4, // orange
  "Restaurants, Food Carts & Coffee": Colors.palette.mapPins.cat3, // green
  "Professional Services": Colors.palette.mapPins.cat5, // purple
  "Business Storefronts & Retail": Colors.palette.mapPins.cat2, // blue
  "Tribal Enterprises": Colors.palette.mapPins.cat6, // yellow
};

const normalizeCategory = (cat?: string) => (cat ?? "").trim();
const formatPhone = (value?: string) => {
  if (!value) return "";
  const digits = (value.match(/\d+/g) || []).join("");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value;
};

/* ---------------------------------------------------------
   LAYOUT CONSTANTS
---------------------------------------------------------- */

const OREGON_REGION: Region = {
  latitude: 44.0,
  longitude: -120.5,
  latitudeDelta: 3,
  longitudeDelta: 3,
};

const isUserInOregon = (lat: number, lng: number) =>
  lat >= 41.991 &&
  lat <= 46.299 &&
  lng >= -124.703 &&
  lng <= -116.463;

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371e3;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/* ---------------------------------------------------------
   MAPSCREEN COMPONENT
---------------------------------------------------------- */

export default function MapScreen() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [categoryOpen, setCategoryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<(typeof CATEGORY_OPTIONS)[number]>("All Categories");

  const [expanded, setExpanded] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );

  const [initialRegion, setInitialRegion] = useState<Region | null>(null);
  const [useDeviceLocation, setUseDeviceLocation] = useState(true);
  const [locationLoading, setLocationLoading] = useState(false);

  const [mapMode, setMapMode] = useState<"user" | "oregon">("user");
  const [toggleState, setToggleState] = useState<"user" | "oregon">("user");

  const mapRef = useRef<MapView | null>(null);
  const { bottom } = useSafeAreaInsets();

  const overlayBottom = 16 + bottom;

  const collapsedPreviewHeight = 150;
  const expandedPreviewHeight = Dimensions.get("window").height * 0.72;

  const mapPadding = useMemo(
    () => ({
      bottom: bottom + 96,
      top: 16,
      left: 16,
      right: 16,
    }),
    [bottom]
  );

  const provider = Platform.OS === "android" ? PROVIDER_GOOGLE : undefined;

  /* ---------------------------------------------------------
     INITIAL LOAD
  ---------------------------------------------------------- */

  useEffect(() => {
    configureMobileAds();
    trackEvent("screen_view", { screen: "Map" });
  }, []);

  useEffect(() => {
    const q = collection(db, "businesses");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        latitude: Number(doc.data().latitude),
        longitude: Number(doc.data().longitude),
      })) as Business[];
      setBusinesses(items);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /* ---------------------------------------------------------
     LOCATION HANDLING
  ---------------------------------------------------------- */

  const requestLocation = useCallback(async (shouldCenter = false) => {
    try {
      setLocationLoading(true);
      setLocationError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocation(null);
        setLocationError(
          "Enable location to center the map and sort nearby results."
        );
        Alert.alert("Location needed", "Please allow location.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setLocation(coords);

      if (mapRef.current && shouldCenter) {
        const inOregon = isUserInOregon(coords.latitude, coords.longitude);

        const region = inOregon
          ? {
              ...coords,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }
          : OREGON_REGION;

        mapRef.current.animateToRegion(region, 1000);
      }
    } catch {
      setLocationError("Unable to fetch your location.");
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    setInitialRegion(OREGON_REGION);
  }, []);

  /* ---------------------------------------------------------
     RECENTER & MODE CONTROLS
---------------------------------------------------------- */

  const handleRecenter = async () => {
    const nextMode = toggleState === "user" ? "oregon" : "user";

    setMapMode(nextMode);
    setUseDeviceLocation(nextMode === "user");
    setToggleState(nextMode);

    if (nextMode === "oregon") {
      if (mapRef.current) {
        mapRef.current.animateCamera({
          center: {
            latitude: OREGON_REGION.latitude,
            longitude: OREGON_REGION.longitude,
          },
          zoom: 6,
        });
      }
    } else if (location && mapRef.current) {
      mapRef.current.animateCamera({
        center: location,
        zoom: 13,
      });
    } else {
      requestLocation(true);
    }
  };

  const handleResetToDefault = () => {
    if (mapMode === "user") {
      if (location && mapRef.current) {
        mapRef.current.animateCamera({
          center: location,
          zoom: 13,
        });
      } else {
        requestLocation(true);
      }
    } else if (mapRef.current) {
      mapRef.current.animateCamera({
        center: {
          latitude: OREGON_REGION.latitude,
          longitude: OREGON_REGION.longitude,
        },
        zoom: 6,
      });
    }
  };

  /* ---------------------------------------------------------
     SORTING + FILTERING
---------------------------------------------------------- */

  const sorted = useMemo(() => {
    if (!location) return businesses;
    return [...businesses].sort(
      (a, b) =>
        haversine(
          location.latitude,
          location.longitude,
          a.latitude,
          a.longitude
        ) -
        haversine(
          location.latitude,
          location.longitude,
          b.latitude,
          b.longitude
        )
    );
  }, [businesses, location]);

  const filtered = useMemo(() => {
    if (selectedCategory === "All Categories") return sorted;
    return sorted.filter(
      (biz) => normalizeCategory(biz.category) === selectedCategory
    );
  }, [selectedCategory, sorted]);

  const validBusinesses = useMemo(
    () =>
      filtered.filter(
        (biz) =>
          Number.isFinite(biz.latitude) &&
          Number.isFinite(biz.longitude) &&
          Math.abs(biz.latitude) <= 90 &&
          Math.abs(biz.longitude) <= 180
      ),
    [filtered]
  );

  const resolvedInitialRegion = initialRegion ?? OREGON_REGION;

  useEffect(() => {
    if (useDeviceLocation) {
      requestLocation(false);
    }
  }, [requestLocation, useDeviceLocation]);

  /* ---------------------------------------------------------
     RENDER
---------------------------------------------------------- */

  return (
    <ScreenContainer>

      {/* CATEGORY DROPDOWN */}
      <View style={styles.categoryContainer}>
        <Pressable
          style={styles.categoryButton}
          onPress={() => setCategoryOpen((prev) => !prev)}
        >
          <Text style={styles.categoryButtonLabel}>{selectedCategory}</Text>
        </Pressable>

        {categoryOpen ? (
          <View style={styles.dropdown}>
            <ScrollView
              contentContainerStyle={styles.dropdownContent}
              showsVerticalScrollIndicator={false}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedCategory(opt);
                    setCategoryOpen(false);
                  }}
                >
                  <View
                    style={[
                      styles.dropdownDot,
                      { backgroundColor: categoryColors[opt] ?? Colors.accent },
                    ]}
                  />
                  <Text
                    style={[
                      styles.dropdownLabel,
                      opt === selectedCategory && styles.dropdownLabelActive,
                    ]}
                  >
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
      </View>

      {/* MAIN MAP */}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={Colors.accent} size="large" />
          <Text style={styles.body}>Loading businesses...</Text>
        </View>
      ) : (
        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            provider={provider}
            mapType="terrain"
            style={styles.map}
            initialRegion={resolvedInitialRegion}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass
            mapPadding={mapPadding}
            legalLabelInsets={{ bottom: bottom + 60, left: 12, right: 12, top: 0 }}
            customMapStyle={tanComfortMapStyle}
            loadingEnabled
          >
            {validBusinesses.map((biz) => (
              <Marker
                key={biz.id}
                coordinate={{
                  latitude: biz.latitude,
                  longitude: biz.longitude,
                }}
                title={biz.name}
                description={biz.category}
                pinColor={
                  categoryColors[normalizeCategory(biz.category)] ??
                  Colors.accent
                }
                onPress={() => {
                  setExpanded(false);
                  setSelectedBusiness(biz);
                }}
              >
                <Callout>
                  <View style={styles.callout}>
                    <Text style={styles.calloutTitle}>{biz.name}</Text>

                    {biz.category ? (
                      <Text style={styles.calloutCategory}>
                        {biz.category}
                      </Text>
                    ) : null}

                    {biz.owner ? (
                      <Text style={styles.calloutCategory}>
                        Owner: {biz.owner}
                      </Text>
                    ) : null}

                    {biz.description ? (
                      <Text
                        style={styles.calloutDescription}
                        numberOfLines={3}
                      >
                        {biz.description}
                      </Text>
                    ) : null}
                  </View>
                </Callout>
              </Marker>
            ))}
          </MapView>

          {/* PREVIEW CARD */}
          {selectedBusiness ? (
            <View
              style={[
                styles.previewContainer,
                { paddingBottom: overlayBottom },
              ]}
            >
              <BusinessPreview
                business={selectedBusiness}
                expanded={expanded}
                onExpand={() => setExpanded(true)}
                onCollapse={() => setExpanded(false)}
                onClose={() => {
                  setExpanded(false);
                  setSelectedBusiness(null);
                }}
              />
            </View>
          ) : null}

          {/* LOCATION TOGGLE BUTTON */}
          <Pressable
            style={[
              styles.locateButton,
              { top: 16, right: 16 },
              toggleState === "user" && styles.locateButtonActive,
            ]}
            onPress={handleRecenter}
            hitSlop={12}
          >
            <Ionicons
              name={toggleState === "user" ? "locate" : "earth"}
              size={18}
              color={toggleState === "user" ? Colors.text.inverse : Colors.text.primary}
            />
          </Pressable>

          {/* Ad banner (bottom of map) */}
          {process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ? (
            <View style={[styles.adContainer, { bottom: bottom + 8 }]}>
              <BannerAd unitId={process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? ""} size={BannerAdSize.BANNER} />
            </View>
          ) : null}
        </View>
      )}
    </ScreenContainer>
  );
}

/* ---------------------------------------------------------
   BUSINESS PREVIEW COMPONENT
---------------------------------------------------------- */

function BusinessPreview({
  business,
  expanded,
  onExpand,
  onCollapse,
  onClose,
}: {
  business: Business;
  expanded: boolean;
  onExpand: () => void;
  onCollapse: () => void;
  onClose: () => void;
}) {
  const expandedHeight = Dimensions.get("window").height * 0.72;
  const previewHeight = expanded ? expandedHeight : 180;

  const openMaps = () => {
    const { latitude, longitude, name } = business;
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${latitude},${longitude}&q=${encodeURIComponent(
        name
      )}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(
        name
      )})`,
    });

    if (url) {
      Linking.openURL(url).catch(() =>
        Alert.alert("Error", "Unable to open maps.")
      );
    }
  };

  const openWebsite = () => {
    if (!business.website) return;
    const url = business.website.startsWith("http")
      ? business.website
      : `https://${business.website}`;

    Linking.openURL(url).catch(() =>
      Alert.alert("Error", "Unable to open website.")
    );
  };

  return (
    <Pressable
      style={[styles.previewCard, { height: previewHeight }]}
      onPress={onExpand}
      disabled={expanded}
    >
      <Pressable
        style={styles.previewClose}
        onPress={onClose}
        hitSlop={12}
      >
        <Text style={styles.previewCloseLabel}>X</Text>
      </Pressable>

      {!expanded ? (
        <Pressable
          style={styles.previewExpand}
          onPress={onExpand}
          hitSlop={12}
        >
          <Text style={styles.previewExpandLabel}>Expand</Text>
        </Pressable>
      ) : null}

      <View style={styles.previewHeader}>
        <Text style={styles.previewTitle} numberOfLines={2} ellipsizeMode="tail">
          {business.name}
        </Text>

        {business.category ? (
          <Text style={styles.previewMeta} numberOfLines={1}>
            {business.category}
          </Text>
        ) : null}

        {business.owner ? (
          <Text style={styles.previewMeta} numberOfLines={2}>
            Owner: {business.owner}
          </Text>
        ) : null}

        {expanded && (
          <View style={styles.previewScrollContainer}>
            <ScrollView
              contentContainerStyle={styles.previewDetails}
              showsVerticalScrollIndicator={false}
            >
              {business.description ? (
                <Text style={styles.previewBody}>
                  {business.description}
                </Text>
              ) : null}

              {business.address ? (
                <Text style={styles.previewMeta}>
                  Address: {business.address}
                </Text>
              ) : null}

              {business.hours ? (
                <Text style={styles.previewMeta}>
                  Hours: {business.hours}
                </Text>
              ) : null}

              {business.phone ? (
                <Pressable
                  onPress={() =>
                    Linking.openURL(`tel:${business.phone}`)
                  }
                >
                  <Text style={[styles.previewMeta, styles.previewLink]}>
                    Phone: {formatPhone(business.phone)}
                  </Text>
                </Pressable>
              ) : null}

              {business.website ? (
                <Pressable onPress={openWebsite}>
                  <Text
                    style={[styles.previewMeta, styles.previewLink]}
                  >
                    Website / Social Media
                  </Text>
                </Pressable>
              ) : null}
            </ScrollView>
          </View>
        )}
      </View>

      {expanded ? (
        <View style={styles.previewActions}>
          <Pressable
            style={[styles.previewButton, styles.previewPrimary]}
            onPress={openMaps}
          >
            <Text style={styles.previewButtonLabel}>
              Get Directions
            </Text>
          </Pressable>

          <Pressable
            style={[styles.previewButton, styles.previewGhost]}
            onPress={onCollapse}
          >
            <Text style={styles.previewGhostLabel}>Collapse</Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}

/* ---------------------------------------------------------
   STYLES (FINAL)
---------------------------------------------------------- */

const styles = StyleSheet.create({

  /* SCREEN + GENERAL */
  content: {
    flex: 1,
    backgroundColor: "transparent",
  },

  body: {
    color: Colors.text.secondary,
    fontSize: 14,
    marginTop: 4,
  },
  error: {
    color: "#e74c3c",
    fontSize: 13,
    marginTop: 4,
  },
  loader: {
    flex: 1,
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 8,
  },

  /* CATEGORY CAPSULE */
  categoryContainer: {
    position: "absolute",
    top: 12,
    left: 16,
    zIndex: 50,
    alignItems: "flex-start",
  },
  categoryButton: {
    minWidth: 150,
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.palette.cardBackground,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    justifyContent: "center",
    shadowColor: Colors.palette.shadowSoft,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  categoryButtonLabel: {
    color: Colors.text.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  dropdown: {
    marginTop: 6,
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    minWidth: 200,
    maxHeight: 220,
    shadowColor: Colors.palette.shadowSoft,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  dropdownContent: {
    paddingVertical: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dropdownLabel: {
    color: Colors.text.secondary,
    fontWeight: "700",
    fontSize: 13,
  },
  dropdownLabelActive: {
    color: Colors.accent,
  },

  locateButton: {
    position: "absolute",
    right: 16,
    top: 16,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.palette.cardBackground,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.palette.shadowSoft,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  locateButtonActive: {
    backgroundColor: Colors.palette.primary,
    borderColor: Colors.palette.primary,
  },
  adContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    bottom: 0,
  },

  /* MAP */
  mapWrapper: {
    flex: 1,
    position: "relative",
    width: "100%",
    backgroundColor: Colors.palette.surfaceBackground,
  },
  map: {
    flex: 1,
    width: "100%",
  },

  /* CALLOUT */
  callout: {
    maxWidth: 260,
    gap: 4,
  },
  calloutTitle: {
    fontWeight: "800",
    color: Colors.text.primary,
  },
  calloutCategory: {
    color: Colors.text.secondary,
  },
  calloutDescription: {
    color: Colors.text.secondary,
    fontSize: 12,
  },

  /* BADGES */
  badgeChip: {
    marginTop: 4,
    alignSelf: "flex-start",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFD700",
    backgroundColor: "rgba(255,215,0,0.15)",
    shadowColor: "#FFD700",
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  badgeChipLabel: {
    color: "#FFE680",
    fontWeight: "700",
    fontSize: 11,
  },

  /* PREVIEW CARD */
  previewContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    zIndex: 999,
    paddingHorizontal: 16,
  },
  previewCard: {
    width: "100%",
    marginBottom: 0,
    padding: 16,
    paddingBottom: 28,
    borderRadius: 16,
    backgroundColor: Colors.palette.cardBackground,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    shadowColor: Colors.palette.shadowSoft,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    gap: 8,
    overflow: "hidden",
  },
  previewHeader: {
    flex: 1,
    gap: 4,
    paddingRight: 4,
  },
  previewTitle: {
    color: Colors.text.primary,
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 24,
  },
  previewMeta: {
    color: Colors.text.secondary,
    fontSize: 14,
    flexShrink: 1,
  },

  badgeChipLarge: {
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#FFD700",
    backgroundColor: "rgba(255,215,0,0.18)",
    marginTop: 4,
    shadowColor: "#FFD700",
    shadowOpacity: 0.85,
    shadowRadius: 8,
  },
  badgeChipLargeLabel: {
    color: "#FFE680",
    fontSize: 12,
    fontWeight: "800",
  },

  previewActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  previewButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  previewPrimary: {
    backgroundColor: Colors.palette.primary,
    borderColor: Colors.palette.primary,
  },
  previewButtonLabel: {
    color: Colors.text.inverse,
    fontWeight: "800",
    fontSize: 15,
    lineHeight: 18,
    textAlign: "center",
  },
  previewGhost: {
    borderColor: Colors.palette.divider,
    backgroundColor: Colors.palette.cardBackground,
  },
  previewGhostLabel: {
    color: Colors.text.primary,
    fontWeight: "700",
    fontSize: 15,
    lineHeight: 18,
    textAlign: "center",
  },

  previewExpand: {
    position: "absolute",
    bottom: 12,
    right: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    backgroundColor: Colors.palette.cardBackground,
  },
  previewExpandLabel: {
    color: Colors.text.primary,
    fontWeight: "700",
    fontSize: 12,
  },

  previewClose: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    backgroundColor: Colors.palette.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  previewCloseLabel: {
    color: Colors.text.primary,
    fontSize: 14,
    fontWeight: "800",
  },

  previewScrollContainer: {
    marginTop: 8,
    flex: 1,
    maxHeight: "100%",
    overflow: "scroll",
  },
  previewDetails: {
    marginTop: 8,
    gap: 4,
    paddingBottom: 12,
  },
  previewBody: {
    color: Colors.text.primary,
    lineHeight: 18,
  },

  previewLink: {
    textDecorationLine: "underline",
    color: Colors.accent,
  },
});

/* ---------------------------------------------------------
   MAP STYLE
---------------------------------------------------------- */

const tanComfortMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#dcd2c0" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#4a4032" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f2e7d5" }] },

  { featureType: "administrative", elementType: "labels.text.fill", stylers: [{ color: "#3f3528" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },

  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#e6ddca" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#4a4032" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },

  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#d0ccb5" }] },

  { featureType: "road", elementType: "geometry", stylers: [{ color: "#b2a58e" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#a0907a" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#8b7d65" }] },

  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#3f3528" }] },
  { featureType: "road", elementType: "labels.text.stroke", stylers: [{ color: "#f2e7d5" }] },

  { featureType: "transit", stylers: [{ visibility: "off" }] },

  { featureType: "water", elementType: "geometry", stylers: [{ color: "#b1c4cc" }] },
];

