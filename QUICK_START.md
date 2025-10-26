# 🚀 Quick Start Guide

## Get Running in 5 Minutes!

### Step 1: Create Firebase Project (2 minutes)

1. Go to https://console.firebase.google.com/
2. Click "Add project" → Name it "FamilyCircle" → Create
3. Click "Authentication" → "Get started" → Enable "Email/Password"
4. Click "Realtime Database" → "Create Database" → Start in **test mode**
5. Click ⚙️ → Project settings → Scroll down → Click Web icon (</>)
6. Register app → **Copy the firebaseConfig**

### Step 2: Update Your Code (1 minute)

**Open `public/auth.html`** and find this (around line 215):
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDEMO_KEY_REPLACE_THIS",  // REPLACE THIS
  // ... etc
};
```

**Replace** with your config from Step 1.

**Do the same** in `public/index.html` (around line 574).

### Step 3: Run the App (1 minute)

```bash
cd /Users/will/Documents/calhacksv2
export PATH="$PWD/node-v18.18.0-darwin-arm64/bin:$PATH"
npm start
```

### Step 4: Create Account (1 minute)

1. Open **http://localhost:3000/auth.html**
2. Click "Sign Up"
3. Enter name, email, password
4. Click "Allow" for location permission
5. See yourself on the map! 🎉

---

## Test with Your Friend

### Same Room (Same WiFi):

1. Find your IP:
   ```bash
   ipconfig getifaddr en0  # Mac
   # Result: 192.168.1.5 (example)
   ```

2. Friend opens: **http://192.168.1.5:3000/auth.html**
3. Friend creates account
4. Both see each other in real-time! 🎉

### Different Locations:

Deploy to Render.com (see README.md)

---

## Troubleshooting

**Location not working?**
- Click "Allow" when browser asks
- Check browser console for errors

**Firebase error?**
- Did you update the config in BOTH files?
- Did you enable Email/Password auth in Firebase?
- Did you create Realtime Database in test mode?

**Friend can't connect?**
- Same WiFi network?
- Using your IP, not localhost?
- Firewall blocking port 3000?

---

## What's Next?

- Read `FIREBASE_SETUP.md` for detailed Firebase security setup
- Read `README.md` for deployment instructions
- Test with family members!

Enjoy FamilyCircle! 👥📍

