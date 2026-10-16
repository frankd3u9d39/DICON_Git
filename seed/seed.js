// Seeds categories, states and (optionally) a demo innovation.
// Usage (from the functions folder so firebase-admin resolves):
//   set GOOGLE_APPLICATION_CREDENTIALS=path\to\serviceAccount.json
//   node ../seed/seed.js            -> categories + states
//   node ../seed/seed.js --demo <uid>  -> also a demo innovation for that existing user
const admin = require('firebase-admin');
const categories = require('./categories.json');
const states = require('./states.json');

admin.initializeApp();
const db = admin.firestore();
const now = admin.firestore.FieldValue.serverTimestamp();
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

(async () => {
  const batch = db.batch();
  categories.forEach((name, i) =>
    batch.set(db.collection('categories').doc(slug(name)), { name, isActive: true, sortOrder: i }));
  states.forEach((name, i) =>
    batch.set(db.collection('states').doc(slug(name)), { name, sortOrder: i }));
  batch.set(db.collection('settings').doc('app'), { currentYear: new Date().getFullYear(), phase: 1 }, { merge: true });
  await batch.commit();
  console.log(`Seeded ${categories.length} categories and ${states.length} states.`);

  const i = process.argv.indexOf('--demo');
  if (i > -1) {
    const uid = process.argv[i + 1];
    if (!uid) throw new Error('--demo needs a user uid');
    const ref = db.collection('innovations').doc();
    await ref.set({
      innovationId: ref.id,
      referenceNumber: 'GITH-DEMO-000001',
      userId: uid,
      innovatorName: 'Demo Innovator',
      innovationName: 'Smart Community Energy Monitor',
      category: 'Renewable Energy',
      state: 'Kaduna', lga: '', community: '', teamName: 'Demo Team',
      problemDescription: 'TEST DATA: communities lack visibility into solar mini-grid usage.',
      targetUsers: 'TEST DATA: rural households', problemImportance: 'TEST DATA',
      solutionDescription: 'TEST DATA: low-cost IoT energy monitor.',
      howItWorks: 'TEST DATA', uniqueness: 'TEST DATA',
      developmentStage: 'Prototype', ipStatus: 'Not Yet', requiresIpSupport: false,
      imageUrls: [], videoUrls: [], documentUrls: [],
      status: 'submitted', isDemo: true,
      submittedAt: now, updatedAt: now, createdAt: now,
    });
    console.log('Demo innovation created (marked isDemo: true).');
  }
})().catch((e) => { console.error(e); process.exit(1); });
