/**
 * DICON GITH App - Storage & State Management
 * Handles local persistence, offline-first drafts, and sync-ready state.
 */

import { INITIAL_DEMO_USER, INITIAL_DEMO_INNOVATION, INITIAL_NOTIFICATIONS } from './data.js';
import { firebaseService } from './firebase-config.js';

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
      // Sync to live Firestore if connected
      if (user.uid) {
        firebaseService.saveUserDoc(user.uid, user).catch(err => console.warn("Firestore sync:", err));
      }
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

  _getDraftKey(userId = null) {
    const uid = userId || (this.getUser() ? this.getUser().uid : 'anon');
    return `${STORAGE_KEYS.DRAFT}_${uid}`;
  }

  getDraft(userId = null) {
    const key = this._getDraftKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
    // Legacy fallback only if same user
    const legacy = localStorage.getItem(STORAGE_KEYS.DRAFT);
    if (legacy) {
      try {
        const parsed = JSON.parse(legacy);
        const activeUid = userId || (this.getUser() ? this.getUser().uid : 'anon');
        if (parsed.userId === activeUid) return parsed;
      } catch (e) {}
    }
    return null;
  }

  saveDraft(draftData, userId = null) {
    const user = this.getUser();
    const uid = userId || (user ? user.uid : 'anon');
    const existing = this.getDraft(uid) || {};
    const updated = {
      ...existing,
      ...draftData,
      status: 'draft',
      userId: uid,
      innovatorName: user ? user.fullName : '',
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(this._getDraftKey(uid), JSON.stringify(updated));
    return updated;
  }

  clearDraft(userId = null) {
    const key = this._getDraftKey(userId);
    localStorage.removeItem(key);
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
  }

  submitInnovation(data) {
    const user = this.getUser();
    if (!user) throw new Error("Authentication required.");

    const refNumber = this.generateReferenceNumber();
    const innovationId = `inno-${Date.now()}`;
    const now = new Date().toISOString();

    const innovation = {
      id: innovationId,
      innovationId,
      referenceNumber: refNumber,
      userId: user.uid || user.id,
      innovatorName: user.fullName || "GITH Innovator",
      title: data.title || data.innovationName || "Untitled Innovation",
      innovationName: data.innovationName || data.title || "Untitled Innovation",
      category: data.category || "Other",
      state: data.state || user.state || "",
      lga: data.lga || user.lga || "",
      community: data.community || user.community || "",
      teamName: data.teamName || "",
      problemDescription: data.problemDescription || data.problem || "",
      problem: data.problem || data.problemDescription || "",
      targetUsers: data.targetUsers || "",
      problemImportance: data.problemImportance || "",
      solutionDescription: data.solutionDescription || data.solution || "",
      solution: data.solution || data.solutionDescription || "",
      howItWorks: data.howItWorks || "",
      uniqueness: data.uniqueness || "",
      developmentStage: data.developmentStage || "Prototype",
      ipStatus: data.ipStatus || "Not Yet",
      requiresIpSupport: !!data.requiresIpSupport,
      imageUrls: data.imageUrls || [],
      videoUrls: data.videoUrls || [],
      documentUrls: data.documentUrls || [],
      status: "submitted",
      statusHistory: [
        {
          prevStatus: null,
          newStatus: 'submitted',
          note: 'Application submitted into the GITH registry.',
          timestamp: now
        }
      ],
      submittedAt: now,
      createdAt: now,
      updatedAt: now
    };

    const list = this.getInnovations();
    list.unshift(innovation);
    localStorage.setItem(STORAGE_KEYS.INNOVATIONS, JSON.stringify(list));

    // Clear active draft
    this.clearDraft(user.uid || user.id);

    // Sync to live Firestore if connected
    firebaseService.saveInnovationDoc(innovation.innovationId, innovation).catch(err => console.warn("Firestore sync:", err));

    // Create success notification
    this.addNotification({
      title: "Innovation Submitted Successfully",
      message: `Your application '${innovation.innovationName}' has been submitted. Reference: ${refNumber}`,
      type: "submission_success",
      targetUserId: user.uid || user.id
    });

    return innovation;
  }

  addInnovation(data) {
    if (!this.getUser()) {
      this.setUser({ uid: data.userId || 'user-auto', id: data.userId || 'user-auto', fullName: data.creatorName || 'Innovator' });
    }
    return this.submitInnovation(data);
  }

  getUserInnovations(userId) {
    return this.getInnovations(userId);
  }

  updateInnovationStatus(id, nextStatus, note = '', adminUser = null) {
    const list = this.getInnovations();
    const item = list.find(i => i.innovationId === id || i.id === id || i.referenceNumber === id);
    if (!item) return null;

    const prevStatus = item.status;
    const now = new Date().toISOString();
    item.status = nextStatus;
    item.updatedAt = now;
    if (!item.statusHistory) item.statusHistory = [];
    item.statusHistory.push({
      prevStatus,
      newStatus: nextStatus,
      note,
      timestamp: now,
      by: adminUser ? adminUser.fullName || adminUser.email : 'Admin'
    });

    localStorage.setItem(STORAGE_KEYS.INNOVATIONS, JSON.stringify(list));

    // Record audit log
    const auditLogs = JSON.parse(localStorage.getItem('dicon_gith_audit_logs') || '[]');
    auditLogs.unshift({
      logId: `audit-${Date.now()}`,
      referenceNumber: item.referenceNumber,
      innovationId: item.innovationId,
      prevStatus,
      newStatus: nextStatus,
      note,
      timestamp: now
    });
    localStorage.setItem('dicon_gith_audit_logs', JSON.stringify(auditLogs));

    // Notify user
    this.addNotification({
      title: `Application Status Updated: ${nextStatus.toUpperCase()}`,
      message: `Your innovation '${item.innovationName || item.title}' (${item.referenceNumber}) has moved to '${nextStatus}'. ${note ? 'Note: ' + note : ''}`,
      type: "status_update",
      targetUserId: item.userId
    });

    return item;
  }

  setNotifications(list) {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
  }

  // ---- NOTIFICATIONS ----
  getNotifications(userId = null) {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const list = raw ? JSON.parse(raw) : [];
    const activeUid = userId || (this.getUser() ? this.getUser().uid : null);
    if (activeUid) {
      return list.filter(n => n.userId === activeUid || n.userId === 'global');
    }
    return list;
  }

  getUnreadCount(userId = null) {
    return this.getNotifications(userId).filter(n => !n.isRead).length;
  }

  addNotification({ title, message, type = "announcement", targetUserId = null }) {
    const user = this.getUser();
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    const notif = {
      notificationId: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: targetUserId || (user ? user.uid : "global"),
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
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const list = raw ? JSON.parse(raw) : [];
    const found = list.find(n => n.notificationId === id);
    if (found) {
      found.isRead = true;
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
    }
  }

  markAllNotificationsRead(userId = null) {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    const list = raw ? JSON.parse(raw) : [];
    const activeUid = userId || (this.getUser() ? this.getUser().uid : null);
    list.forEach(n => {
      if (!activeUid || n.userId === activeUid || n.userId === 'global') {
        n.isRead = true;
      }
    });
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(list));
  }
}

export const storage = new StorageService();
export const storageService = storage;
