import AsyncStorage from '@react-native-async-storage/async-storage';
import mobileAds, {
  AdEventType,
  InterstitialAd,
  TestIds,
} from 'react-native-google-mobile-ads';

const ADMIN_EMAIL = (process.env.EXPO_PUBLIC_ADMIN_EMAIL || '').toLowerCase();
const INTERSTITIAL_COUNT_KEY = 'admob_interstitial_view_count';

export const BANNER_HEIGHT = 60;
export const INTERSTITIAL_FREQUENCY = 4;

export const getBannerAdUnitId = () =>
  __DEV__ ? TestIds.BANNER : process.env.EXPO_PUBLIC_ADMOB_BANNER_ID ?? '';

export const getInterstitialAdUnitId = () =>
  __DEV__ ? TestIds.INTERSTITIAL : process.env.EXPO_PUBLIC_ADMOB_INTERSTITIAL_ID ?? '';

export const isAdminUser = (email?: string | null) => {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL;
};

export async function configureMobileAds() {
  try {
    await mobileAds().initialize();
  } catch (err) {
    console.warn('Mobile ads initialization failed', err);
  }
}

export async function showInterstitialWithFrequency(
  frequency = INTERSTITIAL_FREQUENCY,
  adUnitIdOverride?: string,
) {
  const adUnitId = adUnitIdOverride ?? getInterstitialAdUnitId();
  if (!adUnitId || frequency <= 0) return false;

  const existingCount = Number((await AsyncStorage.getItem(INTERSTITIAL_COUNT_KEY)) ?? '0') || 0;
  const nextCount = existingCount + 1;
  await AsyncStorage.setItem(INTERSTITIAL_COUNT_KEY, String(nextCount));

  if (nextCount % frequency !== 0) return false;

  return new Promise<boolean>((resolve) => {
    const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    let unsubscribe: () => void = () => {};
    let errorUnsub: () => void = () => {};
    let closeUnsub: () => void = () => {};

    const cleanup = () => {
      unsubscribe();
      errorUnsub();
      closeUnsub();
    };

    unsubscribe = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      interstitial.show().catch((err) => {
        console.warn('Interstitial show failed', err);
        cleanup();
        resolve(false);
      });
    });

    errorUnsub = interstitial.addAdEventListener(AdEventType.ERROR, (err) => {
      console.warn('Interstitial load failed', err);
      cleanup();
      resolve(false);
    });

    closeUnsub = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      cleanup();
      resolve(true);
    });

    interstitial.load();

    // Fallback timeout to avoid hanging promises
    setTimeout(() => {
      cleanup();
      resolve(false);
    }, 8000);
  });
}
