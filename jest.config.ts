import type { Config } from 'jest'

enum TEST_TYPE {
  Unit = 'unit',
  Func = 'func',
}

let testType: TEST_TYPE | undefined
if (process.argv.includes('--test-type=unit')) {
  testType = TEST_TYPE.Unit
} else if (process.argv.includes('--test-type=func')) {
  testType = TEST_TYPE.Func
}
if (testType === undefined) {
  throw Error(`Must supply --test-type argument with value of either "${TEST_TYPE.Unit}" or "${TEST_TYPE.Func}"`)
}

if (testType === TEST_TYPE.Func) {
  process.env.MONGO_DB = 'gwent-func'
}

const sharedConfig: Config = {
  clearMocks: true,
  coveragePathIgnorePatterns: ['.*build.*', '.*generated-typings.*'],
  moduleFileExtensions: ['js', 'json', 'node', 'ts', 'tsx'],
  modulePathIgnorePatterns: ['build'],
  preset: 'ts-jest',
  resetMocks: true,
  resetModules: true,
  restoreMocks: true,
  testPathIgnorePatterns: ['e2e'],
}

const config: Config = {
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
      collectCoverageFrom: ['**/src/**/*.ts'],
      testEnvironment: 'node',
      testMatch: [`**/*.${testType}.test.ts`],
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

export default config
