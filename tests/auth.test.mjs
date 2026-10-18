import test from 'node:test';
import assert from 'node:assert/strict';
import { setupTestEnvironment } from './test-helper.mjs';

// Setup environment before importing auth-service
setupTestEnvironment();

const { authService } = await import('../js/auth-service.js');

test('AuthService: Default Demo Users are securely seeded with hashed credentials', async () => {
  setupTestEnvironment();
  authService.init();

  // Test Admin Login with valid credentials
  const adminRes = await authService.login('admin@dicon.gov.ng', 'DiconAdmin2026!');
  assert.equal(adminRes.success, true);
  assert.ok(['admin', 'super_admin'].includes(adminRes.user.role));
  assert.equal(adminRes.user.email, 'admin@dicon.gov.ng');
  assert.equal(adminRes.user.password, undefined, 'Password must never be returned in user object');
  assert.equal(adminRes.user.passwordHash, undefined, 'Password hash must never be returned in user object');

  // Test Demo Innovator Login
  const userRes = await authService.login('aminu.bello@example.com', 'Innovator2026!');
  assert.equal(userRes.success, true);
  assert.equal(userRes.user.role, 'innovator');
  assert.equal(userRes.user.password, undefined);
});

test('AuthService: Old backdoor passwords are completely rejected', async () => {
  setupTestEnvironment();
  await authService.init();

  // Backdoor "admin123"
  await assert.rejects(
    async () => await authService.login('admin@dicon.gov.ng', 'admin123'),
    /invalid/i
  );

  // Backdoor "password"
  await assert.rejects(
    async () => await authService.login('aminu.bello@example.com', 'password'),
    /invalid/i
  );

  // Backdoor "demo123"
  await assert.rejects(
    async () => await authService.login('aminu.bello@example.com', 'demo123'),
    /invalid/i
  );
});

test('AuthService: Registration validation rejects invalid payloads', async () => {
  setupTestEnvironment();
  await authService.init();

  // Missing fields
  await assert.rejects(
    async () => await authService.register({}),
    /required|valid email/i
  );

  // Invalid email
  await assert.rejects(
    async () => await authService.register({
      fullName: 'Jane Doe',
      email: 'not-an-email',
      phone: '08012345678',
      password: 'Password123!',
      agreeTerms: true
    }),
    /valid email/i
  );

  // Short password (< 8 chars)
  await assert.rejects(
    async () => await authService.register({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '08012345678',
      password: '123',
      agreeTerms: true
    }),
    /8 characters/i
  );

  // Short phone (< 10 digits)
  await assert.rejects(
    async () => await authService.register({
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      phone: '1234',
      password: 'StrongPassword123!',
      agreeTerms: true
    }),
    /phone number/i
  );
});

test('AuthService: Prevents privilege escalation to admin via public registration', async () => {
  setupTestEnvironment();
  await authService.init();

  await assert.rejects(
    async () => await authService.register({
      fullName: 'Malicious Actor',
      email: 'fakeadmin@dicon.gov.ng',
      phone: '08012345678',
      password: 'SuperSecretPassword2026!',
      agreeTerms: true
    }),
    /reserved|administrative/i
  );
});

test('AuthService: Successful registration creates innovator with hashed password', async () => {
  setupTestEnvironment();
  authService.init();

  const regRes = await authService.register({
    fullName: 'Fatima Abubakar',
    email: 'fatima@example.com',
    phone: '08023456789',
    state: 'Kano',
    category: 'Renewable Energy',
    password: 'FatimaSecurePass2026!',
    agreeTerms: true
  });

  assert.equal(regRes.success, true);
  assert.equal(regRes.user.role, 'innovator');
  assert.equal(regRes.user.email, 'fatima@example.com');
  assert.equal(regRes.user.password, undefined);
  assert.equal(regRes.user.passwordHash, undefined);

  // Duplicate registration must fail
  await assert.rejects(
    async () => await authService.register({
      fullName: 'Fatima Abubakar',
      email: 'fatima@example.com',
      phone: '08023456789',
      password: 'AnotherPassword2026!',
      agreeTerms: true
    }),
    /already exists/i
  );

  // Login with new user
  const loginRes = await authService.login('fatima@example.com', 'FatimaSecurePass2026!');
  assert.equal(loginRes.success, true);
  assert.equal(loginRes.user.fullName, 'Fatima Abubakar');
});

test('AuthService: Two-stage password reset lifecycle', async () => {
  setupTestEnvironment();
  await authService.init();

  // 1. Request reset token
  const tokenReq = await authService.requestPasswordReset('aminu.bello@example.com');
  assert.equal(tokenReq.success, true);
  assert.ok(tokenReq.resetToken);

  // 2. Reject reset with invalid token
  await assert.rejects(
    async () => await authService.resetPassword({
      email: 'aminu.bello@example.com',
      token: '000000',
      newPassword: 'BrandNewPassword2026!',
      confirmPassword: 'BrandNewPassword2026!'
    }),
    /invalid|unrecognized/i
  );

  // 3. Reject reset when passwords do not match
  await assert.rejects(
    async () => await authService.resetPassword({
      email: 'aminu.bello@example.com',
      token: tokenReq.resetToken,
      newPassword: 'BrandNewPassword2026!',
      confirmPassword: 'DifferentPassword2026!'
    }),
    /match/i
  );

  // 4. Successful password reset with valid token
  const validReset = await authService.resetPassword({
    email: 'aminu.bello@example.com',
    token: tokenReq.resetToken,
    newPassword: 'BrandNewPassword2026!',
    confirmPassword: 'BrandNewPassword2026!'
  });
  assert.equal(validReset.success, true);

  // 5. Old password no longer works
  await assert.rejects(
    async () => await authService.login('aminu.bello@example.com', 'Innovator2026!'),
    /invalid/i
  );

  // 6. New password works
  const newLogin = await authService.login('aminu.bello@example.com', 'BrandNewPassword2026!');
  assert.equal(newLogin.success, true);
  assert.equal(newLogin.user.email, 'aminu.bello@example.com');
});
