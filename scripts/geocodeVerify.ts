import { readFileSync } from 'fs';
import path from 'path';

import { initializeApp, cert } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';
const ROOT = path.resolve(__dirname, '..');
const SERVICE_ACCOUNT_PATH = path.join(ROOT, 'serviceAccount.json');
const SLEEP_MS = 400;
const MAX_DIFF = 0.0001; // ~11m tolerance

type DocWithAddress = {
  id: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  [key: string]: any;
};

if (!GOOGLE_MAPS_API_KEY) {
  console.error('Missing EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in environment. Aborting.');
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(SERVICE_ACCOUNT_PATH, 'utf8')) as ServiceAccount;

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function geocode(address: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Geocode HTTP ${resp.status}`);
  const data = await resp.json();
  const loc = data?.results?.[0]?.geometry?.location;
  if (!loc?.lat || !loc?.lng) throw new Error('No coordinates returned');
  return { lat: loc.lat as number, lng: loc.lng as number };
}

function needsUpdate(currentLat?: number, currentLng?: number, newLat?: number, newLng?: number) {
  if (newLat == null || newLng == null || currentLat == null || currentLng == null) return true;
  return Math.abs(currentLat - newLat) > MAX_DIFF || Math.abs(currentLng - newLng) > MAX_DIFF;
}

async function processCollection(collectionName: 'businesses' | 'submissions') {
  const snap = await db.collection(collectionName).get();
  console.log(`Processing ${snap.size} docs in ${collectionName}...`);
  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data() as DocWithAddress;
    const address = data.address?.trim();
    if (!address) continue;
    try {
      const { lat, lng } = await geocode(address);
      if (needsUpdate(data.latitude as number | undefined, data.longitude as number | undefined, lat, lng)) {
        await doc.ref.update({ latitude: lat, longitude: lng });
        updated += 1;
        console.log(`[${collectionName}] Updated ${doc.id} -> ${lat}, ${lng}`);
      }
    } catch (err: any) {
      console.warn(`[${collectionName}] ${doc.id} geocode failed: ${err?.message ?? err}`);
    }
    await sleep(SLEEP_MS);
  }
  console.log(`Done ${collectionName}: ${updated} documents updated.`);
}

async function main() {
  await processCollection('businesses');
  await processCollection('submissions');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
