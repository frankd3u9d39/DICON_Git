const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8'
};

// Sensitive files and directories that should never be publicly served
const BLOCKED_PATHS = [
  '/server.js',
  '/package.json',
  '/package-lock.json',
  '/.git',
  '/.env',
  '/node_modules',
  '/tests'
];

function isBlocked(reqPath) {
  const lower = reqPath.toLowerCase();
  return BLOCKED_PATHS.some(blocked => lower === blocked || lower.startsWith(blocked + '/'));
}

const server = http.createServer((req, res) => {
  const rawUrl = req.url || '';
  if (rawUrl.includes('..') || rawUrl.toLowerCase().includes('%2e')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden: Traversal Attempt Detected');
    return;
  }

  // Normalize path
  let reqPath = decodeURI(rawUrl.split('?')[0]);

  // Route aliases
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  } else if (reqPath === '/login') {
    reqPath = '/login.html';
  } else if (reqPath === '/register') {
    reqPath = '/register.html';
  } else if (reqPath === '/forgot-password') {
    reqPath = '/forgot-password.html';
  } else if (reqPath === '/dashboard' || reqPath.startsWith('/dashboard/')) {
    reqPath = '/dashboard.html';
  } else if (reqPath === '/admin' || reqPath.startsWith('/admin/')) {
    reqPath = '/admin.html';
  } else if (reqPath === '/app') {
    reqPath = '/app.html';
  }

  // Security check: block internal source code & configs
  if (isBlocked(reqPath)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Access Denied');
    return;
  }

  const filePath = path.resolve(PUBLIC_DIR, '.' + reqPath);

  // Security: prevent path traversal outside project directory
  if (!filePath.toLowerCase().startsWith(PUBLIC_DIR.toLowerCase())) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for SPA routes if not an asset
      const ext = path.extname(reqPath);
      if (!ext || ext === '.html') {
        const indexPath = path.join(PUBLIC_DIR, 'index.html');
        fs.readFile(indexPath, (indexErr, content) => {
          if (indexErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not Found');
          } else {
            res.writeHead(200, {
              'Content-Type': 'text/html; charset=utf-8',
              'X-Content-Type-Options': 'nosniff',
              'X-Frame-Options': 'SAMEORIGIN',
              'Referrer-Policy': 'strict-origin-when-cross-origin'
            });
            res.end(content);
          }
        });
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('File Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`DICON GITH Server running at http://localhost:${PORT}`);
  });
}

module.exports = server;
