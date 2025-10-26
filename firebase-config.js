// Firebase Admin SDK Configuration (Server-side)
require('dotenv').config();
const admin = require('firebase-admin');
const fs = require('fs');

let firebaseAdmin = null;

function initializeFirebaseAdmin() {
  try {
    // Check if already initialized
    if (firebaseAdmin) {
      return firebaseAdmin;
    }

    // Try to load service account from file
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      const serviceAccount = require(serviceAccountPath);
      
      firebaseAdmin = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
      
      console.log('✅ Firebase Admin initialized with service account');
    } else {
      // Fallback: Initialize without admin SDK (client SDK only)
      console.log('⚠️ Firebase Admin SDK not configured (service account missing)');
      console.log('   Client-side authentication will still work');
      console.log('   To enable admin features, add serviceAccountKey.json');
      firebaseAdmin = null;
    }
    
    return firebaseAdmin;
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error.message);
    return null;
  }
}

module.exports = {
  initializeFirebaseAdmin,
  getFirebaseAdmin: () => firebaseAdmin
};

