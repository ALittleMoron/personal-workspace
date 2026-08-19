import { join } from 'node:path';
import {
  createStaticRuntimeApp,
  readRequiredPort,
  startStaticRuntimeServer,
} from './static-runtime-app';

const browserDistFolder = join(__dirname, '../browser');
const app = createStaticRuntimeApp({ browserDistFolder });
const port = readRequiredPort();
const staticRuntime = startStaticRuntimeServer({ app, port });

staticRuntime.on('error', (error) => {
  throw error;
});
