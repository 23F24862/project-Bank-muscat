# Seed Data Scripts

This directory contains scripts to seed Firestore with sample companies and admin users.

## Option 1: Simple Script (Recommended - No Admin SDK needed)

**File:** `scripts/seed-firestore-simple.js`

This script uses the Firebase Client SDK (already installed) and directly inserts data.

### Usage:

```bash
npm run seed
```

or

```bash
node scripts/seed-firestore-simple.js
```

**Note:** This script will create admin users in Firebase Auth. Make sure you have proper Firestore security rules set up.

---

## Option 2: Admin SDK Script (More secure)

**File:** `scripts/seed-firestore.js`

This script uses Firebase Admin SDK which is better for server-side operations.

### Setup:

1. Install Firebase Admin SDK:

   ```bash
   npm install firebase-admin
   ```

2. Get your service account key:

   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project: `bankmuscat-7b75c`
   - Go to **Project Settings** > **Service Accounts**
   - Click **Generate new private key**
   - Save the JSON file as `serviceAccountKey.json` in the project root
   - **Important:** Add `serviceAccountKey.json` to `.gitignore`!

3. Run the script:
   ```bash
   node scripts/seed-firestore.js
   ```

---

## What gets seeded:

### Companies (6 companies):

- Al Madina Valuation Services
- Oman Property Experts
- Gulf Appraisal Services
- Premium Valuation Co.
- Auto Appraisal Center
- Oman Real Estate Valuers

### Admin Users (2 admins):

- **Email:** admin@bankmuscat.com  
  **Password:** Admin@123
- **Email:** admin2@bankmuscat.com  
  **Password:** Admin@123

---

## Features:

- ✅ Checks for existing data (won't duplicate)
- ✅ Creates Firebase Auth users for admins
- ✅ Adds user data to Firestore
- ✅ Adds company data to Firestore
- ✅ Shows summary of what was added/skipped
- ✅ Displays admin login credentials

---

## Troubleshooting:

### Error: "Could not find serviceAccountKey.json"

- Use Option 1 (simple script) instead, or
- Follow the setup steps for Option 2

### Error: "Permission denied"

- Check your Firestore security rules
- Make sure you're authenticated (for simple script)
- Use Admin SDK script for better permissions

### Error: "Email already in use"

- This is normal - the script skips existing users
- Check the summary output to see what was added/skipped

---

## Security Note:

⚠️ **Never commit `serviceAccountKey.json` to version control!**

Add to `.gitignore`:

```
serviceAccountKey.json
```
