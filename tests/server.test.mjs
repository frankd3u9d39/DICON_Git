import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import server from '../server.js';

let testPort = 3099;
let baseUrl = `http://127.0.0.1:${testPort}`;

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const reqOptions = {
      host: '127.0.0.1',
      port: testPort,
      path: path,
      ...options
    };
    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({
        statusCode: res.statusCode,
        headers: res.headers,
        body: data
      }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('Server: Starts and closes cleanly for test suite', async (t) => {
  await new Promise(resolve => server.listen(testPort, resolve));

  t.after(async () => {
    await new Promise(resolve => server.close(resolve));
  });

  // Test 1: Root route serves landing page
  const rootRes = await makeRequest('/');
  assert.equal(rootRes.statusCode, 200);
  assert.match(rootRes.headers['content-type'], /text\/html/);
  assert.match(rootRes.body, /DICON/i);
  assert.equal(rootRes.headers['x-content-type-options'], 'nosniff');
  assert.equal(rootRes.headers['x-frame-options'], 'SAMEORIGIN');

  // Test 2: Route aliases work properly
  const loginRes = await makeRequest('/login');
  assert.equal(loginRes.statusCode, 200);
  assert.match(loginRes.body, /Sign In|Welcome Back/i);

  const registerRes = await makeRequest('/register');
  assert.equal(registerRes.statusCode, 200);
  assert.match(registerRes.body, /Register|Create Account/i);

  const forgotRes = await makeRequest('/forgot-password');
  assert.equal(forgotRes.statusCode, 200);
  assert.match(forgotRes.body, /Reset Password/i);

  const aboutRes = await makeRequest('/about');
  assert.equal(aboutRes.statusCode, 200);
  assert.match(aboutRes.body, /About GITH|Institutional Charter/i);

  const dashRes = await makeRequest('/dashboard');
  assert.equal(dashRes.statusCode, 200);
  assert.match(dashRes.body, /Innovator Portal/i);

  const adminRes = await makeRequest('/admin');
  assert.equal(adminRes.statusCode, 200);
  assert.match(adminRes.body, /Administrative/i);

  // Test 3: Static CSS and JS assets are served with correct MIME types
  const cssRes = await makeRequest('/css/dashboard.css');
  assert.equal(cssRes.statusCode, 200);
  assert.match(cssRes.headers['content-type'], /text\/css/);

  const jsRes = await makeRequest('/js/auth-service.js');
  assert.equal(jsRes.statusCode, 200);
  assert.match(jsRes.headers['content-type'], /application\/javascript/);

  // Test 4: Security - Path Traversal is blocked with 403 Forbidden
  const traversalRes = await makeRequest('/%2e%2e/%2e%2e/Windows/win.ini');
  assert.equal(traversalRes.statusCode, 403);
  assert.match(traversalRes.body, /Forbidden|Access Denied/i);

  // Test 5: Security - Access to sensitive system/code files is blocked with 403 Access Denied
  const serverJsRes = await makeRequest('/server.js');
  assert.equal(serverJsRes.statusCode, 403);
  assert.match(serverJsRes.body, /Access Denied/i);

  const pkgRes = await makeRequest('/package.json');
  assert.equal(pkgRes.statusCode, 403);

  const gitRes = await makeRequest('/.git/config');
  assert.equal(gitRes.statusCode, 403);

  // Test 6: Non-existent asset returns 404
  const missingRes = await makeRequest('/images/non-existent-image-12345.png');
  assert.equal(missingRes.statusCode, 404);
});
