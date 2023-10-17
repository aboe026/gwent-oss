import type { Config } from 'jest'

let testType = ''
if (process.argv.includes('--test-type=unit')) {
  testType = 'unit'
} else if (process.argv.includes('--test-type=func')) {
  testType = 'func'
} else {
  throw Error(`Must supply --test-type argument with value of either "unit" or "func"`)
}

const allTestsGlob = `**/*.${testType}.test.ts`
const clientTestsGlob = `**/client/${allTestsGlob}`

if (testType === 'func') {
  process.env.MONGO_DB = 'gwent-func'
}

const sharedConfig: Config = {
  clearMocks: true,
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  modulePathIgnorePatterns: ['build', 'svcs/ui/libs/client/libs/env/src/dynamic-env.ts'], // TODO: figure out why dynamic-env.ts file causes errors with coverage
  preset: 'ts-jest',
  resetMocks: true,
  resetModules: true,
  restoreMocks: true,
  testPathIgnorePatterns: ['e2e'],
}

const config: Config = {
  collectCoverage: true,
  collectCoverageFrom: ['**/src/**/*', '!**/build/**/*', '!**/generated-typings.ts'],
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
      testEnvironment: 'node',
      testMatch: [`!${clientTestsGlob}`, allTestsGlob],
    },
    {
      ...sharedConfig,
      testEnvironment: 'jsdom',
      testMatch: [clientTestsGlob],
    },
  ],
}

if (testType === 'func') {
  config.testTimeout = 30000
}

export default config
