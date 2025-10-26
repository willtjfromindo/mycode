# FamilyCircle - Real-Time Family Location Tracking

A real-time family location sharing app with crime risk assessment powered by SF Open Data.

## ✨ Features

- 🔐 **Firebase Authentication** - Secure user login/signup
- 📍 **Real-Time Location Tracking** - See family members' locations update every 30 seconds
- 🗺️ **Interactive Map** - Visual display with Leaflet/OpenStreetMap
- ⚠️ **Crime Risk Scores** - Real-time safety assessment based on SF crime data
- 🔴 **Risk Circles** - Color-coded safety zones around each family member
- 📱 **Works on Laptops** - Uses WiFi positioning for location tracking
- 🚀 **Instant Updates** - Firebase Realtime Database syncs locations across all devices

## 🚀 Quick Start

### Prerequisites

- Node.js v18+ (included in `node-v18.18.0-darwin-arm64/`)
- A Firebase account (free tier is sufficient)

### Step 1: Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project called "FamilyCircle"
3. Enable these services:
   - **Authentication** → Email/Password
   - **Realtime Database** → Start in test mode
4. Get your config:
   - Project Settings → Your apps → Web app
   - Copy the `firebaseConfig` object

### Step 2: Update Firebase Config

Update the Firebase config in **TWO files**:

**File 1: `public/auth.html`** (around line 215)
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  databaseURL: "https://your-project-default-rtdb.firebaseio.com"
};
```

**File 2: `public/index.html`** (around line 574)
```javascript
// Same config as above
const firebaseConfig = { ... };
```

### Step 3: Run the App

```bash
# Navigate to project directory
cd /Users/will/Documents/calhacksv2

# Set up PATH to use local Node.js
export PATH="$PWD/node-v18.18.0-darwin-arm64/bin:$PATH"

# Start the server
npm start
```

Visit **http://localhost:3000/auth.html** to create an account!

## 📱 How to Use

### For You (First User)

1. Open http://localhost:8080/auth.html
2. Click "Sign Up"
3. Enter your name, email, and password
4. Click "Allow" when browser asks for location permission
5. You'll see the map with your location and risk score!

### For Your Friend (Second User)

**Option A: Same WiFi (Testing)**
1. Find your computer's IP address:
   ```bash
   # On Mac:
   ipconfig getifaddr en0
   
   # Example result: 192.168.1.5
   ```
2. Friend visits: `http://192.168.1.5:8080/auth.html`
3. Friend creates their own account
4. Both of you will see each other on the map in real-time!

**Option B: Different Locations (Production)**
- You need to deploy the app to the web (see Deployment section below)

## 🔐 Firebase Security Rules

After testing, secure your database:

1. Go to Realtime Database → Rules
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
    }
  }
}
```

## 🌍 Deployment (To Work from Anywhere)

### Option 1: Render.com (Recommended - FREE)

1. Push your code to GitHub
2. Go to [render.com](https://render.com)
3. Click "New +" → "Web Service"
4. Connect your GitHub repo
5. Settings:
   - Build Command: `npm install`
   - Start Command: `npm start`
6. Deploy!
7. Your app will be live at `https://your-app.onrender.com`

### Option 2: Railway.app ($5/month)

1. Push to GitHub
2. Go to [railway.app](https://railway.app)
3. "New Project" → Import from GitHub
4. Deploy automatically!

### Option 3: Firebase Hosting (FREE)

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## 📊 How It Works

### Location Tracking

1. Browser Geolocation API gets your laptop's location (using WiFi positioning)
2. Location is sent to Firebase Realtime Database
3. Server calculates crime risk score using SF Open Data API
4. Risk score is saved to Firebase
5. All family members' apps receive real-time updates
6. Map and sidebar update automatically

### Crime Risk Calculation

- Fetches last 180 days of SF crime data
- Calculates weighted risk score based on:
  - Crime severity (Homicide = 100, Theft = 25, etc.)
  - Recency (recent crimes weighted higher)
  - Time of day (night crimes weighted higher)
  - Density (crimes per square mile)
- Updates every time a user's location changes

### Real-Time Sync

```
User A's Laptop → Firebase → User B's Laptop
    ↓                           ↓
Location Update           Instant notification
    ↓                           ↓
Risk Calculated           Map updates automatically
```

## 🐛 Troubleshooting

### "Location access denied"
- Browser Settings → Privacy → Location
- Allow location access for `localhost`

### "Firebase not configured"
- Make sure you updated the `firebaseConfig` in both `auth.html` and `index.html`
- Check that you enabled Authentication and Realtime Database in Firebase Console

### "Crime data not loading"
- The SF Open Data API might be slow
- Wait 10-15 seconds for initial load
- Check console for errors

### "Friend can't access my app"
- Make sure you're on the same WiFi network
- Use your computer's local IP, not `localhost`
- Check firewall settings

### "Location not updating"
- Check browser console for errors
- Make sure location permission is granted
- Try refreshing the page

## 📁 Project Structure

```
calhacksv2/
├── public/
│   ├── index.html       # Main map interface
│   └── auth.html        # Login/signup page
├── server.js            # Express server
├── firebase-config.js   # Firebase Admin SDK setup
├── package.json         # Dependencies
├── FIREBASE_SETUP.md    # Detailed Firebase setup guide
└── README.md            # This file
```

## 🔧 Technical Stack

- **Frontend**: HTML, CSS, JavaScript
- **Map**: Leaflet.js + OpenStreetMap
- **Backend**: Node.js + Express
- **Database**: Firebase Realtime Database
- **Authentication**: Firebase Auth
- **Crime Data**: SF Open Data API
- **Geolocation**: Browser Geolocation API

## ⚠️ Known Limitations

1. **Location accuracy**: WiFi positioning is accurate to 20-100 meters
2. **Battery usage**: Location updates every 30 seconds (adjust in code if needed)
3. **Browser must stay open**: Location stops updating when tab/browser closes
4. **SF only**: Crime data is only for San Francisco
5. **Same WiFi for testing**: Friends must deploy to web for different locations

## 🎯 Future Enhancements

- [ ] Native mobile app (background tracking)
- [ ] Push notifications for high-risk areas
- [ ] Family group management (invite codes)
- [ ] Custom location check-ins
- [ ] Historical location trails
- [ ] Geofencing alerts
- [ ] More cities (beyond SF)
- [ ] Google Maps integration (cleaner UI)

## 📄 License

MIT License - Feel free to use for personal projects!

## 🤝 Credits

- Crime data: [SF Open Data](https://data.sfgov.org/)
- Maps: [OpenStreetMap](https://www.openstreetmap.org/)
- Icons: Emoji

---

Built with ❤️ for Cal Hacks

