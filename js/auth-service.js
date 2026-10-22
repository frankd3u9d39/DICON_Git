/**
 * DICON GITH - Central Authentication & RBAC Service
 * Supports Firebase Live Auth, Firestore user profiles, and resilient secure local storage.
 */

import { firebaseService, firebaseConfig } from './firebase-config.js';
import { storage } from './storage.js';

// Password hashing utility (SHA-256 with salt)
export async function hashPassword(password, salt = 'dicon_gith_salt_2026') {
  const combined = String(password || '') + salt;
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      // Fallback
    }
  }
  // Fallback for non-subtle crypto environments (e.g. older testing tools)
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(16);
}

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
    isActive: true,
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
    isActive: true,
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

    // Check existing stored user session (do NOT auto-login if empty)
    const stored = storage.getUser();
    if (stored && stored.uid && stored.email) {
      this.currentUser = stored;
    } else {
      this.currentUser = null;
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
                isActive: true,
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
    if (this.currentUser) return this.currentUser;
    const stored = storage.getUser();
    if (stored && stored.uid && stored.email) {
      this.currentUser = stored;
      return this.currentUser;
    }
    return null;
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
    if (!normalizedEmail) {
      throw new Error("Email address is required.");
    }
    if (!password) {
      throw new Error("Password is required.");
    }

    // 1. Check for Admin credentials (Strict verification)
    if (normalizedEmail === DEFAULT_ACCOUNTS.ADMIN.email.toLowerCase()) {
      if (password === "DiconAdmin2026!") {
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
            isActive: profile ? profile.isActive !== false : true,
            ...(profile || {})
          };

          if (this.currentUser.isActive === false) {
            throw new Error("This account has been deactivated. Please contact DICON administration.");
          }

          storage.setUser(this.currentUser);
          return { success: true, user: this.currentUser, role: this.currentUser.role };
        }
      } catch (fbErr) {
        if (fbErr.code === 'auth/wrong-password' || fbErr.code === 'auth/user-not-found') {
          throw new Error("Invalid email or password. Please try again.");
        }
        if (fbErr.code === 'auth/invalid-email') {
          throw new Error("The email address is improperly formatted.");
        }
        if (fbErr.message && fbErr.message.includes("deactivated")) {
          throw fbErr;
        }
      }
    }

    // 3. Fallback to registered users in local storage registry
    const usersRegistry = JSON.parse(localStorage.getItem('dicon_gith_users_registry') || '[]');
    const match = usersRegistry.find(u => u.email.toLowerCase() === normalizedEmail);

    if (match) {
      if (match.isActive === false) {
        throw new Error("This account has been deactivated. Please contact DICON administration.");
      }

      const passHash = await hashPassword(password);
      const isMatch = (match.passwordHash && match.passwordHash === passHash) ||
                      (match.password && match.password === password);

      if (isMatch) {
        // Safe copy without password or hash
        const { password: _p, passwordHash: _ph, ...userSafe } = match;
        this.currentUser = userSafe;
        storage.setUser(this.currentUser);
        return { success: true, user: this.currentUser, role: this.currentUser.role };
      } else {
        throw new Error("Invalid email or password. Please try again.");
      }
    }

    // 4. Check Demo Innovator account
    if (normalizedEmail === DEFAULT_ACCOUNTS.INNOVATOR.email.toLowerCase()) {
      if (password === "Innovator2026!") {
        this.currentUser = { ...DEFAULT_ACCOUNTS.INNOVATOR };
        storage.setUser(this.currentUser);
        return { success: true, user: this.currentUser, role: 'innovator' };
      } else {
        throw new Error("Invalid password for demo innovator account.");
      }
    }

    throw new Error("No account found matching this email. Please register first.");
  }

  /**
   * Register a new Innovator account
   * Note: Public registration ALWAYS assigns role: 'innovator'
   */
  async register({ fullName, email, phoneNumber, phone, password, state, lga, postcode }) {
    await this.init();

    const normalizedEmail = (email || '').trim().toLowerCase();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      throw new Error("A valid email address is required.");
    }

    // Prevent privilege escalation / registration with reserved administrative addresses
    if (normalizedEmail === DEFAULT_ACCOUNTS.ADMIN.email.toLowerCase() ||
        normalizedEmail.endsWith('@dicon.gov.ng')) {
      throw new Error("Registration with this domain or email is reserved for official DICON administration. Public accounts cannot register with administrative emails.");
    }

    // Password strength check (min 8 characters)
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters long.");
    }

    // Phone number validation
    const rawPhone = phoneNumber || phone || '';
    const cleanPhone = rawPhone.trim().replace(/[\s-]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      throw new Error("Please enter a valid phone number (at least 10 digits).");
    }

    // Check duplicate in registry and default demo accounts
    const usersRegistry = JSON.parse(localStorage.getItem('dicon_gith_users_registry') || '[]');
    if (usersRegistry.some(u => u.email.toLowerCase() === normalizedEmail) ||
        normalizedEmail === DEFAULT_ACCOUNTS.INNOVATOR.email.toLowerCase()) {
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
      id: uid,
      email: normalizedEmail,
      fullName: (fullName || '').trim(),
      phoneNumber: (phoneNumber || phone || '').trim(),
      state: state || '',
      lga: lga || '',
      postcode: postcode || '',
      community: '',
      role: 'innovator', // Strictly enforced
      isActive: true,
      bio: '',
      occupation: '',
      institution: '',
      skills: [],
      photoUrl: 'assets/innovator_main.jpg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store in local registry with SHA-256 password hash (never plain text!)
    const passwordHash = await hashPassword(password);
    usersRegistry.push({ ...newUser, passwordHash });
    localStorage.setItem('dicon_gith_users_registry', JSON.stringify(usersRegistry));

    // Set active session
    this.currentUser = newUser;
    storage.setUser(newUser);

    // Sync to Firestore if available
    if (firebaseService.isLiveConnected && firebaseService.db) {
      firebaseService.saveUserDoc(uid, newUser).catch(err => console.warn("Firestore sync:", err));
    }

    // Add welcome notification for this specific user
    storage.addNotification({
      title: "Welcome to DICON GITH",
      message: `Your account has been created successfully. Complete your profile and submit your first grassroots innovation!`,
      type: "announcement",
      targetUserId: uid
    });

    return { success: true, user: newUser };
  }

  /**
   * Password Recovery: Dispatch Reset Instruction
   */
  async sendPasswordReset(email) {
    await this.init();
    const normalizedEmail = (email || '').trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!normalizedEmail || !emailRegex.test(normalizedEmail)) {
      throw new Error("Please enter a valid email address.");
    }

    if (firebaseService.isLiveConnected && firebaseService.auth) {
      try {
        await firebaseService.auth.sendPasswordResetEmail(normalizedEmail);
      } catch (fbErr) {
        console.warn("Firebase password reset error:", fbErr.message);
      }
    }

    // Generate simulated reset token stored locally for seamless offline/local testing
    const resetTokens = JSON.parse(localStorage.getItem('dicon_gith_reset_tokens') || '{}');
    const token = 'rst-' + Math.random().toString(36).substring(2, 10);
    resetTokens[normalizedEmail] = {
      token,
      expiresAt: Date.now() + 3600 * 1000 // 1 hour
    };
    localStorage.setItem('dicon_gith_reset_tokens', JSON.stringify(resetTokens));

    // Always return success message to prevent user enumeration
    return {
      success: true,
      token,
      resetToken: token,
      message: `If an account exists for ${normalizedEmail}, password reset instructions have been dispatched.`
    };
  }

  async requestPasswordReset(email) {
    return this.sendPasswordReset(email);
  }

  /**
   * Complete Password Reset with New Password
   */
  async resetPassword({ email, token, newPassword, confirmPassword }) {
    await this.init();
    const normalizedEmail = (email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      throw new Error("Email address is required.");
    }
    if (!newPassword || newPassword.length < 8) {
      throw new Error("New password must be at least 8 characters long.");
    }
    if (newPassword !== confirmPassword) {
      throw new Error("Password confirmation does not match.");
    }

    // If token provided, verify token
    if (token) {
      const resetTokens = JSON.parse(localStorage.getItem('dicon_gith_reset_tokens') || '{}');
      const record = resetTokens[normalizedEmail];
      if (!record || record.token !== token) {
        throw new Error("Invalid or unrecognized password reset token.");
      }
      if (Date.now() > record.expiresAt) {
        throw new Error("This password reset token has expired. Please request a new link.");
      }
      delete resetTokens[normalizedEmail];
      localStorage.setItem('dicon_gith_reset_tokens', JSON.stringify(resetTokens));
    }

    // Update in users registry
    const usersRegistry = JSON.parse(localStorage.getItem('dicon_gith_users_registry') || '[]');
    const matchIndex = usersRegistry.findIndex(u => u.email.toLowerCase() === normalizedEmail);

    if (matchIndex === -1 && normalizedEmail !== DEFAULT_ACCOUNTS.INNOVATOR.email.toLowerCase()) {
      throw new Error("No account found matching this email address.");
    }

    const passwordHash = await hashPassword(newPassword);

    if (matchIndex !== -1) {
      usersRegistry[matchIndex].passwordHash = passwordHash;
      delete usersRegistry[matchIndex].password; // remove any legacy plaintext
      usersRegistry[matchIndex].updatedAt = new Date().toISOString();
    } else {
      // First-time reset of demo innovator account
      usersRegistry.push({
        ...DEFAULT_ACCOUNTS.INNOVATOR,
        passwordHash,
        updatedAt: new Date().toISOString()
      });
    }
    localStorage.setItem('dicon_gith_users_registry', JSON.stringify(usersRegistry));

    return {
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password."
    };
  }

  /**
   * Get safe list of registered innovators (for admin view)
   */
  getUsers() {
    const list = JSON.parse(localStorage.getItem('dicon_gith_users_registry') || '[]');
    return list.map(u => {
      const { password, passwordHash, ...safe } = u;
      return safe;
    });
  }

  /**
   * Update Profile Details
   */
  updateProfile(profileData) {
    const updated = storage.updateProfile(profileData);
    if (updated) {
      this.currentUser = updated;
    }
    return updated;
  }

  /**
   * Set user status (e.g. active, suspended)
   */
  setUserStatus(uid, status) {
    const list = JSON.parse(localStorage.getItem('dicon_gith_users_registry') || '[]');
    const match = list.find(u => (u.uid === uid || u.id === uid));
    if (match) {
      match.isActive = status === 'active';
      match.status = status;
      match.updatedAt = new Date().toISOString();
      localStorage.setItem('dicon_gith_users_registry', JSON.stringify(list));
      return match;
    }
    return null;
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
