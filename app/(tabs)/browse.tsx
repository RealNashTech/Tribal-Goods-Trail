import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, onSnapshot, Timestamp } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import BusinessListCard from '@/components/BusinessListCard';
import ScreenContainer from '@/components/ScreenContainer';
import { db } from '@/firebase/config';
import { trackEvent } from '@/services/analytics';
import { Colors } from '@/theme';

type Business = {
  id: string;
  name: string;
  owner?: string;
  description?: string;
  category?: string;
  createdAt?: number;
  latitude: number;
  longitude: number;
};

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371e3;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const CACHE_KEY = 'businesses-cache-v1';

const normalizeCreatedAt = (val: any): number => {
  if (!val) return 0;
  if (val instanceof Timestamp) return val.toMillis();
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'object' && typeof val.seconds === 'number') {
    const nanos = typeof val.nanoseconds === 'number' ? val.nanoseconds : 0;
    return val.seconds * 1000 + nanos / 1_000_000;
  }
  const parsed = Date.parse(val as any);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const normalizeBusiness = (raw: any, id?: string): Business => ({
  id: id ?? raw.id ?? '',
  name: raw.name ?? 'Untitled',
  owner: raw.owner,
  description: raw.description,
  category: raw.category,
  createdAt: normalizeCreatedAt(raw.createdAt),
  latitude: Number(raw.latitude),
  longitude: Number(raw.longitude),
});

export default function BrowseScreen() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'nearest' | 'name' | 'recent'>('nearest');
  const router = useRouter();
  const [cacheReady, setCacheReady] = useState(false);

  useEffect(() => {
    trackEvent('screen_view', { screen: 'Browse' });
  }, []);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setBusinesses(parsed.map((item: any) => normalizeBusiness(item)));
          }
        }
      } catch (err) {
        console.warn('Failed to read cached businesses', err);
      } finally {
        setCacheReady(true);
      }
    };
    loadCache();
  }, []);

  const fetchBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'businesses'));
      const data = snap.docs.map((doc) => normalizeBusiness(doc.data(), doc.id));
      setBusinesses(data);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      trackEvent('businesses_refreshed', { count: data.length });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Unable to load businesses from Firestore.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'businesses'),
      async (snap) => {
        const data = snap.docs.map((doc) => normalizeBusiness(doc.data(), doc.id));
        setBusinesses(data);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
        setLoading(false);
      },
      (err) => {
        console.error(err);
        Alert.alert('Error', 'Unable to load businesses from Firestore.');
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  useEffect(() => {
    const requestLocation = async () => {
      try {
        setLocationError(null);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationError('Location permission is required to show nearby businesses.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      } catch (err) {
        setLocationError('Unable to fetch your location right now.');
      }
    };
    requestLocation();
  }, []);

  const filtered = useMemo(() => {
    const base = businesses;

    if (sortBy === 'name') {
      return [...base].sort((a, b) => a.name.localeCompare(b.name));
    }

    if (sortBy === 'recent') {
      return [...base].sort((a, b) => {
        const diff = (b.createdAt ?? 0) - (a.createdAt ?? 0);
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
      });
    }

    // Default: nearest
    if (!location) return base;
    return [...base].sort(
      (a, b) =>
        haversine(location.latitude, location.longitude, a.latitude, a.longitude) -
        haversine(location.latitude, location.longitude, b.latitude, b.longitude)
    );
  }, [businesses, location, sortBy]);

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.headerCard}>
          <View style={styles.logoRow}>
            <Image
              source={require('../../assets/images/tribalgoodstraillogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Tribal Goods Trail</Text>
              <Text style={styles.subtitle}>Discover Native-owned businesses near you.</Text>
            </View>
          </View>

          <View style={styles.sortButtons}>
            {[
              { key: 'nearest', label: 'Nearest' },
              { key: 'name', label: 'Name (A-Z)' },
              { key: 'recent', label: 'Recently added' },
            ].map((opt) => (
              <Pressable
                key={opt.key}
                style={[styles.sortButton, sortBy === opt.key && styles.sortButtonActive]}
                onPress={() => setSortBy(opt.key as any)}
              >
                <Text style={[styles.sortButtonLabel, sortBy === opt.key && styles.sortButtonLabelActive]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.meta}>Live from Firestore · {filtered.length} businesses</Text>
          {locationError ? <Text style={styles.error}>{locationError}</Text> : null}
        </View>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={Colors.accent} size="large" />
            <Text style={styles.body}>Loading businesses...</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.title}>No businesses found</Text>
            <Text style={styles.body}>Try refreshing or adjusting your search.</Text>
            <Pressable style={styles.refreshBtn} onPress={fetchBusinesses}>
              <Text style={styles.refreshLabel}>Refresh</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            style={{ flex: 1 }}
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 32, gap: 16, paddingTop: 4 }}
            renderItem={({ item }) => {
              const distanceMeters =
                location && Number.isFinite(item.latitude) && Number.isFinite(item.longitude)
                  ? haversine(location.latitude, location.longitude, item.latitude, item.longitude)
                  : null;
              const distanceLabel =
                distanceMeters !== null ? `${(distanceMeters / 1609.34).toFixed(1)} miles away` : null;

              return (
                <View style={styles.cardWrapper}>
                  <BusinessListCard
                    name={item.name}
                    category={item.category}
                    owner={item.owner}
                    description={item.description}
                    onPress={() => router.push(`/business/${item.id}`)}
                  />
                  {distanceLabel ? <Text style={styles.distanceLabel}>{distanceLabel}</Text> : null}
                </View>
              );
            }}
          />
        )}

      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
  },
  cardWrapper: {
    position: 'relative',
  },
  headerCard: {
    gap: 8,
    marginBottom: 8,
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 12,
    padding: 10,
    shadowColor: Colors.palette.shadowSoft,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    width: 88,
    height: 88,
  },
  title: {
    color: Colors.text.primary,
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.text.secondary,
    fontWeight: '600',
    fontSize: 14,
  },
  body: {
    color: Colors.text.secondary,
    fontSize: 15,
  },
  error: {
    color: Colors.palette.error,
    fontSize: 12,
  },
  sectionLabel: {
    color: Colors.text.primary,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  meta: {
    color: Colors.text.secondary,
    fontSize: 12,
    marginTop: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  sortButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    backgroundColor: Colors.palette.inputBackground,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.palette.shadowSoft,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  sortButtonActive: {
    borderColor: Colors.palette.primary,
    backgroundColor: Colors.palette.primary,
  },
  sortButtonLabel: {
    color: Colors.text.secondary,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  sortButtonLabelActive: {
    color: Colors.text.inverse,
  },
  featureCard: {
    width: 180,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.palette.cardBackground,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    shadowColor: Colors.palette.shadowSoft,
    shadowOpacity: 1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    gap: 4,
  },
  featureName: {
    color: Colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  featureCategory: {
    color: Colors.text.secondary,
    fontSize: 13,
    fontWeight: '600',
  },
  featureDistance: {
    color: Colors.text.meta,
    fontSize: 12,
    fontWeight: '600',
  },
  loader: {
    flex: 1,
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    shadowColor: Colors.palette.shadowSoft,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  distanceLabel: {
    position: 'absolute',
    top: 6,
    right: 8,
    backgroundColor: Colors.palette.surfaceBackground,
    color: Colors.text.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: Colors.palette.divider,
  },
  empty: {
    backgroundColor: Colors.palette.cardBackground,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.palette.divider,
    padding: 16,
    alignItems: 'flex-start',
    gap: 6,
    shadowColor: Colors.palette.shadowSoft,
    shadowOpacity: 1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  refreshBtn: {
    marginTop: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.palette.primary,
    backgroundColor: Colors.palette.primary,
  },
  refreshLabel: {
    color: Colors.text.inverse,
    fontWeight: '700',
  },
});



