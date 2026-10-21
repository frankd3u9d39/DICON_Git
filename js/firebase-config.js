/**
 * DICON GITH App - Firebase Web SDK Bridge
 * Configurable for live Firebase Auth, Cloud Firestore, and Firebase Storage.
 *
 * TO CONNECT YOUR FIREBASE PROJECT:
 * 1. Go to https://console.firebase.google.com
 * 2. Open Project Settings -> General -> Your Apps -> Add Web App (</>)
 * 3. Copy the keys and replace the values below.
 */

export const firebaseConfig = {
  apiKey: "AIzaSyDSRNyBiaMgdB_SQ6_fRZIjSHiiwmZdQ-s",
  authDomain: "dicon-gith.firebaseapp.com",
  projectId: "dicon-gith",
  storageBucket: "dicon-gith.firebasestorage.app",
  messagingSenderId: "325069458194",
  appId: "1:325069458194:web:11c2294565c6a03d1e01cb",
  measurementId: "G-CVTF3PPV8Q"
};

export class FirebaseService {
  constructor() {
    this.isLiveConnected = false;
    this.auth = null;
    this.db = null;
    this.storage = null;
  }

  async initLive() {
    try {
      // Check if real API key is configured (not dummy)
      const hasRealCredentials = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes("DUMMY");

      if (window.firebase && window.firebase.initializeApp && hasRealCredentials) {
        if (!window.firebase.apps.length) {
          window.firebase.initializeApp(firebaseConfig);
        }
        this.auth = window.firebase.auth();
        this.db = window.firebase.firestore();
        this.storage = window.firebase.storage();
        this.isLiveConnected = true;
        console.log("Firebase Live Connected to project:", firebaseConfig.projectId);
      } else {
        console.log("Firebase initialized in Local Client Mode (ready for credentials).");
      }
    } catch (e) {
      console.warn("Firebase running in resilient offline/client mode:", e.message);
    }
  }

  // Live Auth methods
  async register(email, password) {
    if (this.isLiveConnected && this.auth) {
      const cred = await this.auth.createUserWithEmailAndPassword(email, password);
      await cred.user.sendEmailVerification();
      return cred.user;
    }
    return null;
  }

  async login(email, password) {
    if (this.isLiveConnected && this.auth) {
      const cred = await this.auth.signInWithEmailAndPassword(email, password);
      return cred.user;
    }
    return null;
  }

  async logout() {
    if (this.isLiveConnected && this.auth) {
      await this.auth.signOut();
    }
  }

  // Live Firestore methods
  async saveUserDoc(uid, userData) {
    if (this.isLiveConnected && this.db) {
      await this.db.collection('users').doc(uid).set(userData, { merge: true });
    }
  }

  async saveInnovationDoc(innovationId, data) {
    if (this.isLiveConnected && this.db) {
      await this.db.collection('innovations').doc(innovationId).set(data, { merge: true });
    }
  }

  async uploadFile(path, file) {
    if (this.isLiveConnected && this.storage) {
      const ref = this.storage.ref(path);
      const snapshot = await ref.put(file);
      return await snapshot.ref.getDownloadURL();
    }
    return null;
  }

  async getSetting(key) {
    if (this.isLiveConnected && this.db) {
      const doc = await this.db.collection('settings').doc(key).get();
      return doc.exists ? doc.data() : null;
    }
    return null;
  }

  async saveSetting(key, data) {
    if (this.isLiveConnected && this.db) {
      await this.db.collection('settings').doc(key).set({
        ...data,
        updatedAt: window.firebase?.firestore?.FieldValue?.serverTimestamp() || new Date().toISOString()
      }, { merge: true });
    }
  }
}

export const firebaseService = new FirebaseService();
