/**
 * Firestore Cleanup Script — FINAL VERSION
 * -----------------------------------------
 * This will:
 *  • Add isCommunitySeller (default false)
 *  • Force categories into the final 6
 *  • Remove unused fields (status, approvedAt, createdAt from old version)
 *  • Overwrite each business document with clean structure
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
   MAP OLD → NEW CATEGORIES
   (Anything old or unknown gets ignored unless listed here)
---------------------------------------------------------- */
const CATEGORY_MAP = {
  "Arts, Crafts & Cultural Goods": "Cultural Goods & Handmade Items",
  "Beadwork, Jewelry & Handmade Goods": "Cultural Goods & Handmade Items",

  "Food, Beverages & Traditional Foods": "Traditional Foods, Crafts & Firewood",

  "Construction, Trades & Home Services": "Business Storefronts & Retail",

  "Professional & Business Services": "Professional Services",

  "Tribal Enterprises & Tribal Programs": "Tribal Enterprises",

  "Community Sellers & Seasonal Vendors": "Cultural Goods & Handmade Items", 
  // All “community sellers” become a tag, not a category
};

/* ---------------------------------------------------------
   START
---------------------------------------------------------- */

(async () => {
  console.log("\n🔥 Starting Firestore business cleanup...\n");

  const ref = db.collection("businesses");
  const snap = await ref.get();

  if (snap.empty) {
    console.log("⚠ No business documents found.");
    process.exit(0);
  }

  let count = 0;

  for (const doc of snap.docs) {
    const data = doc.data();

    /* -----------------------------------------------------
       FIX CATEGORY
    ------------------------------------------------------ */

    let newCategory = data.category || "";

    // Translate old categories → new categories
    if (CATEGORY_MAP[newCategory]) {
      newCategory = CATEGORY_MAP[newCategory];
    }

    // If category is NOT in the final 6, assign fallback
    if (!FINAL_CATEGORIES.includes(newCategory)) {
      console.log(
        `⚠ [${doc.id}] Invalid category "${data.category}" → setting to "Cultural Goods & Handmade Items"`
      );
      newCategory = "Cultural Goods & Handmade Items";
    }

    /* -----------------------------------------------------
       FIX COMMUNITY SELLER TAG
    ------------------------------------------------------ */

    const newCommunity = data.isCommunitySeller ? true : false;

    /* -----------------------------------------------------
       BUILD CLEAN DOCUMENT
    ------------------------------------------------------ */

    const cleanData = {
      name: data.name ?? "",
      owner: data.owner ?? "",
      category: newCategory,
      description: data.description ?? "",
      website: data.website ?? "",
      address: data.address ?? "",
      phone: data.phone ?? "",
      latitude: Number(data.latitude) || 0,
      longitude: Number(data.longitude) || 0,
      isCommunitySeller: newCommunity,
    };

    /* -----------------------------------------------------
       WRITE BACK TO FIRESTORE
    ------------------------------------------------------ */

    await doc.ref.set(cleanData, { merge: false });

    count++;
    console.log(`✔ Updated business (${count}): ${cleanData.name}`);
  }

  console.log(`\n🎉 DONE — Cleaned ${count} business documents.\n`);
  process.exit(0);
})();
