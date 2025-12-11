import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FirebaseAuth from 'firebase/auth';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';

import { getFirebaseApp } from './index';

let authInstance: Auth | undefined;
const getReactNativePersistence: any = (FirebaseAuth as any).getReactNativePersistence;

export function getFirebaseAuth() {
  if (authInstance) return authInstance;

  const app = getFirebaseApp();

  try {
    // React Native proper persistent auth
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (err) {
    console.warn("Fallback Auth init (non-RN environment):", err);
    // Fallback: use getAuth to reuse existing instance
    authInstance = getAuth(app);
  }

  return authInstance;
}
