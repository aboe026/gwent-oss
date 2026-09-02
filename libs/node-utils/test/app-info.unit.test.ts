import fs from 'fs/promises'
import path from 'path'

import AppInfo from '../src/app-info'
import * as fileExists from '../src/file-exists'

describe('app-info', () => {
  describe('resolvePath', () => {
    it('returns unmodified file path if already absolute', () => {
      const filePath = '/absolute/path'
      testResolvePath({
        appInfoFilePath: filePath,
        expectedPath: filePath,
      })
    })
    it('returns to absolute path if given relative one', () => {
      const filePath = 'relative/path'
      const cwd = '/absolute/path'
      testResolvePath({
        appInfoFilePath: filePath,
        cwdResponse: cwd,
        expectedPath: path.join(cwd, filePath),
      })
    })
  })
  describe('getBuildNumber', () => {
    it('returns 0 and logs error if file does not exist', async () => {
      const filePath = 'path/to/app-info.json'
      await testGetBuildNumber({
        filePath,
        fileExistsResponse: false,
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
      const error = SyntaxError(`Unexpected token 'i', "invalid json" is not valid JSON`)
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

function testResolvePath({
  appInfoFilePath,
  cwdResponse,
  expectedPath,
}: {
  appInfoFilePath: string
  cwdResponse?: string
  expectedPath: string
}) {
  const cwdSpy = jest.spyOn(process, 'cwd')
  if (cwdResponse) {
    cwdSpy.mockReturnValue(cwdResponse)
  }
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  AppInfo['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
  } as any

  expect(AppInfo['resolvePath'](appInfoFilePath)).toEqual(expectedPath)

  expect(cwdSpy.mock.calls).toEqual(cwdResponse ? [[]] : [])
  expect(debugSpy.mock.calls).toEqual(cwdResponse ? [[`Making appInfoFilePath absolute to: "${cwdResponse}"`]] : [])
  expect(traceSpy.mock.calls).toEqual([[`appInfoFilePath: "${appInfoFilePath}"`]])
}

async function testGetBuildNumber({
  filePath,
  fileExistsResponse = true,
  fileReadError,
  fileContents,
  errors = [],
  traceEnabled,
  expected = 0,
}: {
  filePath: string
  fileExistsResponse?: boolean
  fileReadError?: string
  fileContents?: string
  errors?: (string | Error)[][]
  traceEnabled?: boolean
  expected?: number
}) {
  const appInfoFilePath = ''
  const getFileSpy = jest.spyOn(AppInfo as any, 'resolvePath').mockReturnValue(filePath)
  const pathExistsSpy = jest.spyOn(fileExists, 'default').mockResolvedValue(fileExistsResponse)
  const readFileSpy = jest.spyOn(fs, 'readFile')
  if (fileReadError) {
    readFileSpy.mockRejectedValue(fileReadError)
  } else if (fileContents) {
    readFileSpy.mockResolvedValue(fileContents)
  }
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  AppInfo['logger'] = {
    error: errorSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(AppInfo.getBuildNumber(appInfoFilePath)).resolves.toEqual(expected)

  expect(getFileSpy.mock.calls).toEqual([[appInfoFilePath]])
  expect(pathExistsSpy.mock.calls).toEqual([[filePath]])
  expect(readFileSpy.mock.calls).toEqual(fileExistsResponse ? [[filePath, 'utf-8']] : [])
  expect(errorSpy.mock.calls).toEqual(errors)
  const traceCalls = [[`filePath: "${filePath}"`]]
  if (traceEnabled) {
    traceCalls.push([`contents: "${fileContents}"`])
  }
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
