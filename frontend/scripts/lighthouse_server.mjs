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
const lighthouseAuthenticatedHeader = 'x-lighthouse-authenticated';
const lighthouseAuthenticatedValue = 'owner';

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
  await verifyDashboardFixtures();
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
  const child = spawn(process.execPath, ['dist/personal-workspace-frontend/runtime/static-runtime.js'], {
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

    if (incoming.method === 'GET' && url.pathname === '/api/auth/session') {
      if (!hasFixtureAuthentication(incoming)) {
        return sendJson(outgoing, 401, { detail: 'Anonymous Lighthouse fixture session.' });
      }
      return sendJson(outgoing, 200, { username: lighthouseAuthenticatedValue });
    }

    if (incoming.method === 'GET' && url.pathname === '/api/calendar') {
      if (!hasFixtureAuthentication(incoming)) {
        return sendJson(outgoing, 401, { detail: 'Anonymous Lighthouse fixture dashboard request.' });
      }
      const calendar = calendarFixture(url);
      if (calendar === null) {
        return sendJson(outgoing, 400, { detail: 'Calendar fixture requires referenceDate and window.' });
      }
      return sendJson(outgoing, 200, calendar);
    }

    if (incoming.method === 'GET' && url.pathname === '/api/tools/cache') {
      if (!hasFixtureAuthentication(incoming)) {
        return sendJson(outgoing, 401, { detail: 'Anonymous Lighthouse fixture dashboard request.' });
      }
      return sendJson(outgoing, 200, cacheStatusFixture());
    }

    if (url.pathname.startsWith('/api/')) {
      return sendJson(outgoing, 404, { detail: 'Unsupported Lighthouse fixture API route.' });
    }

    return forwardToShell(incoming, outgoing);
  });
}

function hasFixtureAuthentication(incoming) {
  return incoming.headers[lighthouseAuthenticatedHeader] === lighthouseAuthenticatedValue;
}

function calendarFixture(url) {
  const referenceDate = url.searchParams.get('referenceDate');
  const window = url.searchParams.get('window');
  if (
    referenceDate === null ||
    !/^\d{4}-\d{2}-\d{2}$/.test(referenceDate) ||
    (window !== 'month' && window !== 'currentAndNextMonths')
  ) {
    return null;
  }
  return {
    referenceDate,
    window,
    summary: { memorableDateCount: 0, birthdayCount: 0 },
    entries: [],
  };
}

function cacheStatusFixture() {
  return {
    enabled: true,
    configuredTtlSeconds: 86400,
    scheduledWarmIntervalSeconds: 3600,
    domains: [
      {
        domain: 'i18n',
        keyCount: 2,
        minimumRemainingTtlSeconds: 3600,
        nonExpiringKeyCount: 0,
      },
    ],
    lastManualWarmOperation: {
      operationId: 'lighthouse-cache-warm',
      status: 'succeeded',
      queuedAt: '2026-08-19T00:00:00Z',
      summary: { attempted: 2, written: 2, skipped: 0 },
    },
  };
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

async function verifyDashboardFixtures() {
  const authenticatedHeaders = { [lighthouseAuthenticatedHeader]: lighthouseAuthenticatedValue };
  const anonymousSession = await fetch(`http://127.0.0.1:${lighthousePort}/api/auth/session`);
  if (anonymousSession.status !== 401) {
    throw new Error('Lighthouse anonymous session fixture did not return 401');
  }

  const authenticatedSession = await fetch(`http://127.0.0.1:${lighthousePort}/api/auth/session`, {
    headers: authenticatedHeaders,
  });
  const authenticatedUser = await authenticatedSession.json();
  if (!authenticatedSession.ok || authenticatedUser.username !== lighthouseAuthenticatedValue) {
    throw new Error('Lighthouse authenticated session fixture returned an invalid contract');
  }

  const anonymousCalendar = await fetch(
    `http://127.0.0.1:${lighthousePort}/api/calendar?referenceDate=2026-08-19&window=month`,
  );
  if (anonymousCalendar.status !== 401) {
    throw new Error('Lighthouse anonymous calendar fixture did not return 401');
  }

  for (const window of ['month', 'currentAndNextMonths']) {
    const calendarResponse = await fetch(
      `http://127.0.0.1:${lighthousePort}/api/calendar?referenceDate=2026-08-19&window=${window}`,
      { headers: authenticatedHeaders },
    );
    const calendar = await calendarResponse.json();
    if (
      !calendarResponse.ok ||
      calendar.referenceDate !== '2026-08-19' ||
      calendar.window !== window ||
      calendar.summary?.memorableDateCount !== 0 ||
      calendar.summary?.birthdayCount !== 0 ||
      !Array.isArray(calendar.entries) ||
      calendar.entries.length !== 0
    ) {
      throw new Error('Lighthouse calendar fixture returned an invalid contract');
    }
  }

  const anonymousCache = await fetch(`http://127.0.0.1:${lighthousePort}/api/tools/cache`);
  if (anonymousCache.status !== 401) {
    throw new Error('Lighthouse anonymous cache fixture did not return 401');
  }

  const cacheResponse = await fetch(`http://127.0.0.1:${lighthousePort}/api/tools/cache`, {
    headers: authenticatedHeaders,
  });
  const cache = await cacheResponse.json();
  if (
    !cacheResponse.ok ||
    cache.enabled !== true ||
    cache.configuredTtlSeconds !== 86400 ||
    cache.scheduledWarmIntervalSeconds !== 3600 ||
    !Array.isArray(cache.domains) ||
    cache.domains.length !== 1 ||
    cache.domains[0]?.domain !== 'i18n' ||
    cache.domains[0]?.keyCount !== 2 ||
    cache.domains[0]?.minimumRemainingTtlSeconds !== 3600 ||
    cache.domains[0]?.nonExpiringKeyCount !== 0 ||
    cache.lastManualWarmOperation?.operationId !== 'lighthouse-cache-warm' ||
    cache.lastManualWarmOperation?.status !== 'succeeded' ||
    cache.lastManualWarmOperation?.queuedAt !== '2026-08-19T00:00:00Z' ||
    cache.lastManualWarmOperation?.summary?.attempted !== 2 ||
    cache.lastManualWarmOperation?.summary?.written !== 2 ||
    cache.lastManualWarmOperation?.summary?.skipped !== 0
  ) {
    throw new Error('Lighthouse cache fixture returned an invalid contract');
  }
}

async function verifyCompiledShellDocument() {
  const response = await fetch(
    `http://127.0.0.1:${lighthousePort}/login`,
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
