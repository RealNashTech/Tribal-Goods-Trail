import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import ScreenContainer from "@/components/ScreenContainer";
import { db } from "@/firebase/config";
import { getFirebaseAuth } from "@/firebase/auth";
import {
  INTERSTITIAL_FREQUENCY,
  configureMobileAds,
  getInterstitialAdUnitId,
  isAdminUser,
  showInterstitialWithFrequency,
} from "@/services/ads";
import { Colors } from "@/theme";

type Business = {
  name?: string;
  category?: string;
  owner?: string;
  address?: string;
  phone?: string;
  website?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
};

const formatPhone = (value?: string) => {
  if (!value) return "";
  const digits = (value.match(/\d+/g) || []).join("");
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return value;
};

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [biz, setBiz] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [adsAllowed, setAdsAllowed] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const interstitialAdUnitId = useMemo(() => getInterstitialAdUnitId(), []);

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return;
        const ref = doc(db, "businesses", String(id));
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setBiz(snap.data() as any);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    configureMobileAds();
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      const isAdmin = isAdminUser(user?.email ?? null);
      setAdsAllowed(!isAdmin);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!authReady || !adsAllowed || !interstitialAdUnitId) return;
      showInterstitialWithFrequency(
        INTERSTITIAL_FREQUENCY,
        interstitialAdUnitId
      ).catch((err) => console.warn("Interstitial error", err));
    }, [adsAllowed, authReady, interstitialAdUnitId])
  );

  return (
    <ScreenContainer>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={Colors.text.primary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {biz?.name ?? "Business"}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator style={styles.loader} color={Colors.palette.primary} />
        ) : (
          <View style={styles.card}>
            <Text style={styles.title}>{biz?.name ?? "Business"}</Text>
            {biz?.category ? <Text style={styles.chip}>{biz.category}</Text> : null}

            <View style={styles.section}>
              <Text style={styles.label}>Owner</Text>
              <Text style={styles.value}>{biz?.owner ?? "Not Listed"}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.label}>Address</Text>
              <Text style={styles.value}>{biz?.address ?? "Not Listed"}</Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.label}>Phone</Text>
              {biz?.phone ? (
                <Pressable onPress={() => Linking.openURL(`tel:${biz.phone}`)}>
                  <Text style={[styles.value, styles.link]} numberOfLines={1}>
                    {formatPhone(biz.phone)}
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.value}>Not Listed</Text>
              )}
            </View>
            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.label}>Website</Text>
              {biz?.website ? (
                <Pressable onPress={() => Linking.openURL(biz.website.startsWith("http") ? biz.website : `https://${biz.website}`)}>
                  <Text style={[styles.value, styles.link]} numberOfLines={2}>
                    {biz.website}
                  </Text>
                </Pressable>
              ) : (
                <Text style={styles.value}>Not Listed</Text>
              )}
            </View>
            <View style={styles.divider} />

            <View style={styles.section}>
              <Text style={styles.label}>Description</Text>
              <Text style={styles.value}>{biz?.description ?? "Not provided."}</Text>
            </View>

            <View style={styles.showOnMapContainer}>
              <Pressable
                style={[
                  styles.showOnMap,
                  !biz?.latitude || !biz?.longitude ? styles.disabled : null,
                ]}
                disabled={!biz?.latitude || !biz?.longitude}
                onPress={() => {
                  if (!biz?.latitude || !biz?.longitude) return;
                  const url = `https://www.google.com/maps/search/?api=1&query=${biz.latitude},${biz.longitude}`;
                  Linking.openURL(url);
                }}
              >
                <Ionicons name="map" size={18} color={Colors.text.inverse} />
                <Text style={styles.showOnMapLabel}>Get directions</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 32,
    paddingHorizontal: 16,
  },
  header: {
    backgroundColor: Colors.palette.cardBackground,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: Colors.palette.divider,
  },
  back: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.palette.cardBackground,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: Colors.text.primary,
    fontSize: 18,
    fontWeight: "700",
    marginHorizontal: 12,
  },
  loader: {
    marginTop: 40,
  },
  card: {
    backgroundColor: Colors.palette.cardBackground,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    shadowColor: Colors.palette.shadowSoft,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 12,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: Colors.palette.surfaceBackground,
    color: Colors.text.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    fontWeight: "700",
    marginBottom: 8,
  },
  section: {
    gap: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.palette.divider,
    marginVertical: 8,
  },
  label: {
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: "700",
  },
  value: {
    color: Colors.text.primary,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  link: {
    color: Colors.palette.primary,
    textDecorationLine: "underline",
  },
  showOnMapContainer: {
    marginTop: 12,
    marginBottom: 8,
  },
  showOnMap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    backgroundColor: Colors.palette.primary,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  showOnMapLabel: {
    color: Colors.text.inverse,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.5,
  },
});
