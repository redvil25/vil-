const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Test environment
  testEnvironment: 'jest-environment-jsdom',

  // Module path aliases (matching tsconfig.json)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Test match patterns
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],

  // Coverage configuration
  // Note: Next.js page components are tested via E2E (Playwright), not unit tests
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/*.spec.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    // Exclude Next.js app router files (tested via E2E)
    '!src/app/**/page.tsx',
    '!src/app/**/*Client.tsx',
    '!src/app/**/layout.tsx',
    '!src/app/**/error.tsx',
    '!src/app/**/loading.tsx',
    '!src/app/**/not-found.tsx',
    '!src/app/robots.ts',
    // Exclude provider wrappers (thin wrappers around libraries)
    '!src/components/providers/**',
    // Exclude YouTube API lib (server-side only, calls external API, tested via E2E)
    '!src/lib/youtube/**',
    // Exclude analytics (tested via E2E - see e2e/analytics.spec.ts)
    '!src/lib/analytics/**',
    '!src/lib/hooks/use-analytics.ts',
    '!src/types/analytics.ts',
    // Exclude feed.ts - thin wrapper around 'feed' npm package, cannot be mocked in jsdom
    // The logic is tested via feed.spec.ts using a test implementation
    '!src/lib/blog/feed.ts',
    // Exclude barrel export files (just re-exports, no logic)
    '!src/lib/blog/index.ts',
    '!src/components/blog/index.ts',
    '!src/components/comments/index.ts',
    '!src/components/moderation/index.ts',
    '!src/components/dashboard/index.ts',
    '!src/components/ads/index.ts',
    // Exclude blog components (tested via E2E, use MDX which requires special handling)
    '!src/components/blog/BlogArticle.tsx',
    '!src/components/blog/BlogHeader.tsx',
    '!src/components/blog/BlogPostCard.tsx',
    '!src/components/blog/MDXComponents.tsx',
    // Exclude dashboard components (tested via E2E - admin dashboard)
    '!src/components/dashboard/DashboardCharts.tsx',
    '!src/components/dashboard/StatCard.tsx',
    // Exclude AdSense components (third-party integration, tested manually)
    '!src/components/ads/AdSenseScript.tsx',
    '!src/components/ads/adsense-config.ts',
  ],

  // Coverage thresholds for testable code
  // Page components are tested via E2E (Playwright), not included here
  // API endpoints, components, utilities, and hooks are covered by unit tests
  // Current coverage: 80%+ statements, 72%+ branches, 78%+ functions, 80%+ lines
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 69,
      lines: 73,
      statements: 72,
    },
  },

  // Transform is handled by next/jest
  // No need to specify transform here

  // Ignore patterns
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/', '<rootDir>/e2e/'],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
