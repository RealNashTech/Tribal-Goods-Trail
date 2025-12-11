/**
 * Firestore Submission Cleanup Script — FINAL VERSION
 * ----------------------------------------------------
 * This will:
 *  • Force categories into the 6 final categories
 *  • Add isCommunitySeller (default false)
 *  • Remove unused submission fields
 *  • Clean structure so admin approval works perfectly
 */

const admin = require("firebase-admin");
const fs = require("fs");

// Load your service account
const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

/* ---------------------------------------------------------
   FINAL CATEGORY SET (6)
---------------------------------------------------------- */
const FINAL_CATEGORIES = [
  "Cultural Goods & Handmade Items",
  "Traditional Foods, Crafts & Firewood",
  "Restaurants, Food Carts & Coffee",
  "Professional Services",
  "Business Storefronts & Retail",
  "Tribal Enterprises",
];

/* ---------------------------------------------------------
   OLD → NEW CATEGORY MAP
---------------------------------------------------------- */
const CATEGORY_MAP = {
  "Arts, Crafts & Cultural Goods": "Cultural Goods & Handmade Items",
  "Beadwork, Jewelry & Handmade Goods": "Cultural Goods & Handmade Items",

  "Food, Beverages & Traditional Foods": "Traditional Foods, Crafts & Firewood",

  "Construction, Trades & Home Services": "Business Storefronts & Retail",

  "Professional & Business Services": "Professional Services",

  "Tribal Enterprises & Tribal Programs": "Tribal Enterprises",

  "Community Sellers & Seasonal Vendors": "Cultural Goods & Handmade Items",
};

/* ---------------------------------------------------------
   START SCRIPT
---------------------------------------------------------- */

(async () => {
  console.log("\n🔥 Starting Firestore SUBMISSION cleanup...\n");

  const ref = db.collection("submissions");
  const snap = await ref.get();

  if (snap.empty) {
    console.log("⚠ No submissions found.");
    process.exit(0);
  }

  let count = 0;

  for (const doc of snap.docs) {
    const data = doc.data();

    /* -----------------------------------------------------
       FIX CATEGORY
    ------------------------------------------------------ */

    let newCategory = data.category || "";

    if (CATEGORY_MAP[newCategory]) {
      newCategory = CATEGORY_MAP[newCategory];
    }

    if (!FINAL_CATEGORIES.includes(newCategory)) {
      console.log(
        `⚠ [${doc.id}] Invalid category "${data.category}" → setting to "Cultural Goods & Handmade Items"`
      );
      newCategory = "Cultural Goods & Handmade Items";
    }

    /* -----------------------------------------------------
       FIX COMMUNITY SELLER FLAG
    ------------------------------------------------------ */
    const newCommunity = data.isCommunitySeller ? true : false;

    /* -----------------------------------------------------
       SANITIZE COORDINATES
    ------------------------------------------------------ */

    const lat = Number(data.latitude);
    const lng = Number(data.longitude);

    const cleanLat =
      Number.isFinite(lat) && Math.abs(lat) <= 90 ? lat : null;

    const cleanLng =
      Number.isFinite(lng) && Math.abs(lng) <= 180 ? lng : null;

    /* -----------------------------------------------------
       FINAL CLEAN SUBMISSION DOCUMENT
    ------------------------------------------------------ */

    const cleanData = {
      name: data.name ?? "",
      owner: data.owner ?? "",
      category: newCategory,
      description: data.description ?? "",
      website: data.website ?? "",
      address: data.address ?? "",
      phone: data.phone ?? "",
      latitude: cleanLat,
      longitude: cleanLng,
      isCommunitySeller: newCommunity,

      // Keep these two ONLY — the admin screen depends on them
      status: data.status ?? "pending",
      createdAt: data.createdAt ?? null,
    };

    /* -----------------------------------------------------
       WRITE BACK
    ------------------------------------------------------ */

    await doc.ref.set(cleanData, { merge: false });
    count++;

    console.log(`✔ Updated submission (${count}): ${cleanData.name}`);
  }

  console.log(`\n🎉 DONE — Cleaned ${count} submission documents.\n`);
  process.exit(0);
})();
