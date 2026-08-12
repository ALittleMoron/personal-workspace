import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const expectedCategories = new Set(['performance', 'accessibility', 'best-practices']);

export async function verifyLighthouseReports({
  reportDirectory,
  expectedUrls,
  runsPerUrl,
  startedAtEpochMs,
}) {
  const expectedUrlSet = new Set(expectedUrls);
  const expectedReportCount = expectedUrlSet.size * runsPerUrl;
  const entries = await readdir(reportDirectory, { withFileTypes: true });
  const jsonReports = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.report.json'));
  const htmlReports = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.report.html'));

  if (jsonReports.length !== expectedReportCount) {
    throw new Error(
      `Expected exactly ${expectedReportCount} JSON Lighthouse reports, found ${jsonReports.length}`,
    );
  }
  if (htmlReports.length !== expectedReportCount) {
    throw new Error(
      `Expected exactly ${expectedReportCount} HTML Lighthouse reports, found ${htmlReports.length}`,
    );
  }

  await assertFreshReports({
    reportDirectory,
    reports: [...jsonReports, ...htmlReports],
    startedAtEpochMs,
  });

  const routeCounts = new Map(expectedUrls.map((url) => [url, 0]));
  for (const reportFile of jsonReports) {
    const report = JSON.parse(await readFile(resolve(reportDirectory, reportFile.name), 'utf8'));
    if (
      !expectedUrlSet.has(report.requestedUrl) ||
      report.finalUrl !== report.requestedUrl ||
      report.finalDisplayedUrl !== report.requestedUrl
    ) {
      throw new Error(`Unexpected Lighthouse navigation in ${reportFile.name}`);
    }
    const categories = Object.keys(report.categories ?? {});
    const unexpectedCategories = categories.filter((category) => !expectedCategories.has(category));
    const missingCategories = [...expectedCategories].filter((category) => !categories.includes(category));
    if (unexpectedCategories.length > 0) {
      throw new Error(`Lighthouse report has unexpected categories: ${unexpectedCategories.join(', ')}`);
    }
    if (missingCategories.length > 0) {
      throw new Error(`Lighthouse report is missing categories: ${missingCategories.join(', ')}`);
    }
    if (Array.isArray(report.runWarnings) && report.runWarnings.length > 0) {
      throw new Error(`Lighthouse report has warnings: ${report.runWarnings.join('; ')}`);
    }
    routeCounts.set(report.requestedUrl, (routeCounts.get(report.requestedUrl) ?? 0) + 1);
  }

  for (const [url, count] of routeCounts) {
    if (count !== runsPerUrl) {
      throw new Error(`Expected exactly ${runsPerUrl} Lighthouse reports for ${url}, found ${count}`);
    }
  }
}

async function assertFreshReports({ reportDirectory, reports, startedAtEpochMs }) {
  for (const report of reports) {
    const metadata = await stat(resolve(reportDirectory, report.name));
    if (metadata.mtimeMs < startedAtEpochMs) {
      throw new Error(`Lighthouse report is stale: ${report.name}`);
    }
  }
}
