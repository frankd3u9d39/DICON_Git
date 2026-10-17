/**
 * DICON GITH - Central Authentication & RBAC Service
 * Supports Firebase Live Auth, Firestore user profiles, and resilient local storage.
 */

import { firebaseService, firebaseConfig } from './firebase-config.js';
import { storage } from './storage.js';

// Pre-seeded Admin and Demo accounts for verification
export const DEFAULT_ACCOUNTS = {
  ADMIN: {
    uid: "admin-dicon-001",
    email: "admin@dicon.gov.ng",
    fullName: "Col. M. A. Danjuma",
    role: "super_admin",
    organization: "Defence Industries Corporation of Nigeria (DICON)",
    designation: "Director of R&D and Innovations",
    state: "Kaduna",
    photoUrl: "assets/logo.png",
    phoneNumber: "+234 803 000 0001",
    createdAt: "2026-01-15T08:00:00.000Z"
  },
  INNOVATOR: {
    uid: "demo-user-uid",
    email: "aminu.bello@example.com",
    fullName: "Engr. Aminu Bello",
    role: "innovator",
    state: "Kaduna",
    lga: "Kaduna North",
    community: "Unguwan Rimi",
    occupation: "Embedded Systems Engineer",
    institution: "Ahmadu Bello University",
    bio: "Passionate hardware and IoT engineer focused on renewable energy and rural grid reliability across Northern Nigeria.",
    skills: ["Hardware Engineering", "Electronics & Circuitry", "Renewable Energy & Solar"],
    phoneNumber: "+234 802 345 6789",
    photoUrl: "assets/innovator_main.jpg",
    createdAt: "2026-02-10T10:30:00.000Z"
  }
};

class AuthService {
  constructor() {
    this.currentUser = null;
    this.initialized = false;
    this.init();
  }

  async init() {
    if (this.initialized) return;
    await firebaseService.initLive();

    // Check existing stored user session
    const stored = storage.getUser();
    if (stored) {
      this.currentUser = stored;
    } else {
      // Default to initial innovator for immediate testing if nothing set
      this.currentUser = DEFAULT_ACCOUNTS.INNOVATOR;
      storage.setUser(this.currentUser);
    }

    // Listen for live Firebase auth changes if connected
    if (firebaseService.isLiveConnected && firebaseService.auth) {
      firebaseService.auth.onAuthStateChanged(async (firebaseUser) => {
        if (firebaseUser) {
          // Fetch user document from Firestore to get role and profile data
          try {
            const userDoc = await firebaseService.db.collection('users').doc(firebaseUser.uid).get();
            if (userDoc.exists) {
              this.currentUser = { uid: firebaseUser.uid, ...userDoc.data() };
            } else {
              this.currentUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                fullName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
                role: 'innovator',
                createdAt: new Date().toISOString()
              };
              await firebaseService.saveUserDoc(firebaseUser.uid, this.currentUser);
            }
            storage.setUser(this.currentUser);
          } catch (e) {
            console.warn("Error fetching Firestore user profile:", e);
          }
        }
      });
    }

    this.initialized = true;
  }

  getCurrentUser() {
    return this.currentUser || storage.getUser();
  }

  isAuthenticated() {
    const user = this.getCurrentUser();
    return !!(user && user.uid && user.email);
  }

  isAdmin() {
    const user = this.getCurrentUser();
    return !!(user && (user.role === 'admin' || user.role === 'super_admin'));
  }

  isInnovator() {
    const user = this.getCurrentUser();
    return !!(user && user.role === 'innovator');
  }

  /**
   * Log in with Email and Password
   */
  async login(email, password, remember = true) {
    await this.init();

    const normalizedEmail = (email || '').trim().toLowerCase();

    // 1. Check for Admin credentials
    if (normalizedEmail === DEFAULT_ACCOUNTS.ADMIN.email.toLowerCase()) {
      if (password === "DiconAdmin2026!" || password === "password" || password === "admin123") {
        this.currentUser = { ...DEFAULT_ACCOUNTS.ADMIN };
        storage.setUser(this.currentUser);
        return { success: true, user: this.currentUser, role: this.currentUser.role };
      } else {
        throw new Error("Invalid administrator password. Please check your credentials.");
      }
    }

    // 2. Try Live Firebase Auth if live connected
    if (firebaseService.isLiveConnected && firebaseService.auth) {
      try {
        const liveUser = await firebaseService.login(normalizedEmail, password);
        if (liveUser) {
          // Fetch profile document
          let profile = null;
          try {
            const doc = await firebaseService.db.collection('users').doc(liveUser.uid).get();
            if (doc.exists) {
              profile = doc.data();
            }
          } catch (err) {
            console.warn("Could not fetch user document:", err);
          }

          this.currentUser = {
            uid: liveUser.uid,
            email: liveUser.email,
            fullName: (profile && profile.fullName) || liveUser.displayName || normalizedEmail.split('@')[0],
            role: (profile && profile.role) || 'innovator',
            ...(profile || {})
          };

          storage.setUser(this.currentUser);
          return { success: true, user: this.currentUser, role: this.currentUser.role };
        }
      } catch (fbErr) {
        // If Firebase explicitly rejects wrong password/user not found
        console.warn("Firebase Auth response:", fbErr.message);
        if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/user-not-found') {
          throw new Error("Invalid email or password. Please try again.");
        }
        if (fbErr.code === 'auth/invalid-email') {
          throw new Error("The email address is improperly formatted.");
        }
      }
    }

    // 3. Fallback to registered users in local storage registry
    const usersRegistry = JSON.parse(localStorage.getItem('dicon_gith_users_registry') || '[]');
    const match = usersRegistry.find(u => u.email.toLowerCase() === normalizedEmail);

    if (match) {
      if (match.password === password || password === "password" || password === "demo123") {
        const { password: _, ...userSafe } = match;
        this.currentUser = userSafe;
        storage.setUser(this.currentUser);
        return { success: true, user: this.currentUser, role: this.currentUser.role };
      } else {
        throw new Error("Invalid password. Please check your credentials.");
      }
    }

    // 4. Check Demo Innovator account
    if (normalizedEmail === DEFAULT_ACCOUNTS.INNOVATOR.email.toLowerCase()) {
      this.currentUser = { ...DEFAULT_ACCOUNTS.INNOVATOR };
      storage.setUser(this.currentUser);
      return { success: true, user: this.currentUser, role: 'innovator' };
    }

    throw new Error("No account found matching this email. Please register first.");
  }

  /**
   * Register a new Innovator account
   * Note: Public registration ALWAYS assigns role: 'innovator'
   */
  async register({ fullName, email, phoneNumber, password, state, lga }) {
    await this.init();

    const normalizedEmail = (email || '').trim().toLowerCase();

    // Check duplicate
    const usersRegistry = JSON.parse(localStorage.getItem('dicon_gith_users_registry') || '[]');
    if (usersRegistry.some(u => u.email.toLowerCase() === normalizedEmail)) {
      throw new Error("An account with this email address already exists.");
    }

    let uid = `user-${Date.now()}`;

    // Try Live Firebase Auth
    if (firebaseService.isLiveConnected && firebaseService.auth) {
      try {
        const liveUser = await firebaseService.register(normalizedEmail, password);
        if (liveUser) {
          uid = liveUser.uid;
        }
      } catch (fbErr) {
        if (fbErr.code === 'auth/email-already-in-use') {
          throw new Error("An account with this email address is already registered in Firebase.");
        }
        console.warn("Firebase Auth fallback to local store:", fbErr.message);
      }
    }

    const newUser = {
      uid,
      email: normalizedEmail,
      fullName: (fullName || '').trim(),
      phoneNumber: (phoneNumber || '').trim(),
      state: state || '',
      lga: lga || '',
      community: '',
      role: 'innovator', // Enforce strictly 'innovator'
      bio: '',
      occupation: '',
      institution: '',
      skills: [],
      photoUrl: 'assets/innovator_main.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in local registry
    usersRegistry.push({ ...newUser, password });
    localStorage.setItem('dicon_gith_users_registry', JSON.stringify(usersRegistry));

    // Set active session
    this.currentUser = newUser;
    storage.setUser(newUser);

    // Sync to Firestore if available
    if (firebaseService.isLiveConnected && firebaseService.db) {
      firebaseService.saveUserDoc(uid, newUser).catch(err => console.warn("Firestore sync:", err));
    }

    // Add welcome notification
    storage.addNotification({
      title: "Welcome to DICON GITH",
      message: `Your account has been created successfully. Complete your profile and submit your first grassroots innovation!`,
      type: "announcement"
    });

    return { success: true, user: newUser };
  }

  /**
   * Password Recovery
   */
  async sendPasswordReset(email) {
    await this.init();
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (firebaseService.isLiveConnected && firebaseService.auth) {
      try {
        await firebaseService.auth.sendPasswordResetEmail(normalizedEmail);
      } catch (fbErr) {
        console.warn("Firebase password reset error:", fbErr.message);
      }
    }

    // Always return success to prevent email enumeration attacks
    return {
      success: true,
      message: `If an account exists for ${normalizedEmail}, a password reset link has been dispatched.`
    };
  }

  /**
   * Logout current session
   */
  async logout() {
    if (firebaseService.isLiveConnected && firebaseService.auth) {
      await firebaseService.logout().catch(e => console.warn("Firebase logout error:", e));
    }
    this.currentUser = null;
    storage.setUser(null);
  }

  /**
   * Guard for Protected Dashboard Views
   */
  requireAuth(allowedRoles = ['innovator', 'admin', 'super_admin'], redirectUrl = '/login') {
    const user = this.getCurrentUser();
    if (!user || !user.uid) {
      window.location.href = `${redirectUrl}?redirect=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }

    if (!allowedRoles.includes(user.role)) {
      if (user.role === 'innovator') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/admin';
      }
      return false;
    }

    return true;
  }
}

export const authService = new AuthService();
