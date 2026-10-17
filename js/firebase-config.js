/**
 * DICON GITH App - Firebase Web SDK Bridge
 * Configurable for live Firebase Auth, Cloud Firestore, and Storage.
 */

export const firebaseConfig = {
  apiKey: "AIzaSyDUMMY_KEY_FOR_LOCAL_AND_DEMO_TESTING",
  authDomain: "dicon-gith.firebaseapp.com",
  projectId: "dicon-gith",
  storageBucket: "dicon-gith.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

export class FirebaseService {
  constructor() {
    this.isLiveConnected = false;
  }

  // Hook for live Firebase when production credentials are provided
  async initLive() {
    try {
      if (window.firebase && window.firebase.initializeApp) {
        window.firebase.initializeApp(firebaseConfig);
        this.isLiveConnected = true;
        console.log("Firebase Live Initialized");
      }
    } catch (e) {
      console.warn("Firebase running in resilient offline/client-store mode:", e.message);
    }
  }
}

export const firebaseService = new FirebaseService();
