# ✅ Setup Checklist

Follow this checklist to get FamilyCircle running!

## 🔥 Firebase Setup

- [ ] 1. Go to https://console.firebase.google.com/
- [ ] 2. Click "Add project"
- [ ] 3. Name it "FamilyCircle" (or whatever you want)
- [ ] 4. Create project (disable Analytics if asked)
- [ ] 5. Click "Authentication" in left sidebar
- [ ] 6. Click "Get started"
- [ ] 7. Click "Sign-in method" tab
- [ ] 8. Enable "Email/Password"
- [ ] 9. Save
- [ ] 10. Click "Realtime Database" in left sidebar
- [ ] 11. Click "Create Database"
- [ ] 12. Choose location (us-central1)
- [ ] 13. Start in **"Test mode"** (important!)
- [ ] 14. Enable
- [ ] 15. Click ⚙️ icon (Project settings)
- [ ] 16. Scroll down to "Your apps"
- [ ] 17. Click web icon (</>)
- [ ] 18. Register app (name: "FamilyCircle Web")
- [ ] 19. **COPY the firebaseConfig object** (you'll need this!)

## 💻 Code Setup

- [ ] 20. Open `public/auth.html` in your editor
- [ ] 21. Find line ~215 (search for "firebaseConfig")
- [ ] 22. Replace the placeholder values with your Firebase config
- [ ] 23. Save the file
- [ ] 24. Open `public/index.html` in your editor
- [ ] 25. Find line ~574 (search for "firebaseConfig")
- [ ] 26. Replace with the SAME Firebase config
- [ ] 27. Save the file

## 🚀 Run the App

- [ ] 28. Open Terminal
- [ ] 29. Run: `cd /Users/will/Documents/calhacksv2`
- [ ] 30. Run: `export PATH="$PWD/node-v18.18.0-darwin-arm64/bin:$PATH"`
- [ ] 31. Run: `npm start`
- [ ] 32. See "FamilyCircle running on http://localhost:3000"

## 🧪 Test It

- [ ] 33. Open browser
- [ ] 34. Visit: http://localhost:3000/auth.html
- [ ] 35. Click "Sign Up" tab
- [ ] 36. Enter your name
- [ ] 37. Enter your email
- [ ] 38. Enter password (6+ characters)
- [ ] 39. Click "Create Account"
- [ ] 40. Click "Allow" when browser asks for location
- [ ] 41. Wait for redirect to map
- [ ] 42. See yourself on the map! 🎉
- [ ] 43. Wait 30 seconds - location should update
- [ ] 44. Check browser console (F12) - should see "Location updated" messages

## 👥 Test with Friend (Same WiFi)

- [ ] 45. In Terminal, run: `ipconfig getifaddr en0`
- [ ] 46. Note your IP (e.g., 192.168.1.5)
- [ ] 47. Friend opens browser
- [ ] 48. Friend visits: http://YOUR_IP:3000/auth.html
- [ ] 49. Friend creates their account
- [ ] 50. Both of you should see each other on the map! 🎉

## 🌍 Deploy for Real Use (Optional)

- [ ] 51. Push code to GitHub
- [ ] 52. Go to render.com
- [ ] 53. Create account
- [ ] 54. "New +" → "Web Service"
- [ ] 55. Connect GitHub repo
- [ ] 56. Build: `npm install`
- [ ] 57. Start: `npm start`
- [ ] 58. Deploy!
- [ ] 59. Get your URL (e.g., https://familycircle.onrender.com)
- [ ] 60. Share with family anywhere in the world!

## 🔒 Secure Firebase (After Testing)

- [ ] 61. Go to Firebase Console
- [ ] 62. Realtime Database → Rules
- [ ] 63. Copy rules from FIREBASE_SETUP.md
- [ ] 64. Publish rules
- [ ] 65. Test that auth still works

---

## ✅ Done!

Once you complete steps 1-44, your app is fully functional!

**Steps 45-50** are for testing with a friend on same WiFi.

**Steps 51-60** are for deploying so it works from different locations.

**Steps 61-65** are for securing your database after testing.

---

## 🐛 If You Get Stuck

**Problem: Firebase config error**
- Did you replace the config in BOTH files?
- Did you copy the entire config object?
- Check for typos in the Firebase keys

**Problem: Location not working**
- Did you click "Allow" for location?
- Check browser console for errors
- Try a different browser (Chrome works best)

**Problem: npm not found**
- Did you run the export PATH command?
- Make sure you're in the right directory

**Problem: Friend can't connect**
- Same WiFi network?
- Using IP address, not "localhost"?
- Firewall blocking port 8080?

---

## 📚 Need Help?

- Read `QUICK_START.md` for quick instructions
- Read `FIREBASE_SETUP.md` for detailed Firebase help
- Read `README.md` for full documentation
- Check browser console (F12) for error messages

---

**You got this! 🚀**

