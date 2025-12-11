import Constants from 'expo-constants';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { collection, getDocs } from 'firebase/firestore';

import { db } from '@/firebase/config';

type Business = {
  id: string;
  name?: string;
  category?: string;
  latitude?: number;
  longitude?: number;
};

const GEOFENCE_TASK = 'business-geofence-task';
let taskDefined = false;

function defineGeofenceTask() {
  if (taskDefined) return;
  TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
    if (error) {
      console.error('Geofence task error', error);
      return;
    }
    const { eventType, region } = data as any;
    if (eventType === Location.LocationGeofencingEventType.Enter && region) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Nearby Native-owned business',
            body: region.identifier
              ? `You’re near ${region.identifier}. Tap to explore.`
              : 'You’re near a Native-owned business.',
            data: { regionId: region.identifier },
          },
          trigger: null,
        });
      } catch (err) {
        console.error('Notification scheduling failed', err);
      }
    }
  });
  taskDefined = true;
}

// Ensure the task is defined as soon as the module loads (needed for headless/background).
defineGeofenceTask();

async function ensurePermissions() {
  if (Platform.OS === 'web') return false;

  const { status: notifStatus } = await Notifications.requestPermissionsAsync();
  if (notifStatus !== 'granted') {
    console.warn('Notification permission not granted');
  }

  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') {
    return false;
  }
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') {
    return false;
  }
  return true;
}

async function fetchBusinesses(): Promise<Business[]> {
  const snap = await getDocs(collection(db, 'businesses'));
  return snap.docs.map((doc) => {
    const d = doc.data() as any;
    return {
      id: doc.id,
      name: d.name ?? 'Native-owned business',
      category: d.category,
      latitude: Number(d.latitude),
      longitude: Number(d.longitude),
    };
  });
}

export async function startBusinessGeofences(radiusMeters = 200) {
  if (Platform.OS === 'web') return;
  if (Constants.appOwnership && Constants.appOwnership === 'expo') return;

  const allowed = await ensurePermissions();
  if (!allowed) return;

  defineGeofenceTask();

  const businesses = await fetchBusinesses();
  const regions = businesses
    .filter((biz) => Number.isFinite(biz.latitude) && Number.isFinite(biz.longitude))
    .map((biz) => ({
      identifier: biz.name || biz.id,
      latitude: Number(biz.latitude),
      longitude: Number(biz.longitude),
      radius: radiusMeters,
      notifyOnEnter: true,
      notifyOnExit: false,
    }));

  if (!regions.length) return;

  try {
    const already = await Location.hasStartedGeofencingAsync(GEOFENCE_TASK);
    if (already) {
        try {
          await Location.stopGeofencingAsync(GEOFENCE_TASK);
        } catch (stopErr) {
          console.warn('Geofencing stop skipped:', stopErr?.message ?? stopErr);
        }
    }
    await Location.startGeofencingAsync(GEOFENCE_TASK, regions);
  } catch (err) {
    console.error('Geofencing failed to start', err);
  }
}
