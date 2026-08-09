import { createReadStream, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';

const port = 4210;
const root = resolve('dist/personal-workspace-frontend/browser');
const indexPath = resolve(root, 'index.html');
const languages = {
  defaultLanguage: 'ru',
  languages: [
    { code: 'ru', label: 'Русский' },
    { code: 'en', label: 'English' },
  ],
};
const bundles = {
  ru: {
    language: 'ru',
    messages: {
      'app.name': 'Персональное рабочее пространство',
      'foundation.title': 'Рабочее пространство готово',
      'foundation.description': 'Базовая инфраструктура подключена.',
      'language.label': 'Язык',
      'theme.toggle': 'Сменить тему',
      'theme.light': 'Светлая тема',
      'theme.dark': 'Тёмная тема',
      'shared.close': 'Закрыть',
      'shared.empty': 'Ничего не найдено.',
      'shared.loading': 'Загрузка',
      'shared.retry': 'Повторить',
      'error.generic': 'Произошла ошибка.',
      'error.notFound': 'Страница не найдена.',
    },
  },
  en: {
    language: 'en',
    messages: {
      'app.name': 'Personal Workspace',
      'foundation.title': 'Workspace is ready',
      'foundation.description': 'The foundation infrastructure is connected.',
      'language.label': 'Language',
      'theme.toggle': 'Toggle theme',
      'theme.light': 'Light theme',
      'theme.dark': 'Dark theme',
      'shared.close': 'Close',
      'shared.empty': 'Nothing found.',
      'shared.loading': 'Loading',
      'shared.retry': 'Retry',
      'error.generic': 'Something went wrong.',
      'error.notFound': 'Page not found.',
    },
  },
};
const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
]);

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  const cspNonce = randomBytes(18).toString('base64url');
  response.setHeader('Content-Security-Policy', createContentSecurityPolicy(cspNonce));

  if (pathname === '/api/i18n/languages') {
    sendJson(response, languages);
    return;
  }

  const bundleMatch = pathname.match(/^\/api\/i18n\/bundles\/(ru|en)$/);
  if (bundleMatch !== null) {
    sendJson(response, bundles[bundleMatch[1]]);
    return;
  }

  if (pathname.startsWith('/api/')) {
    response.statusCode = 404;
    sendJson(response, { detail: 'Not found' });
    return;
  }

  const candidate = resolve(root, '.' + pathname);
  const path = candidate.startsWith(root + '/') && isFile(candidate) ? candidate : indexPath;
  response.setHeader('Content-Type', contentTypes.get(extname(path)) ?? 'application/octet-stream');

  if (path === indexPath) {
    response.setHeader('Cache-Control', 'no-store');
    response.end(readFileSync(indexPath, 'utf8').replaceAll('__CSP_NONCE__', cspNonce));
    return;
  }

  createReadStream(path)
    .on('error', () => {
      response.statusCode = 500;
      response.end();
    })
    .pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log('Lighthouse fixture ready on http://127.0.0.1:' + port);
});

function sendJson(response, body) {
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(body));
}

function createContentSecurityPolicy(cspNonce) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src 'self' 'nonce-${cspNonce}'`,
    `style-src 'self' 'nonce-${cspNonce}'`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
  ].join('; ');
}

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}
