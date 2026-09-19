// ============================================
// CO.CA. — Firebase Configuration
// Replace placeholder values with your Firebase project credentials
// ============================================

// INSTRUCTIONS:
// 1. Go to https://console.firebase.google.com/
// 2. Create a new project (or use existing)
// 3. Add a Web App (click the </> icon)
// 4. Copy your config values below
// 5. Enable Firestore Database in the Firebase Console
//    - Go to Build > Firestore Database > Create Database
//    - Choose "Start in test mode" for development
//    - Select your preferred region (e.g., europe-west1)

import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js';
import { initializeFirestore, persistentLocalCache } from 'https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyC1p1r77x0PayHI4xiIev_s_nR8NPNQ8G4",
  authDomain: "coca-staff.firebaseapp.com",
  projectId: "coca-staff",
  storageBucket: "coca-staff.firebasestorage.app",
  messagingSenderId: "601026316954",
  appId: "1:601026316954:web:27afd0f7be24a79f922d23",
  measurementId: "G-DYXM9ZQ4C6"
};

// Initialize Firebase with Offline Persistence (PWA)
const firebaseApp = initializeApp(firebaseConfig);
const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache()
});

export { db, firebaseApp };

// ============================================
// FIRESTORE SECURITY RULES (paste in Firebase Console > Firestore > Rules):
// ============================================
//
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     // Allow read/write to all users (no auth required for username-only login)
//     match /capi/{document=**} {
//       allow read, write: if true;
//     }
//     match /proposte/{document=**} {
//       allow read, write: if true;
//     }
//   }
// }
//
// ⚠️ WARNING: These rules allow anyone to read/write.
// For production, consider adding more restrictive rules.
// ============================================
