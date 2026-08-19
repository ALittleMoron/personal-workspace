const LHCI_ORIGIN = 'http://127.0.0.1:4210';
const collectMode = process.env.LHCI_COLLECT_MODE ?? 'anonymous';
const collectTarget =
  collectMode === 'authenticated'
    ? {
        url: `${LHCI_ORIGIN}/admin-panel/dashboard`,
        extraHeaders: {
          'x-csp-nonce': 'lighthouse-csp-nonce',
          'x-lighthouse-authenticated': 'owner',
        },
      }
    : {
        url: `${LHCI_ORIGIN}/login`,
        extraHeaders: {
          'x-csp-nonce': 'lighthouse-csp-nonce',
        },
      };

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/lighthouse_server.mjs',
      startServerReadyPattern: 'Lighthouse server ready',
      startServerReadyTimeout: 60000,
      numberOfRuns: 3,
      url: [collectTarget.url],
      settings: {
        preset: 'desktop',
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
        budgetPath: './lighthouse/budgets.json',
        extraHeaders: collectTarget.extraHeaders,
      },
    },
    assert: {
      assertions: {
        'categories:performance': [
          'error',
          { minScore: 0.9, aggregationMethod: 'median' },
        ],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'resource-summary:total:size': ['error', { maxNumericValue: 1638400 }],
        'resource-summary:script:size': ['error', { maxNumericValue: 1331200 }],
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 307200 }],
        'resource-summary:image:size': ['error', { maxNumericValue: 102400 }],
        'resource-summary:third-party:count': ['error', { maxNumericValue: 0 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './performance/reports/lighthouse',
    },
  },
};
