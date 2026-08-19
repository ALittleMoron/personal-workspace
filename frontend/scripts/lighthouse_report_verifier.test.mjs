import assert from 'node:assert/strict';
import { mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { verifyLighthouseReports } from './lighthouse_report_verifier.mjs';

const expectedUrls = [
  'http://127.0.0.1:4210/login',
  'http://127.0.0.1:4210/',
];

test('accepts only fresh complete CSR Lighthouse reports for every configured route', async () => {
  const reportDirectory = await mkdtemp(join(tmpdir(), 'lighthouse-reports-'));
  const startedAtEpochMs = Date.now() - 1_000;

  try {
    await writeCompleteReportSet(reportDirectory, startedAtEpochMs);

    await verifyLighthouseReports({ reportDirectory, expectedUrls, runsPerUrl: 3, startedAtEpochMs });
  } finally {
    await rm(reportDirectory, { recursive: true, force: true });
  }
});

test('rejects duplicate route reports even when the total report count is correct', async () => {
  const reportDirectory = await mkdtemp(join(tmpdir(), 'lighthouse-reports-'));
  const startedAtEpochMs = Date.now() - 1_000;

  try {
    await writeCompleteReportSet(reportDirectory, startedAtEpochMs);
    await rm(join(reportDirectory, 'route-5.report.json'));
    await writeReport(
      reportDirectory,
      'duplicate.report.json',
      expectedUrls[0],
      expectedUrls[0],
      startedAtEpochMs,
    );

    await assert.rejects(
      verifyLighthouseReports({ reportDirectory, expectedUrls, runsPerUrl: 3, startedAtEpochMs }),
      /Expected exactly 3 Lighthouse reports for .*login, found 4/,
    );
  } finally {
    await rm(reportDirectory, { recursive: true, force: true });
  }
});

test('rejects reports that contain an SEO category', async () => {
  const reportDirectory = await mkdtemp(join(tmpdir(), 'lighthouse-reports-'));
  const startedAtEpochMs = Date.now() - 1_000;

  try {
    await writeCompleteReportSet(reportDirectory, startedAtEpochMs, { includeSeo: true });

    await assert.rejects(
      verifyLighthouseReports({ reportDirectory, expectedUrls, runsPerUrl: 3, startedAtEpochMs }),
      /unexpected categories: seo/,
    );
  } finally {
    await rm(reportDirectory, { recursive: true, force: true });
  }
});

async function writeCompleteReportSet(reportDirectory, startedAtEpochMs, options = {}) {
  const writes = [];
  let reportIndex = 0;
  for (const url of expectedUrls) {
    for (let run = 0; run < 3; run += 1) {
      writes.push(
        writeReport(
          reportDirectory,
          `route-${reportIndex}.report.json`,
          url,
          url,
          startedAtEpochMs,
          options,
        ),
      );
      writes.push(writeHtmlReport(reportDirectory, `route-${reportIndex}.report.html`, startedAtEpochMs));
      reportIndex += 1;
    }
  }
  await Promise.all(writes);
}

async function writeReport(
  reportDirectory,
  filename,
  requestedUrl,
  finalUrl,
  startedAtEpochMs,
  options = {},
) {
  const categories = {
    performance: { score: 1 },
    accessibility: { score: 1 },
    'best-practices': { score: 1 },
  };
  if (options.includeSeo === true) {
    categories.seo = { score: 1 };
  }

  const path = join(reportDirectory, filename);
  await writeFile(
    path,
    JSON.stringify({
      requestedUrl,
      finalUrl,
      finalDisplayedUrl: finalUrl,
      categories,
      audits: { 'performance-budget': { score: 1 } },
    }),
  );
  await utimes(path, startedAtEpochMs / 1_000, startedAtEpochMs / 1_000);
}

async function writeHtmlReport(reportDirectory, filename, startedAtEpochMs) {
  const path = join(reportDirectory, filename);
  await writeFile(path, '<!doctype html><title>Lighthouse</title>');
  await utimes(path, startedAtEpochMs / 1_000, startedAtEpochMs / 1_000);
}
