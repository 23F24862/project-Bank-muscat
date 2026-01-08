/**
 * Simple Node.js script to seed Firestore with companies and admin users
 *
 * Usage:
 *   1. Install firebase-admin: npm install firebase-admin
 *   2. Get your service account key from Firebase Console
 *   3. Place serviceAccountKey.json in the root directory
 *   4. Run: node scripts/seed-firestore.js
 *
 * OR use the simpler version below that uses client SDK
 */

const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin
// Option 1: Using service account key file
try {
  const serviceAccount = require("../serviceAccountKey.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "bankmuscat-7b75c",
  });
} catch (error) {
  console.error("Error: Could not find serviceAccountKey.json");
  console.log("\nTo use this script:");
  console.log(
    "1. Go to Firebase Console > Project Settings > Service Accounts"
  );
  console.log('2. Click "Generate new private key"');
  console.log("3. Save as serviceAccountKey.json in project root");
  console.log("4. Run: node scripts/seed-firestore.js\n");
  process.exit(1);
}

const db = admin.firestore();
const auth = admin.auth();

// Sample Companies Data
const companies = [
  {
    name: "Al Madina Valuation Services",
    email: "info@almadinavaluation.com",
    phone: "+968 2456 7890",
    location: "Muscat, Oman",
    services: ["property", "vehicle"],
    licenseNumber: "VAL-OM-2024-001",
    rating: 4.5,
    totalRatings: 23,
    isApproved: true,
    description:
      "Leading property and vehicle valuation services in Muscat with over 10 years of experience.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    name: "Oman Property Experts",
    email: "contact@omanpropertyexperts.com",
    phone: "+968 2456 7891",
    location: "Seeb, Oman",
    services: ["property"],
    licenseNumber: "VAL-OM-2024-002",
    rating: 4.8,
    totalRatings: 45,
    isApproved: true,
    description:
      "Specialized in residential and commercial property valuations across Oman.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    name: "Gulf Appraisal Services",
    email: "info@gulfappraisal.com",
    phone: "+968 2456 7892",
    location: "Muscat, Oman",
    services: ["vehicle"],
    licenseNumber: "VAL-OM-2024-003",
    rating: 4.3,
    totalRatings: 18,
    isApproved: true,
    description:
      "Expert vehicle appraisal services for all types of automobiles.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    name: "Premium Valuation Co.",
    email: "hello@premiumvaluation.com",
    phone: "+968 2456 7893",
    location: "Al Khuwair, Oman",
    services: ["property", "vehicle"],
    licenseNumber: "VAL-OM-2024-004",
    rating: 4.7,
    totalRatings: 32,
    isApproved: true,
    description:
      "Comprehensive valuation services for both property and vehicles with certified appraisers.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    name: "Auto Appraisal Center",
    email: "contact@autoappraisal.com",
    phone: "+968 2456 7894",
    location: "Salalah, Oman",
    services: ["vehicle"],
    licenseNumber: "VAL-OM-2024-005",
    rating: 4.6,
    totalRatings: 28,
    isApproved: true,
    description: "Professional vehicle appraisal services in Salalah region.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
  {
    name: "Oman Real Estate Valuers",
    email: "info@omanrealestatevaluers.com",
    phone: "+968 2456 7895",
    location: "Nizwa, Oman",
    services: ["property"],
    licenseNumber: "VAL-OM-2024-006",
    rating: 4.4,
    totalRatings: 19,
    isApproved: true,
    description:
      "Trusted property valuation experts serving Nizwa and surrounding areas.",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  },
];

// Sample Admin Users Data
const admins = [
  {
    email: "admin@bankmuscat.com",
    password: "Admin@123",
    fullName: "ٌRiham Al Baloushi",
    role: "admin",
    phone: "+968 2456 0001",
  },
  {
    email: "admin2@bankmuscat.com",
    password: "Admin@123",
    fullName: "Fatima Al-Zahra",
    role: "admin",
    phone: "+968 2456 0002",
  },
];

async function seedCompanies() {
  console.log("🌱 Seeding companies...\n");
  let added = 0;
  let skipped = 0;

  for (const company of companies) {
    try {
      // Check if company already exists
      const snapshot = await db
        .collection("companies")
        .where("email", "==", company.email)
        .get();

      if (!snapshot.empty) {
        console.log(`⏭️  Skipped: ${company.name} (already exists)`);
        skipped++;
        continue;
      }

      // Add company
      await db.collection("companies").add(company);
      console.log(`✅ Added: ${company.name}`);
      added++;
    } catch (error) {
      console.error(`❌ Error adding ${company.name}:`, error.message);
    }
  }

  console.log(`\n📊 Companies: ${added} added, ${skipped} skipped\n`);
  return { added, skipped };
}

async function seedAdmins() {
  console.log("🌱 Seeding admin users...\n");
  let added = 0;
  let skipped = 0;

  for (const adminData of admins) {
    try {
      // Check if user already exists in Auth
      let user;
      try {
        user = await auth.getUserByEmail(adminData.email);
        console.log(`⏭️  Auth user exists: ${adminData.email}`);
      } catch (error) {
        if (error.code === "auth/user-not-found") {
          // Create user in Firebase Auth
          user = await auth.createUser({
            email: adminData.email,
            password: adminData.password,
            displayName: adminData.fullName,
          });
          console.log(`✅ Created Auth user: ${adminData.email}`);
        } else {
          throw error;
        }
      }

      // Check if user data exists in Firestore
      const userDoc = await db.collection("users").doc(user.uid).get();

      if (userDoc.exists) {
        console.log(
          `⏭️  Skipped Firestore data: ${adminData.email} (already exists)`
        );
        skipped++;
        continue;
      }

      // Add user data to Firestore
      await db.collection("users").doc(user.uid).set({
        uid: user.uid,
        email: adminData.email,
        fullName: adminData.fullName,
        role: adminData.role,
        phone: adminData.phone,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Added Firestore data: ${adminData.fullName}`);
      added++;
    } catch (error) {
      console.error(`❌ Error adding admin ${adminData.email}:`, error.message);
    }
  }

  console.log(`\n📊 Admins: ${added} added, ${skipped} skipped\n`);
  return { added, skipped };
}

async function main() {
  console.log("🚀 Starting Firestore seeding...\n");
  console.log("=".repeat(50));

  try {
    const companiesResult = await seedCompanies();
    const adminsResult = await seedAdmins();

    console.log("=".repeat(50));
    console.log("🎉 Seeding completed successfully!\n");
    console.log("📋 Summary:");
    console.log(
      `   Companies: ${companiesResult.added} added, ${companiesResult.skipped} skipped`
    );
    console.log(
      `   Admins: ${adminsResult.added} added, ${adminsResult.skipped} skipped`
    );

    if (adminsResult.added > 0) {
      console.log("\n🔑 Admin Login Credentials:");
      admins.forEach((admin) => {
        console.log(`   Email: ${admin.email}`);
        console.log(`   Password: ${admin.password}`);
      });
    }

    console.log("\n");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
