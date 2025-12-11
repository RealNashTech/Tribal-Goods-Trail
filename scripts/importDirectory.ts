import fs from 'fs';
import path from 'path';

import admin from 'firebase-admin';

const DEFAULT_FILE = 'C:\\Users\\AGent\\OneDrive\\Desktop\\directoryk2.json';
const FILE_PATH = process.env.DIRECTORY_FILE ?? DEFAULT_FILE;
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const COLLECTION = process.env.FIREBASE_COLLECTION ?? 'businesses';

type DirectoryBusiness = {
  name: string;
  owner?: string;
  category: string;
  description: string;
  address?: string;
  phone?: string;
  website?: string;
  latitude: string | number;
  longitude: string | number;
};

function ensureEnv() {
  if (!PROJECT_ID) {
    throw new Error('Set FIREBASE_PROJECT_ID env var to your Firebase project id.');
  }
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS env var to your service account JSON file.');
  }
}

function initFirebase() {
  if (admin.apps.length) return admin.app();
  return admin.initializeApp({ projectId: PROJECT_ID });
}

function readBusinesses(): DirectoryBusiness[] {
  const resolved = path.resolve(FILE_PATH);
  const raw = fs.readFileSync(resolved, 'utf-8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) {
    throw new Error('Input file must be a JSON array');
  }
  return data;
}

function normalize(b: DirectoryBusiness) {
  return {
    name: b.name?.trim(),
    owner: b.owner?.trim() || undefined,
    category: b.category?.trim(),
    description: b.description?.trim(),
    address: b.address?.trim() || 'Not Listed',
    phone: b.phone?.trim() || undefined,
    website: b.website?.trim() || undefined,
    latitude: typeof b.latitude === 'string' ? Number(b.latitude) : b.latitude,
    longitude: typeof b.longitude === 'string' ? Number(b.longitude) : b.longitude,
  };
}

async function run() {
  ensureEnv();
  const app = initFirebase();
  const db = app.firestore();
  const businesses = readBusinesses();
  console.log(`Uploading ${businesses.length} businesses from ${FILE_PATH} to collection '${COLLECTION}'...`);

  let batch = db.batch();
  let opCount = 0;

  for (const b of businesses) {
    const docRef = db.collection(COLLECTION).doc();
    batch.set(docRef, { ...normalize(b), createdAt: admin.firestore.FieldValue.serverTimestamp(), source: 'import-script' });
    opCount += 1;

    if (opCount === 450) {
      await batch.commit();
      batch = db.batch();
      opCount = 0;
    }
  }

  if (opCount > 0) {
    await batch.commit();
  }
  console.log('Import complete.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
