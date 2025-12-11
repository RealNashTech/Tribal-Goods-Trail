/**
 * Firestore cleanup script: keep the newest document for each business name, delete older duplicates.
 * Duplicates are detected by case-insensitive name match.
 * Default mode is DRY RUN — nothing is deleted until you set DRY_RUN=false.
 */
import * as path from 'path';
import * as admin from 'firebase-admin';

const DRY_RUN = process.env.DRY_RUN !== 'false'; // default true; set DRY_RUN=false to actually delete
const COLLECTION = 'businesses';

function initAdmin() {
  if (admin.apps.length) return admin.app();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const serviceAccount = require('../serviceAccount.json');
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

type BusinessDoc = {
  id: string;
  name?: string;
  createdAtMillis: number;
  ref: admin.firestore.DocumentReference;
};

async function main() {
  initAdmin();
  const db = admin.firestore();
  const snap = await db.collection(COLLECTION).get();

  const groups = new Map<string, BusinessDoc[]>();

  snap.forEach((doc) => {
    const data = doc.data() as any;
    const name = (data.name ?? '').trim();
    if (!name) return;
    const key = name.toLowerCase();
    const createdAtMillis =
      (data.createdAt && data.createdAt.toMillis?.()) ??
      doc.createTime?.toMillis?.() ??
      0;
    const entry: BusinessDoc = { id: doc.id, name, createdAtMillis, ref: doc.ref };
    const arr = groups.get(key) ?? [];
    arr.push(entry);
    groups.set(key, arr);
  });

  const toDelete: admin.firestore.DocumentReference[] = [];
  for (const [, docs] of groups.entries()) {
    if (docs.length <= 1) continue;
    const sorted = docs.sort((a, b) => b.createdAtMillis - a.createdAtMillis);
    const keep = sorted[0];
    const remove = sorted.slice(1);
    remove.forEach((d) => toDelete.push(d.ref));
    console.log(`Keeping newest for "${keep.name}" (${keep.id}); deleting ${remove.length} older duplicate(s).`);
  }

  if (!toDelete.length) {
    console.log('No duplicates found.');
    return;
  }

  if (DRY_RUN) {
    console.log(`DRY RUN: would delete ${toDelete.length} documents. Set DRY_RUN=false to apply.`);
    return;
  }

  console.log(`Deleting ${toDelete.length} duplicate documents...`);
  while (toDelete.length) {
    const batch = db.batch();
    const chunk = toDelete.splice(0, 400);
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
    console.log(`Deleted ${chunk.length} docs...`);
  }
  console.log('Cleanup complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
