import test from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment } from './test-helper.mjs';

setupTestEnvironment();

const { legalContentService, DEFAULT_PRIVACY_POLICY, DEFAULT_TERMS_AND_CONDITIONS, DEFAULT_ABOUT_GITH } = await import('../js/legal-content.js');

test('LegalContentService: Privacy Policy contains Section 11 Data Security & Section 12 Data Breaches', async () => {
  setupTestEnvironment();
  const policy = await legalContentService.getPolicy('privacy');
  
  assert.ok(policy.content.startsWith('11. DATA SECURITY'));
  assert.ok(policy.content.includes('Firebase Authentication and secure account-management procedures.'));
  assert.ok(policy.content.includes('Properly configured Firestore security rules.'));
  assert.ok(policy.content.includes('12. DATA BREACHES'));
  assert.ok(policy.content.includes('Where notification is required, affected individuals and the relevant authorities will be notified'));
});

test('LegalContentService: Terms and Conditions contains Sections 20-24 and DICON GITH pathway', async () => {
  setupTestEnvironment();
  const terms = await legalContentService.getPolicy('terms');
  
  assert.ok(terms.content.startsWith('20. INDEMNITY'));
  assert.ok(terms.content.includes('material misrepresentation, or infringement of another person\'s rights.'));
  assert.ok(terms.content.includes('21. COMPLAINTS AND DISPUTE RESOLUTION'));
  assert.ok(terms.content.includes('Governing Law: The laws of the Federal Republic of Nigeria.'));
  assert.ok(terms.content.includes('22. CHANGES TO THESE TERMS'));
  assert.ok(terms.content.includes('23. CONTACT INFORMATION'));
  assert.ok(terms.content.includes('24. FINAL PROVISIONS'));
  assert.ok(terms.content.includes('Identify a problem. Imagine a solution. Build it. Test it. Improve it. Deploy it.'));
});

test('LegalContentService: About GITH contains all 11 sections and institutional role', async () => {
  setupTestEnvironment();
  const about = await legalContentService.getPolicy('about');
  
  assert.ok(about.content.includes('ABOUT GITH'));
  assert.ok(about.content.includes('1. Introduction'));
  assert.ok(about.content.includes('2. DICON’s Institutional Role') || about.content.includes("2. DICON's Institutional Role"));
  assert.ok(about.content.includes('3. The Relationship Between GITH and DICON'));
  assert.ok(about.content.includes('4. What GITH Does'));
  assert.ok(about.content.includes('5. Who Can Participate?'));
  assert.ok(about.content.includes('6. The GITH Innovation Development Pathway'));
  assert.ok(about.content.includes('DISCOVER → DOCUMENT → VERIFY → ASSESS → SELECT → DEVELOP → TEST → CONNECT → DEPLOY'));
  assert.ok(about.content.includes('7. Our Vision'));
  assert.ok(about.content.includes('8. Our Mission'));
  assert.ok(about.content.includes('9. Our Guiding Philosophy'));
  assert.ok(about.content.includes('10. From Grassroots Discovery to Institutional Development'));
  assert.ok(about.content.includes('11. Our Commitment'));
  assert.ok(about.content.includes('Discovering Innovators. Connecting Institutions. Developing Solutions. Creating Impact.'));
});

test('LegalContentService: Editing and saving policy persists and updates content', async () => {
  setupTestEnvironment();
  const customText = 'CUSTOM PRIVACY POLICY AMENDMENT TEST 2026';
  
  await legalContentService.savePolicy('privacy', customText, 'Super Admin');
  const updated = await legalContentService.getPolicy('privacy');
  
  assert.equal(updated.content, customText);
  assert.equal(updated.updatedBy, 'Super Admin');

  // Reset restores default
  await legalContentService.resetPolicy('privacy');
  const restored = await legalContentService.getPolicy('privacy');
  assert.ok(restored.content.includes('11. DATA SECURITY'));
});

test('LegalContentService: HTML formatter generates structured elements and badges', () => {
  const sample = `11. DATA SECURITY\nAppropriate safeguards:\n* Firebase Authentication\nDISCOVER → DOCUMENT → DEPLOY`;
  const html = legalContentService.renderPolicyToHtml(sample);

  assert.ok(html.includes('legal-section-header'));
  assert.ok(html.includes('legal-pathway-flow'));
  assert.ok(html.includes('Firebase Authentication'));
});
