const config = {
  verbose: true,
  testEnvironment: 'node',
  testRegex: 'src/test/.*\\.test\\.ts$',
  transform: {
    // transpilation: true is needed to avoid warnigns. However we lose TS
    // checks. We don't care since we have TS tasks for that.
    // See https://kulshekhar.github.io/ts-jest/docs/getting-started/options/transpilation
    '^.+\\.ts?$': ['ts-jest', { transpilation: true }],
  },
  coverageDirectory: 'coverage',
  coverageReporters: ['lcov', 'text-summary'],
  coveragePathIgnorePatterns: ['src/test'],
  cacheDirectory: '.cache/jest',
};

export default config;
