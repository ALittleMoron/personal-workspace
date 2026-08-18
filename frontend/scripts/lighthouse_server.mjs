import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer, request } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { assertLighthouseI18nFixture, lighthouseI18nBundles } from '../lighthouse/i18n-fixture.mjs';

const frontendDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const lighthousePort = 4210;
const shellPort = 4211;
const shellHealthUrl = `http://127.0.0.1:${shellPort}/healthz`;
const lighthouseNonce = 'lighthouse-csp-nonce';

let shell;
let proxy;
let shuttingDown = false;

try {
  assertLighthouseI18nFixture();
  shell = startShell();
  await waitForHealth(shellHealthUrl);
  proxy = createProxy();
  await listen(proxy, lighthousePort);
  await verifyI18nEndpoints();
  await verifyCompiledShellDocument();
  console.log(`Lighthouse server ready on http://127.0.0.1:${lighthousePort}`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  await shutdown();
  process.exitCode = 1;
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function startShell() {
  const child = spawn(process.execPath, ['dist/personal-workspace-frontend/server/server.js'], {
    cwd: frontendDir,
    env: { ...process.env, PORT: String(shellPort) },
    stdio: 'inherit',
  });

  child.once('exit', (code, signal) => {
    if (!shuttingDown) {
      console.error(`Compiled frontend shell exited unexpectedly (code=${code}, signal=${signal})`);
      process.exitCode = 1;
      void shutdown();
    }
  });

  return child;
}

function createProxy() {
  return createServer((incoming, outgoing) => {
    const url = new URL(incoming.url ?? '/', `http://127.0.0.1:${lighthousePort}`);

    if (incoming.method === 'GET' && url.pathname === '/api/i18n/languages') {
      return sendJson(outgoing, 200, {
        defaultLanguage: 'ru',
        languages: [
          { code: 'ru', label: 'Русский' },
          { code: 'en', label: 'English' },
        ],
      });
    }

    const bundleMatch = /^\/api\/i18n\/bundles\/(ru|en)$/.exec(url.pathname);
    if (incoming.method === 'GET' && bundleMatch) {
      const language = bundleMatch[1];
      return sendJson(outgoing, 200, { language, messages: lighthouseI18nBundles[language] });
    }

    if (url.pathname.startsWith('/api/')) {
      return sendJson(outgoing, 404, { detail: 'Unsupported Lighthouse fixture API route.' });
    }

    return forwardToShell(incoming, outgoing);
  });
}

function forwardToShell(incoming, outgoing) {
  const upstream = request(
    {
      host: '127.0.0.1',
      port: shellPort,
      path: incoming.url,
      method: incoming.method,
      headers: incoming.headers,
    },
    (response) => {
      outgoing.writeHead(response.statusCode ?? 502, response.headers);
      response.pipe(outgoing);
    },
  );
  upstream.once('error', (error) => {
    if (!outgoing.headersSent) {
      sendJson(outgoing, 502, { detail: `Compiled frontend shell is unavailable: ${error.message}` });
    } else {
      outgoing.destroy(error);
    }
  });
  incoming.pipe(upstream);
}

function sendJson(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

async function waitForHealth(url) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.status === 200) return;
    } catch {
      // The compiled shell is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Compiled frontend shell did not become healthy at ${url}`);
}

async function verifyI18nEndpoints() {
  const languageResponse = await fetch(`http://127.0.0.1:${lighthousePort}/api/i18n/languages`);
  if (!languageResponse.ok) throw new Error('Lighthouse i18n language endpoint is unavailable');

  const languages = await languageResponse.json();
  if (languages.defaultLanguage !== 'ru' || languages.languages?.length !== 2) {
    throw new Error('Lighthouse i18n language endpoint returned an invalid contract');
  }

  for (const language of ['ru', 'en']) {
    const response = await fetch(`http://127.0.0.1:${lighthousePort}/api/i18n/bundles/${language}`);
    const bundle = await response.json();
    if (!response.ok || bundle.language !== language || typeof bundle.messages !== 'object') {
      throw new Error(`Lighthouse ${language} i18n bundle endpoint returned an invalid contract`);
    }
  }
}

async function verifyCompiledShellDocument() {
  const response = await fetch(
    `http://127.0.0.1:${lighthousePort}/ru/how-this-site-is-built`,
    {
      headers: {
        accept: 'text/html',
        'x-csp-nonce': lighthouseNonce,
      },
    },
  );
  const html = await response.text();
  if (!response.ok || !html.includes(`nonce="${lighthouseNonce}"`)) {
    throw new Error('Compiled frontend shell did not inject the Lighthouse CSP nonce');
  }
  if (html.includes('__CSP_NONCE__')) {
    throw new Error('Compiled frontend shell left the CSP nonce placeholder unresolved');
  }
}

async function listen(server, port) {
  server.listen(port, '127.0.0.1');
  await once(server, 'listening');
}

async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  await new Promise((resolve) => proxy?.close(resolve) ?? resolve());
  shell?.kill('SIGTERM');
}
