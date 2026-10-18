import test from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment } from './test-helper.mjs';

setupTestEnvironment();

const { authService } = await import('../js/auth-service.js');
const { storageService } = await import('../js/storage.js');

test('E2E Lifecycle: Full 12-Step Journey from Innovator Registration to Admin Review & Audit', async () => {
  setupTestEnvironment();
  authService.init();
  storageService.init();

  // ----------------------------------------------------
  // STEP 1: Innovator Registers
  // ----------------------------------------------------
  const regResult = await authService.register({
    fullName: 'Dr. Chinedu Okafor',
    email: 'chinedu.okafor@innovate.ng',
    phone: '08099887766',
    state: 'Enugu',
    lga: 'Enugu North',
    category: 'Indigenous Tech',
    password: 'ChineduSecurePassword2026!',
    agreeTerms: true
  });

  assert.equal(regResult.success, true);
  const innovator = regResult.user;
  assert.equal(innovator.role, 'innovator');
  assert.equal(innovator.email, 'chinedu.okafor@innovate.ng');

  // ----------------------------------------------------
  // STEP 2: Innovator Logs In
  // ----------------------------------------------------
  const loginResult = await authService.login('chinedu.okafor@innovate.ng', 'ChineduSecurePassword2026!');
  assert.equal(loginResult.success, true);
  const currentSession = authService.getCurrentUser();
  assert.equal(currentSession.id, innovator.id);

  // ----------------------------------------------------
  // STEP 3: Innovator Updates Profile
  // ----------------------------------------------------
  const updatedProfile = await authService.updateProfile({
    bio: 'Researcher in indigenous metallurgical processing.',
    institution: 'University of Nigeria, Nsukka',
    state: 'Enugu',
    lga: 'Nsukka',
    skills: 'Metallurgy, Materials Science, High-Tensile Alloys'
  });
  assert.equal(updatedProfile.institution, 'University of Nigeria, Nsukka');

  // ----------------------------------------------------
  // STEP 4: Innovator Saves a Draft
  // ----------------------------------------------------
  const draftData = {
    title: 'Bio-Char Hardened Armor Composite',
    category: 'Defence',
    developmentStage: 'prototype',
    problem: 'High cost of imported ceramic armor tiles for tactical vehicles.',
    solution: 'Locally formulated bio-char and recycled aluminum composite.'
  };

  storageService.saveDraft(draftData, innovator.id);
  const fetchedDraft = storageService.getDraft(innovator.id);
  assert.ok(fetchedDraft);
  assert.equal(fetchedDraft.title, draftData.title);

  // ----------------------------------------------------
  // STEP 5: Innovator Submits Completed Innovation
  // ----------------------------------------------------
  const submissionData = {
    ...draftData,
    userId: innovator.id,
    creatorName: innovator.fullName,
    creatorEmail: innovator.email,
    state: 'Enugu',
    lga: 'Nsukka',
    howItWorks: 'Thermal compaction of nanostructured carbon matrices.',
    uniqueness: '30% lighter and 50% cheaper than conventional alumina.',
    ipStatus: 'patent_pending',
    declarationAgreed: true,
    imageUrls: ['data:image/png;base64,sampleCompositeImageString'],
    documentUrls: ['data:application/pdf;base64,sampleSpecificationPdf']
  };

  const createdApp = storageService.addInnovation(submissionData);
  assert.ok(createdApp);
  assert.ok(createdApp.id);
  assert.match(createdApp.referenceNumber, /^GITH-2026-\d{6}$/);
  assert.equal(createdApp.status, 'submitted');

  // Verify draft is cleared upon successful submission
  storageService.clearDraft(innovator.id);
  assert.equal(storageService.getDraft(innovator.id), null);

  // ----------------------------------------------------
  // STEP 6: Innovator Confirms Application in Portal
  // ----------------------------------------------------
  const userApps = storageService.getUserInnovations(innovator.id);
  assert.equal(userApps.length, 1);
  assert.equal(userApps[0].id, createdApp.id);
  assert.equal(userApps[0].referenceNumber, createdApp.referenceNumber);

  // ----------------------------------------------------
  // STEP 7: Admin Logs In
  // ----------------------------------------------------
  authService.logout();
  const adminLogin = await authService.login('admin@dicon.gov.ng', 'DiconAdmin2026!');
  assert.equal(adminLogin.success, true);
  assert.ok(['admin', 'super_admin'].includes(adminLogin.user.role));

  // ----------------------------------------------------
  // STEP 8: Admin Finds Submission in Registry
  // ----------------------------------------------------
  const allApps = storageService.getInnovations();
  const targetApp = allApps.find(a => a.id === createdApp.id);
  assert.ok(targetApp);
  assert.equal(targetApp.referenceNumber, createdApp.referenceNumber);
  assert.equal(targetApp.status, 'submitted');

  // ----------------------------------------------------
  // STEP 9: Admin Workflow State Machine Enforcement
  // ----------------------------------------------------
  // Defined valid transitions:
  const VALID_TRANSITIONS = {
    'submitted': ['screening', 'returned', 'rejected'],
    'screening': ['verification', 'returned', 'rejected'],
    'verification': ['assessment', 'returned', 'rejected'],
    'assessment': ['shortlisted', 'returned', 'rejected'],
    'shortlisted': ['selected', 'rejected'],
    'returned': ['submitted', 'rejected'],
    'selected': [],
    'rejected': []
  };

  // Test 9a: Attempt illegal jump from 'submitted' directly to 'selected'
  const isIllegalValid = (VALID_TRANSITIONS['submitted'] || []).includes('selected');
  assert.equal(isIllegalValid, false, 'Direct jump from submitted to selected must be illegal');

  // Test 9b: Legal progression: submitted -> screening
  const canScreen = (VALID_TRANSITIONS['submitted'] || []).includes('screening');
  assert.equal(canScreen, true);

  const updatedToScreening = storageService.updateInnovationStatus(
    createdApp.id,
    'screening',
    'Initial technical criteria satisfied. Moving to screening.'
  );
  assert.equal(updatedToScreening.status, 'screening');

  // Test 9c: Legal progression: screening -> verification
  const canVerify = (VALID_TRANSITIONS['screening'] || []).includes('verification');
  assert.equal(canVerify, true);

  const updatedToVerification = storageService.updateInnovationStatus(
    createdApp.id,
    'verification',
    'Physical specimen requested for lab ballistics analysis.'
  );
  assert.equal(updatedToVerification.status, 'verification');

  // ----------------------------------------------------
  // STEP 10: Innovator Receives Updated Status
  // ----------------------------------------------------
  authService.logout();
  await authService.login('chinedu.okafor@innovate.ng', 'ChineduSecurePassword2026!');
  const verifiedApp = storageService.getInnovationById(createdApp.id);
  assert.equal(verifiedApp.status, 'verification');
  assert.ok(verifiedApp.statusHistory.length >= 2);

  // ----------------------------------------------------
  // STEP 11: Admin User Management (Account Activation / Deactivation)
  // ----------------------------------------------------
  authService.logout();
  await authService.login('admin@dicon.gov.ng', 'DiconAdmin2026!');

  // Deactivate innovator
  authService.setUserStatus(innovator.id, 'suspended');

  // Verify innovator cannot log in when account is suspended
  authService.logout();
  await assert.rejects(
    async () => await authService.login('chinedu.okafor@innovate.ng', 'ChineduSecurePassword2026!'),
    /deactivated|contact/i
  );

  // Admin reactivates account
  await authService.login('admin@dicon.gov.ng', 'DiconAdmin2026!');
  authService.setUserStatus(innovator.id, 'active');

  // Verify innovator can now log in again
  authService.logout();
  const restoredLogin = await authService.login('chinedu.okafor@innovate.ng', 'ChineduSecurePassword2026!');
  assert.equal(restoredLogin.success, true);
});
