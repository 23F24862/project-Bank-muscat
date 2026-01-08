/**
 * Simple Node.js script using Firebase Client SDK (no Admin SDK needed)
 *
 * This script uses the existing Firebase config and requires you to be logged in
 * OR you can modify it to use environment variables for credentials
 *
 * Usage: node scripts/seed-firestore-simple.js
 */

const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  setDoc,
} = require("firebase/firestore");
const { getAuth, createUserWithEmailAndPassword } = require("firebase/auth");

// Your Firebase config (same as firebaseConfig.ts)
const firebaseConfig = {
  apiKey: "AIzaSyBLR_upM3rwGQyVVfFI1kMxGbgZrtZGZkM",
  authDomain: "bank-muscat-4fa06.firebaseapp.com",
  projectId: "bank-muscat-4fa06",
  storageBucket: "bank-muscat-4fa06.firebasestorage.app",
  messagingSenderId: "238133204042",
  appId: "1:238133204042:web:f77625729047be8c8882b3",
  measurementId: "G-GY8DE6GKS2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sample Companies Data
const companies = [
  {
    name: "New Company",
    email: "info@newcomp.com",
    password: "Company@123",
    phone: "+968 2456 7890",
    location: "Muscat, Oman",
    services: ["property", "vehicle"],
    licenseNumber: "VAL-OM-2024-001",
    rating: 4.5,
    totalRatings: 23,
    isApproved: true,
    description:
      "Leading property and vehicle valuation services in Muscat with over 10 years of experience.",
    createdAt: new Date().toISOString(),
  }
];


async function seedCompanies() {
  console.log("🌱 Seeding companies...\n");
  let added = 0;
  let skipped = 0;

  for (const company of companies) {
    try {
      // Check if company already exists in Firestore
      const q = query(
        collection(db, "companies"),
        where("email", "==", company.email)
      );
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        console.log(`⏭️  Skipped: ${company.name} (already exists)`);
        skipped++;
        continue;
      }

      // Create company user in Firebase Auth
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          company.email,
          company.password
        );
        console.log(`✅ Created Auth user: ${company.email}`);
      } catch (authError) {
        if (authError.code === "auth/email-already-in-use") {
          console.log(`⏭️  Auth user exists: ${company.email}`);
          // Try to get existing user - for simplicity, we'll skip if auth exists
          skipped++;
          continue;
        } else {
          throw authError;
        }
      }

      // Prepare company data (remove password before storing in Firestore)
      const { password, ...companyData } = company;

      // Add company to Firestore with user UID reference
      await addDoc(collection(db, "companies"), {
        ...companyData,
        userId: userCredential.user.uid, // Link to auth user
      });

      // Also create user document in users collection with company role
      await setDoc(doc(db, "users", userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: company.email,
        fullName: company.name,
        role: "company",
        phone: company.phone,
        createdAt: new Date().toISOString(),
      });

      console.log(`✅ Added: ${company.name}`);
      added++;
    } catch (error) {
      console.error(`❌ Error adding ${company.name}:`, error.message);
    }
  }

  console.log(`\n📊 Companies: ${added} added, ${skipped} skipped\n`);
  return { added, skipped };
}

async function main() {
  console.log("🚀 Starting Firestore seeding (Client SDK)...\n");
  console.log("=".repeat(50));

  try {
    const companiesResult = await seedCompanies();

    console.log("=".repeat(50));
    console.log("🎉 Seeding completed successfully!\n");
    console.log("📋 Summary:");
    console.log(
      `   Companies: ${companiesResult.added} added, ${companiesResult.skipped} skipped`
    );
    
    if (companiesResult.added > 0) {
      console.log("\n🔑 Company Login Credentials:");
      companies.forEach((company) => {
        console.log(`   Email: ${company.email}`);
        console.log(`   Password: ${company.password}`);
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
