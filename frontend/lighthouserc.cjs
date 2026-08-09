const LHCI_ORIGIN = 'http://127.0.0.1:4210';

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/lhci_fixture.mjs',
      startServerReadyPattern: 'Lighthouse fixture ready',
      startServerReadyTimeout: 60000,
      numberOfRuns: 3,
      url: [`${LHCI_ORIGIN}/`],
      settings: { preset: 'desktop', budgetPath: './lighthouse/budgets.json' },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9, aggregationMethod: 'median' }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
      },
    },
    upload: { target: 'filesystem', outputDir: './performance/reports/lighthouse' },
  },
};
