const path = require('path') // eslint-disable-line @typescript-eslint/no-require-imports

const TEST_TYPE = {
  Unit: 'unit',
  Func: 'func',
}

let testType
if (process.argv.includes('--test-type=unit')) {
  testType = TEST_TYPE.Unit
} else if (process.argv.includes('--test-type=func')) {
  testType = TEST_TYPE.Func
}
if (testType === undefined) {
  throw Error(`Must supply --test-type argument with value of either "${TEST_TYPE.Unit}" or "${TEST_TYPE.Func}".`)
}

if (testType === TEST_TYPE.Func) {
  process.env.MONGO_DB = 'gwent-func'
}

const sharedConfig = {
  clearMocks: true,
  coveragePathIgnorePatterns: ['.*build.*', '.*generated.*', '.*test.*'],
  extensionsToTreatAsEsm: ['.mts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  moduleFileExtensions: ['mts', 'mjs', 'ts', 'js', 'tsx', 'json', 'node'],
  modulePathIgnorePatterns: ['build'],
  // preset: 'ts-jest',
  resetMocks: true,
  resetModules: true,
  restoreMocks: true,
  resolver: path.join('D:\\Repos\\gwent', 'jest-resolver.cjs'), // '<rootDir>/jest-resolver.cjs',
  testPathIgnorePatterns: ['e2e'],
  // testRegex: '.*\\.test\\.mts$',
  transform: {
    '^.+\\.(mt|t|cj|j)s$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
}

const config = {
  collectCoverage: true,
  coverageDirectory: `<rootDir>/coverage/${testType}`,
  coverageReporters: ['cobertura', 'lcov'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        ancestorSeparator: ' - ',
        classNameTemplate: `${testType}.{classname}`,
        outputDirectory: 'test-results',
        outputName: `${testType}.xml`,
        titleTemplate: '{title}',
      },
    ],
  ],
  projects: [
    {
      ...sharedConfig,
      collectCoverageFrom: ['**/src/**/*.mts'],
      testEnvironment: 'node',
      testMatch: [`**/*.${testType}.test.mts`],
    },
    {
      ...sharedConfig,
      collectCoverageFrom: ['**/src/**/*.tsx'],
      testEnvironment: 'jsdom',
      testMatch: [`**/*.${testType}.test.tsx`],
    },
  ],
}

if (testType === TEST_TYPE.Func) {
  config.testTimeout = 30000
}

module.exports = config
