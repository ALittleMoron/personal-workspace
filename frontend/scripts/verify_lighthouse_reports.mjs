import { resolve } from 'node:path';

import { verifyLighthouseReports } from './lighthouse_report_verifier.mjs';

const origin = 'http://127.0.0.1:4210';
const expectedUrls = [
  `${origin}/login`,
  `${origin}/`,
];

await verifyLighthouseReports({
  reportDirectory: resolve(process.argv[2] ?? ''),
  expectedUrls,
  runsPerUrl: 3,
  startedAtEpochMs: Number(process.argv[3]),
});
console.log('Verified 6 fresh CSR Lighthouse reports.');
