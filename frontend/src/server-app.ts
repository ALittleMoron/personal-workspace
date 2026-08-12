import express from 'express';
import { readFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { extname, join } from 'node:path';

const HASHED_JAVASCRIPT_OR_CSS_PATTERN = /-[a-z0-9_-]{8,}\.(?:css|js)$/i;
const IMMUTABLE_STATIC_CACHE_CONTROL = 'public, max-age=31536000, immutable';
const STABLE_STATIC_CACHE_CONTROL = 'public, max-age=15552000';
const CSP_NONCE_HEADER = 'x-csp-nonce';
const CSP_NONCE_PLACEHOLDER = '__CSP_NONCE__';
const CSP_NONCE_PATTERN = /^[A-Za-z0-9+/_-]{16,128}={0,2}$/;
const HTML_ACCEPT_PATTERN = /(?:^|[,;\s])(?:text\/html|application\/xhtml\+xml)(?:$|[,;\s])/i;

interface CreateExpressAppOptions {
  readonly browserDistFolder: string;
}

interface StartStaticServerOptions {
  readonly app: express.Express;
  readonly port: number;
}

export function createExpressApp(options: CreateExpressAppOptions): express.Express {
  const app = express();
  const indexShell = readFileSync(join(options.browserDistFolder, 'index.html'), 'utf8');
  const staticFiles = express.static(options.browserDistFolder, {
    maxAge: 0,
    index: false,
    redirect: false,
    setHeaders: setStaticCacheHeaders,
  });
  app.disable('x-powered-by');

  app.get('/healthz', (_req, res) => {
    res.status(200).type('text/plain').send('');
  });

  app.use((req, res, next) => {
    if (extname(req.path).toLowerCase() === '.html') {
      next();
      return;
    }
    staticFiles(req, res, next);
  });

  app.get('/{*splat}', (req, res, next) => {
    if (extname(req.path) !== '' || !acceptsHtml(req)) {
      next();
      return;
    }

    const nonce = req.get(CSP_NONCE_HEADER);
    if (!nonce || !CSP_NONCE_PATTERN.test(nonce)) {
      res.status(500).type('text/plain').send('Frontend shell unavailable.');
      return;
    }

    res
      .status(200)
      .type('html')
      .setHeader('Cache-Control', 'no-store')
      .send(indexShell.replaceAll(CSP_NONCE_PLACEHOLDER, nonce));
  });

  return app;
}

export function startStaticServer(options: StartStaticServerOptions): Server {
  const server = options.app.listen(options.port, () => {
    console.log(`Node Express server listening on http://localhost:${options.port}`);
  });
  server.ref();
  return server;
}

function acceptsHtml(req: express.Request): boolean {
  const accept = req.get('accept');
  return accept !== undefined && HTML_ACCEPT_PATTERN.test(accept) && req.accepts('html') === 'html';
}

function setStaticCacheHeaders(res: express.Response, filePath: string): void {
  const cacheControl = HASHED_JAVASCRIPT_OR_CSS_PATTERN.test(filePath)
    ? IMMUTABLE_STATIC_CACHE_CONTROL
    : STABLE_STATIC_CACHE_CONTROL;
  res.setHeader('Cache-Control', cacheControl);
}

export function readRequiredPort(): number {
  const rawPort = process.env['PORT']?.trim();
  if (!rawPort) {
    throw new Error('PORT is required for the frontend static runtime.');
  }
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive integer.');
  }
  return port;
}
