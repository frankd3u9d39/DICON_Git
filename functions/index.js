const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { onDocumentUpdated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const ADMIN_ROLES = ['admin', 'super_admin'];
const ASSIGNABLE_ROLES = ['innovator', 'scout', 'evaluator', 'mentor', 'admin', 'super_admin'];

const STATUS_LABELS = {
  submitted: 'Submitted',
  returned: 'Returned for correction',
  screening: 'Under screening',
  verification: 'Under verification',
  assessment: 'Under assessment',
  shortlisted: 'Shortlisted',
  selected: 'Selected',
  mentorship: 'In mentorship',
  incubation: 'In incubation',
  rejected: 'Not selected',
};

/**
 * Callable: submitInnovation({ innovationId })
 * Issues a gapless sequential reference number (GITH-YYYY-000001...) inside a transaction,
 * flips draft/returned -> submitted, and writes the success notification.
 * The client-side random-number flow in FLUTTERFLOW_SETUP.md also works; use this one if you
 * want sequential numbers.
 */
exports.submitInnovation = onCall(async (request) => {
  const uid = request.auth && request.auth.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first.');
  const innovationId = request.data && request.data.innovationId;
  if (!innovationId) throw new HttpsError('invalid-argument', 'innovationId is required.');

  const ref = db.collection('innovations').doc(innovationId);
  const year = new Date().getFullYear();
  const counterRef = db.collection('counters').doc(`reference-${year}`);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) throw new HttpsError('not-found', 'Innovation not found.');
    const data = snap.data();
    if (data.userId !== uid) throw new HttpsError('permission-denied', 'Not your innovation.');
    if (!['draft', 'returned'].includes(data.status)) {
      throw new HttpsError('failed-precondition', 'This application has already been submitted.');
    }

    // A returned application keeps its original number.
    let referenceNumber = data.referenceNumber;
    if (!referenceNumber) {
      const counterSnap = await tx.get(counterRef);
      const next = (counterSnap.exists ? counterSnap.data().value : 0) + 1;
      referenceNumber = `GITH-${year}-${String(next).padStart(6, '0')}`;
      tx.set(counterRef, { value: next });
      tx.set(db.collection('referenceNumbers').doc(referenceNumber), {
        userId: uid,
        innovationId,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    tx.update(ref, {
      referenceNumber,
      status: 'submitted',
      submittedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    tx.set(db.collection('notifications').doc(), {
      userId: uid,
      title: 'Innovation submitted',
      message: `Your innovation has been submitted. Reference: ${referenceNumber}`,
      type: 'submission_success',
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { referenceNumber };
  });
});

/** Notify the innovator whenever an admin changes their application status. */
exports.onInnovationStatusChange = onDocumentUpdated('innovations/{id}', async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  if (before.status === after.status) return;
  // draft -> submitted is already notified by submitInnovation / the client.
  if (before.status === 'draft' || after.status === 'draft') return;
  if (after.status === 'submitted') return;

  const label = STATUS_LABELS[after.status] || after.status;
  await db.collection('notifications').add({
    userId: after.userId,
    title: 'Application status changed',
    message: `${after.innovationName} (${after.referenceNumber}) is now: ${label}.`,
    type: 'status_changed',
    isRead: false,
    createdAt: FieldValue.serverTimestamp(),
  });
});

/**
 * Callable: setUserRole({ uid, role })
 * Only super_admin may call. Updates users/{uid}.role and the custom auth claim
 * (so Phase 2 rules can read request.auth.token.role instead of doing a get()).
 */
exports.setUserRole = onCall(async (request) => {
  const callerUid = request.auth && request.auth.uid;
  if (!callerUid) throw new HttpsError('unauthenticated', 'Sign in first.');
  const caller = await db.collection('users').doc(callerUid).get();
  if (!caller.exists || caller.data().role !== 'super_admin') {
    throw new HttpsError('permission-denied', 'Only a super admin can assign roles.');
  }
  const { uid, role } = request.data || {};
  if (!uid || !ASSIGNABLE_ROLES.includes(role)) {
    throw new HttpsError('invalid-argument', 'Valid uid and role are required.');
  }
  await admin.auth().setCustomUserClaims(uid, { role });
  await db.collection('users').doc(uid).update({ role, updatedAt: FieldValue.serverTimestamp() });
  await db.collection('auditLogs').add({
    userId: callerUid,
    action: 'set_role',
    targetUid: uid,
    detail: role,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { ok: true };
});
