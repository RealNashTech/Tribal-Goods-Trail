import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";

// ---- CHANGE THIS TO YOUR serviceAccount.json LOCATION ----
const serviceAccountPath = path.resolve("serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});

const db = admin.firestore();

// ---- LOAD JSON FROM DESKTOP ----
const jsonPath = "C:/Users/AGent/OneDrive/Desktop/TribalGoodsTrail_Directory_CLEAN.json";

if (!fs.existsSync(jsonPath)) {
  console.error("❌ JSON file not found at:", jsonPath);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

function makeId(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")   // convert non-alphanumeric to dashes
    .replace(/^-+|-+$/g, "")       // trim start/end dashes
    .substring(0, 50);             // Firestore ID limit safety
}

async function upload() {
  console.log(`📦 Uploading ${data.length} businesses to Firestore...`);

  for (const item of data) {
    const id = makeId(item.name);
    const ref = db.collection("businesses").doc(id);

    await ref.set(item, { merge: true });

    console.log(`✔ Uploaded: ${item.name} → (${id})`);
  }

  console.log("🎉 All businesses uploaded successfully!");
}

upload().catch((err) => {
  console.error("❌ Upload failed:", err);
});
