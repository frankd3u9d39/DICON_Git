/**
 * DICON GITH App - Storage & State Management
 * Handles local persistence, offline-first drafts, and sync-ready state.
 */

import { INITIAL_DEMO_USER, INITIAL_DEMO_INNOVATION, INITIAL_NOTIFICATIONS } from './data.js';

const STORAGE_KEYS = {
  USER: 'dicon_gith_user',
  ONBOARDING: 'dicon_gith_onboarding_seen',
  INNOVATIONS: 'dicon_gith_innovations',
  DRAFT: 'dicon_gith_draft',
  NOTIFICATIONS: 'dicon_gith_notifications',
  REFERENCE_NUMBERS: 'dicon_gith_ref_registry'
};

class StorageService {
  constructor() {
    this.init();
  }

  init() {
    // If first time running, seed demo data
    if (!localStorage.getItem(STORAGE_KEYS.INNOVATIONS)) {
      this.resetToDemo();
    }
  }

  resetToDemo() {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(INITIAL_DEMO_USER));
    localStorage.setItem(STORAGE_KEYS.ONBOARDING, 'true');
    localStorage.setItem(STORAGE_KEYS.INNOVATIONS, JSON.stringify([INITIAL_DEMO_INNOVATION]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem(STORAGE_KEYS.REFERENCE_NUMBERS, JSON.stringify([INITIAL_DEMO_INNOVATION.referenceNumber]));
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
  }

  // ---- ONBOARDING ----
  isOnboardingSeen() {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING) === 'true';
  }

  setOnboardingSeen(value = true) {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING, value ? 'true' : 'false');
  }

  // ---- USER AUTH & PROFILE ----
  getUser() {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  }

  setUser(user) {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    }
  }

  updateProfile(partialData) {
    const user = this.getUser();
    if (!user) return null;
    
    // Prevent modification of role or UID directly by standard innovator
    const updated = {
      ...user,
      ...partialData,
      role: user.role || 'innovator',
      uid: user.uid,
      updatedAt: new Date().toISOString()
    };
    this.setUser(updated);
    return updated;
  }

  calculateProfileCompletion(user = this.getUser()) {
    if (!user) return 0;
    const fields = [
      user.fullName,
      user.photoUrl,
      user.phoneNumber,
      user.state,
      user.lga,
      user.community,
      user.occupation,
      user.institution,
      user.bio,
      user.skills && user.skills.length > 0 ? 'yes' : null
    ];
    const filled = fields.filter(val => val && String(val).trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }

  // ---- REFERENCE NUMBER GENERATOR ----
  generateReferenceNumber() {
    const registry = JSON.parse(localStorage.getItem(STORAGE_KEYS.REFERENCE_NUMBERS) || '[]');
    const year = new Date().getFullYear();
    let ref = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 50) {
      attempts++;
      // Format: GITH-2026-XXXXXX (6 digits)
      const rand = Math.floor(100000 + Math.random() * 900000);
      ref = `GITH-${year}-${rand}`;
      if (!registry.includes(ref)) {
        isUnique = true;
      }
    }

    registry.push(ref);
    localStorage.setItem(STORAGE_KEYS.REFERENCE_NUMBERS, JSON.stringify(registry));
    return ref;
  }

  // ---- INNOVATIONS & DRAFT ----
  getInnovations(userId = null) {
    const raw = localStorage.getItem(STORAGE_KEYS.INNOVATIONS);
    const list = raw ? JSON.parse(raw) : [];
    if (userId) {
      return list.filter(item => item.userId === userId);
    }
    return list;
  }

  getInnovationById(id) {
    const list = this.getInnovations();
    return list.find(item => item.innovationId === id || item.referenceNumber === id) || null;
  }

  getDraft() {
    const raw = localStorage.getItem(STORAGE_KEYS.DRAFT);
    return raw ? JSON.parse(raw) : null;
  }

  saveDraft(draftData) {
    const user = this.getUser();
    const existing = this.getDraft() || {};
    const updated = {
      ...existing,
      ...draftData,
      status: 'draft',
      userId: user ? user.uid : 'anon',
      innovatorName: user ? user.fullName : '',
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(updated));
    return updated;
  }

  clearDraft() {
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
  }

  submitInnovation(data) {
    const user = this.getUser();
    if (!user) throw new Error("Authentication required.");

    const refNumber = this.generateReferenceNumber();
    const innovationId = `inno-${Date.now()}`;
    const now = new Date().toISOString();

    const innovation = {
      innovationId,
      referenceNumber: refNumber,
      userId: user.uid,
      innovatorName: user.fullName || "GITH Innovator",
      innovationName: data.innovationName || "Untitled Innovation",
      category: data.category || "Other",
      state: data.state || user.state || "",
      lga: data.lga || user.lga || "",
      community: data.community || user.community || "",
      teamName: data.teamName || "",
      problemDescription: data.problemDescription || "",
      targetUsers: data.targetUsers || "",
      problemImportance: data.problemImportance || "",
      solutionDescription: data.solutionDescription || "",
      howItWorks: data.howItWorks || "",
      uniqueness: data.uniqueness || "",
      developmentStage: data.developmentStage || "Prototype",
      ipStatus: data.ipStatus || "Not Yet",
      requiresIpSupport: !!data.requiresIpSupport,
      imageUrls: data.imageUrls || [],
      videoUrls: data.videoUrls || [],
      documentUrls: data.documentUrls || [],
      status: "submitted",
      submittedAt: now,
      createdAt: now,
      updatedAt: now
    };

    const list = this.getInnovations();
    list.unshift(innovation);
    localStorage.setItem(STORAGE_KEYS.INNOVATIONS, JSON.stringify(list));

    // Clear active draft
    this.clearDraft();

    // Create success notification
    this.addNotification({
      title: "Innovation Submitted Successfully",
      message: `Your application '${innovation.innovationName}' has been submitted. Reference: ${refNumber}`,
      type: "submission_success"
    });

    return innovation;
  }

  // ---- NOTIFICATIONS ----
  getNotifications() {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return raw ? JSON.parse(raw) : [];
  }

  getUnreadCount() {
    return this.getNotifications().filter(n => !n.isRead).length;
  }

  addNotification({ title, message, type = "announcement" }) {
    const user = this.getUser();
    const list = this.getNotifications();
    const notif = {
      notificationId: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: user ? user.uid : "global",
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    list.unshift(notif);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    return notif;
  }

  markNotificationRead(id) {
    const list = this.getNotifications();
    const found = list.find(n => n.notificationId === id);
    if (found) {
      found.isRead = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    }
  }

  markAllNotificationsRead() {
    const list = this.getNotifications();
    list.forEach(n => { n.isRead = true; });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
  }
}

export const storage = new StorageService();
