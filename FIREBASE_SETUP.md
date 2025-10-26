# Firebase Setup Instructions

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it "FamilyCircle" (or whatever you want)
4. Disable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In Firebase Console, click "Authentication" in left sidebar
2. Click "Get started"
3. Click "Sign-in method" tab
4. Enable "Email/Password"
5. Click "Save"

## Step 3: Create Realtime Database

1. In Firebase Console, click "Realtime Database" in left sidebar
2. Click "Create Database"
3. Choose location (us-central1 recommended)
4. Start in **"Test mode"** (we'll secure it later)
5. Click "Enable"

## Step 4: Get Firebase Config

1. Click the gear icon (⚙️) next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps"
4. Click the web icon (</>)
5. Register app (name it "FamilyCircle Web")
6. Copy the **firebaseConfig** object

## Step 5: Update Your Code

Create a file `.env` in your project root with this content:

```bash
# Replace these with values from Step 4
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abc123
FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
```

## Step 6: Update Firebase Config in HTML

Open `public/auth.html` and `public/index.html`

Find this section:
```javascript
const firebaseConfig = {
  apiKey: "REPLACE_ME",
  // ... etc
};
```

Replace with your actual config from Step 4.

## Step 7: (Optional) Admin SDK for Server

Only needed for advanced features:

1. In Firebase Console > Project Settings
2. Click "Service accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Save as `serviceAccountKey.json` in project root
6. Update `.env`: `FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json`

## Step 8: Start Your App

```bash
npm start
```

Visit http://localhost:8080/auth.html to create an account!

## Security Rules (After Testing)

Once everything works, secure your database:

1. Go to Realtime Database > Rules
2. Replace with:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid"
      }
    },
    "locations": {
      "$uid": {
        ".read": "auth != null",
        ".write": "$uid === auth.uid"
      }
    },
    "families": {
      ".read": "auth != null",
      "$familyId": {
        ".write": "auth != null"
      }
    }
  }
}
```

3. Click "Publish"

This ensures only authenticated users can read/write their own data.

