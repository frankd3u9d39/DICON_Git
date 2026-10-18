import test from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment } from './test-helper.mjs';

setupTestEnvironment();

const { storageService } = await import('../js/storage.js');

test('StorageService: Reference number generation formats consistently and uniquely', () => {
  setupTestEnvironment();
  storageService.init();

  const ref1 = storageService.generateReferenceNumber();
  const ref2 = storageService.generateReferenceNumber();

  assert.match(ref1, /^GITH-2026-\d{6}$/);
  assert.match(ref2, /^GITH-2026-\d{6}$/);
  assert.notEqual(ref1, ref2, 'Reference numbers must be distinct');
});

test('StorageService: Draft isolation per user prevents cross-account draft leakage', () => {
  setupTestEnvironment();
  storageService.init();

  const userA_id = 'user_aaa_111';
  const userB_id = 'user_bbb_222';

  const draftA = { title: 'User A Secret Drone', category: 'Defence' };
  const draftB = { title: 'User B Solar Pump', category: 'Agriculture' };

  // Save drafts with explicit user IDs
  storageService.saveDraft(draftA, userA_id);
  storageService.saveDraft(draftB, userB_id);

  // Retrieve draft for User A
  const retrievedA = storageService.getDraft(userA_id);
  assert.ok(retrievedA);
  assert.equal(retrievedA.title, 'User A Secret Drone');

  // Retrieve draft for User B
  const retrievedB = storageService.getDraft(userB_id);
  assert.ok(retrievedB);
  assert.equal(retrievedB.title, 'User B Solar Pump');

  // Clearing draft for User A should not affect User B
  storageService.clearDraft(userA_id);
  assert.equal(storageService.getDraft(userA_id), null);
  assert.notEqual(storageService.getDraft(userB_id), null);
  assert.equal(storageService.getDraft(userB_id).title, 'User B Solar Pump');
});

test('StorageService: Notification filtering respects user privacy and displays global broadcasts', () => {
  setupTestEnvironment();
  storageService.init();

  const notifications = [
    { id: 'notif_1', userId: 'user_alpha', title: 'Private to Alpha', read: false },
    { id: 'notif_2', userId: 'user_beta', title: 'Private to Beta', read: false },
    { id: 'notif_3', userId: 'global', title: 'Public Announcement to All', read: false }
  ];

  storageService.setNotifications(notifications);

  // Query notifications for User Alpha
  const alphaNotifs = storageService.getNotifications('user_alpha');
  assert.equal(alphaNotifs.length, 2);
  const alphaTitles = alphaNotifs.map(n => n.title);
  assert.ok(alphaTitles.includes('Private to Alpha'));
  assert.ok(alphaTitles.includes('Public Announcement to All'));
  assert.ok(!alphaTitles.includes('Private to Beta'), 'Beta private notification leaked to Alpha!');

  // Query notifications for User Beta
  const betaNotifs = storageService.getNotifications('user_beta');
  assert.equal(betaNotifs.length, 2);
  const betaTitles = betaNotifs.map(n => n.title);
  assert.ok(betaTitles.includes('Private to Beta'));
  assert.ok(betaTitles.includes('Public Announcement to All'));
  assert.ok(!betaTitles.includes('Private to Alpha'), 'Alpha private notification leaked to Beta!');
});

test('StorageService: Submitting an innovation persists attachments and reference numbers', () => {
  setupTestEnvironment();
  storageService.init();

  const appData = {
    userId: 'user_gamma',
    title: 'Precision Micro-Irrigation Control',
    category: 'Agriculture',
    problem: 'Excessive water waste in semi-arid zones',
    solution: 'Soil moisture micro-controller with solar telemetry',
    imageUrls: ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='],
    documentUrls: ['data:application/pdf;base64,JVBERi0xLjUKJcfsj6IK']
  };

  const created = storageService.addInnovation(appData);
  assert.ok(created);
  assert.ok(created.id);
  assert.match(created.referenceNumber, /^GITH-2026-\d{6}$/);
  assert.equal(created.status, 'submitted');
  assert.equal(created.imageUrls.length, 1);
  assert.equal(created.documentUrls.length, 1);

  // Retrieve by ID
  const retrieved = storageService.getInnovationById(created.id);
  assert.ok(retrieved);
  assert.equal(retrieved.title, appData.title);
  assert.equal(retrieved.imageUrls.length, 1);
});
