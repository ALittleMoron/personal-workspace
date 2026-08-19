/** @jest-environment node */

import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import type { Server } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createStaticRuntimeApp,
  readRequiredPort,
  startStaticRuntimeServer,
} from './static-runtime-app';

const VALID_NONCE = 'request_nonce-1234567890';
const INDEX_SHELL = `<!doctype html>
<html>
  <head><script nonce="__CSP_NONCE__"></script></head>
  <body><app-root ngCspNonce="__CSP_NONCE__"></app-root></body>
</html>`;

describe('static frontend runtime', () => {
  let browserDistFolder: string;
  let server: Server;
  let origin: string;

  beforeAll(async () => {
    browserDistFolder = await mkdtemp(join(tmpdir(), 'frontend-static-runtime-'));
    await Promise.all([
      writeFile(join(browserDistFolder, 'index.html'), INDEX_SHELL),
      writeFile(join(browserDistFolder, 'main-abcdef123456.js'), 'console.log("hashed");'),
      writeFile(join(browserDistFolder, 'chunk-CA-WQifp.js'), 'console.log("hyphenated hash");'),
      writeFile(join(browserDistFolder, 'chunk-_mnC6Ycl.js'), 'console.log("underscored hash");'),
      writeFile(join(browserDistFolder, 'styles-abcdef123456.css'), 'body { color: black; }'),
      writeFile(join(browserDistFolder, 'favicon.ico'), 'stable asset'),
    ]);

    const app = createStaticRuntimeApp({ browserDistFolder });
    server = startStaticRuntimeServer({ app, port: 0 });
    await new Promise<void>((resolve, reject) => {
      server.once('listening', resolve);
      server.once('error', reject);
    });
    const address = server.address();
    if (address === null || typeof address === 'string') {
      throw new Error('Expected the test server to listen on a TCP port.');
    }
    origin = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await rm(browserDistFolder, { recursive: true, force: true });
  });

  it('reports health without requiring an HTML nonce', async () => {
    const response = await fetch(`${origin}/healthz`);

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(await response.text()).toBe('');
  });

  it.each([
    'main-abcdef123456.js',
    'chunk-CA-WQifp.js',
    'chunk-_mnC6Ycl.js',
    'styles-abcdef123456.css',
  ])('caches hashed JavaScript and CSS immutably: %s', async (asset) => {
    const response = await fetch(`${origin}/${asset}`);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=31536000, immutable');
  });

  it('caches stable assets without marking them immutable', async () => {
    const response = await fetch(`${origin}/favicon.ico`);

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=15552000');
    expect(await response.text()).toBe('stable asset');
  });

  it.each(['/login', '/'])(
    'serves the nonce-injected index shell for the SPA navigation %s',
    async (path) => {
      const response = await fetch(`${origin}${path}`, {
        headers: {
          Accept: 'text/html,application/xhtml+xml',
          'X-CSP-Nonce': VALID_NONCE,
        },
      });
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('text/html');
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(body).toContain(`nonce="${VALID_NONCE}"`);
      expect(body).toContain(`ngCspNonce="${VALID_NONCE}"`);
      expect(body).not.toContain('__CSP_NONCE__');
    },
  );

  it.each([
    ['/missing.js', 'text/html'],
    ['/missing.png', 'image/avif,image/webp'],
    ['/login', 'application/json'],
    ['/', 'text/html;q=0'],
  ])('returns 404 instead of the shell for %s requested as %s', async (path, accept) => {
    const response = await fetch(`${origin}${path}`, {
      headers: { Accept: accept, 'X-CSP-Nonce': VALID_NONCE },
    });

    expect(response.status).toBe(404);
  });

  it.each([undefined, 'too-short', 'invalid nonce value!'])(
    'fails closed for HTML when the CSP nonce is %s',
    async (nonce) => {
      const headers: Record<string, string> = { Accept: 'text/html' };
      if (nonce !== undefined) headers['X-CSP-Nonce'] = nonce;

      const response = await fetch(`${origin}/login`, { headers });
      const body = await response.text();

      expect(response.status).toBe(500);
      expect(body).not.toContain('__CSP_NONCE__');
    },
  );
});

describe('readRequiredPort', () => {
  const originalPort = process.env['PORT'];

  afterEach(() => {
    if (originalPort === undefined) {
      delete process.env['PORT'];
    } else {
      process.env['PORT'] = originalPort;
    }
  });

  it.each([undefined, '', '0', '-1', '1.5', 'not-a-port'])(
    'rejects a missing or non-positive integer PORT: %s',
    (port) => {
      if (port === undefined) {
        delete process.env['PORT'];
      } else {
        process.env['PORT'] = port;
      }

      expect(() => readRequiredPort()).toThrow();
    },
  );

  it('returns a configured positive integer PORT', () => {
    process.env['PORT'] = '4000';

    expect(readRequiredPort()).toBe(4000);
  });
});

describe('static runtime entrypoint', () => {
  it('keeps the Node static shell referenced after it begins listening', async () => {
    const runtimeBrowserDistFolder = await mkdtemp(join(tmpdir(), 'frontend-static-runtime-'));
    await writeFile(join(runtimeBrowserDistFolder, 'index.html'), INDEX_SHELL);
    const app = createStaticRuntimeApp({ browserDistFolder: runtimeBrowserDistFolder });
    const runtime = startStaticRuntimeServer({ app, port: 0 });

    try {
      await new Promise<void>((resolve, reject) => {
        runtime.once('listening', resolve);
        runtime.once('error', reject);
      });
      expect(runtime.ref()).toBe(runtime);
    } finally {
      await new Promise<void>((resolve, reject) => {
        runtime.close((error) => (error ? reject(error) : resolve()));
      });
      await rm(runtimeBrowserDistFolder, { recursive: true, force: true });
    }
  });
});
