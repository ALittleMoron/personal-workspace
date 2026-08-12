import { join } from 'node:path';
import { createExpressApp, readRequiredPort, startStaticServer } from './server-app';

const browserDistFolder = join(__dirname, '../browser');
const app = createExpressApp({ browserDistFolder });
const port = readRequiredPort();

startStaticServer({ app, port });
