import path from 'path'

describe('app-info', () => {
  describe('getFile', () => {
    it('returns unmodified file path if absolute', () => {
      const filePath = '/absolute/path'
      testGetPath({
        filePath,
        expectedPath: filePath,
      })
    })
    it('returns absolute path if given relative one', () => {
      const filePath = 'relative/path'
      testGetPath({
        filePath,
        expectedPath: path.join(__dirname, '../../src', filePath),
      })
    })
  })
  describe('getBuildNumber', () => {
    it('returns 0 and logs error if file does not exist', async () => {
      const filePath = 'path/to/app-info.json'
      await testGetBuildNumber({
        filePath,
        fileExists: false,
        errors: [[`Invalid "APP_INFO_FILE_PATH" value of "${filePath}", does not exist or cannot access.`]],
      })
    })
    it('returns 0 and logs error if file cannot be read', async () => {
      const filePath = 'path/to/app-info.json'
      const error = 'access denied'
      await testGetBuildNumber({
        filePath,
        fileReadError: error,
        errors: [[`Could not read "APP_INFO_FILE_PATH" file "${filePath}":`, error]],
      })
    })
    it('returns 0 and logs error if file cannot be parsed as JSON', async () => {
      const filePath = 'path/to/app-info.json'
      const error = SyntaxError('Unexpected token i in JSON at position 0')
      const contents = 'invalid json'
      await testGetBuildNumber({
        filePath,
        fileContents: contents,
        errors: [[`Could not parse "APP_INFO_FILE_PATH" file "${filePath}" contents "${contents}" as JSON:`, error]],
      })
    })
    it('returns 0 and logs error if buildNumber property not in JSON', async () => {
      const filePath = 'path/to/app-info.json'
      const contents = JSON.stringify({})
      await testGetBuildNumber({
        filePath,
        fileContents: contents,
        errors: [
          [
            `Invalid JSON "${contents}" found in "APP_INFO_FILE_PATH" file "${filePath}", does not contain "buildNumber" property`,
          ],
        ],
      })
    })
    it('returns 0 and logs error if buildNumber property not numeric', async () => {
      const filePath = 'path/to/app-info.json'
      const contents = {
        buildNumber: '1',
      }
      await testGetBuildNumber({
        filePath,
        fileContents: JSON.stringify(contents),
        errors: [
          [
            `Invalid buildNumber "${contents.buildNumber}" found in "APP_INFO_FILE_PATH" file "${filePath}", type "string" not of required type "number"`,
          ],
        ],
      })
    })
    it('returns 0 and logs error if buildNumber property not an integer', async () => {
      const filePath = 'path/to/app-info.json'
      const contents = {
        buildNumber: 1.5,
      }
      await testGetBuildNumber({
        filePath,
        fileContents: JSON.stringify(contents),
        errors: [
          [
            `Invalid buildNumber "${contents.buildNumber}" found in "APP_INFO_FILE_PATH" file "${filePath}", not an integer`,
          ],
        ],
      })
    })
    it('returns 0 and logs error if buildNumber property not greater than zero', async () => {
      const filePath = 'path/to/app-info.json'
      const contents = {
        buildNumber: -1,
      }
      await testGetBuildNumber({
        filePath,
        fileContents: JSON.stringify(contents),
        errors: [
          [
            `Invalid buildNumber "${contents.buildNumber}" found in "APP_INFO_FILE_PATH" file "${filePath}", must be positive integer`,
          ],
        ],
      })
    })
    it('returns buildNumber if positive integer', async () => {
      const filePath = 'path/to/app-info.json'
      const contents = {
        buildNumber: 1,
      }
      await testGetBuildNumber({
        filePath,
        fileContents: JSON.stringify(contents),
        expected: 1,
      })
    })
    it('traces out contents if log level is trace', async () => {
      const filePath = 'path/to/app-info.json'
      const contents = {
        buildNumber: 1,
      }
      await testGetBuildNumber({
        filePath,
        fileContents: JSON.stringify(contents),
        traceEnabled: true,
        expected: 1,
      })
    })
  })
})

function testGetPath({ filePath, expectedPath }: { filePath: string; expectedPath: string }) {
  jest.mock('../../src/env', () => ({
    APP_INFO_FILE_PATH: filePath,
  }))
  const traceSpy = jest.fn().mockImplementation()
  jest.mock('log4js', () => ({
    getLogger: jest.fn().mockReturnValue({
      trace: traceSpy,
    }),
  }))
  const AppInfo = require('../../src/app-info').default // eslint-disable-line @typescript-eslint/no-var-requires

  expect(AppInfo.getFile()).toEqual(expectedPath)

  expect(traceSpy.mock.calls).toEqual([[`APP_INFO_FILE_PATH: "${filePath}"`]])
}

async function testGetBuildNumber({
  filePath,
  fileExists = true,
  fileReadError,
  fileContents,
  errors = [],
  traceEnabled,
  expected = 0,
}: {
  filePath: string
  fileExists?: boolean
  fileReadError?: string
  fileContents?: string
  errors?: (string | Error)[][]
  traceEnabled?: boolean
  expected?: number
}) {
  jest.mock('fs-extra', () => ({
    pathExists: jest.fn().mockImplementation(() => Promise.resolve(fileExists)),
    readFile: jest
      .fn()
      .mockImplementation(() => (fileReadError ? Promise.reject(fileReadError) : Promise.resolve(fileContents))),
  }))
  const debugSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  jest.mock('log4js', () => ({
    getLogger: jest.fn().mockReturnValue({
      error: errorSpy,
      debug: debugSpy,
      isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
      trace: traceSpy,
    }),
  }))
  const AppInfo = require('../../src/app-info').default // eslint-disable-line @typescript-eslint/no-var-requires
  jest.spyOn(AppInfo, 'getFile').mockReturnValue(filePath)

  await expect(AppInfo.getBuildNumber()).resolves.toEqual(expected)

  expect(debugSpy.mock.calls).toEqual([[`filePath: "${filePath}"`]])
  expect(errorSpy.mock.calls).toEqual(errors)
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`contents: "${JSON.stringify(fileContents)}"`]] : [])
}
