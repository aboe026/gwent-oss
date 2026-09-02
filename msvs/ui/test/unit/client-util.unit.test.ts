import path from 'path'
import replaceInFile from 'replace-in-file'

import ClientUtil from '../../src/client-util'
import * as env from '../../src/env'
import * as nodeUtils from '@gwent-oss/node-utils'

describe('client-util', () => {
  describe('getDirectory', () => {
    it('throws error if client directory does not exist', async () => {
      const clientDir = '/client-dir'
      await testGetDirectory({
        clientDir,
        fileExistsResponse: false,
        expected: Error(
          `Invalid client directory "${clientDir}", path either does not exist (potentially needs to be built) or is not accessible due to permissions.`
        ),
      })
    })
    it('returns client directory if absolute path', async () => {
      const clientDir = '/client-dir'
      await testGetDirectory({
        clientDir,
        fileExistsResponse: true,
        expected: clientDir,
      })
    })
    it('returns client directory if relative path', async () => {
      const clientDir = 'client-dir'
      const resolvedDir = path.join(__dirname, '..', '..', 'src', clientDir)
      await testGetDirectory({
        clientDir,
        fileExistsResponse: true,
        expected: resolvedDir,
        resolvedDir,
      })
    })
  })
  describe('setEnvVars', () => {
    it('throws error if the env file does not exist', async () => {
      const clientDir = '/client/dir'
      await testSetEnvVars({
        clientDir,
        fileExistsResponse: false,
        error: Error(
          `Client env file "${path.join(clientDir, 'dynamic-env.js')}" does not exist, ensure it has been built properly.`
        ),
      })
    })
    it('calls to replaceInFile if file exists', async () => {
      await testSetEnvVars({
        clientDir: '/client/dir',
        fileExistsResponse: true,
      })
    })
  })
})

async function testGetDirectory({
  clientDir,
  fileExistsResponse,
  expected,
  resolvedDir,
}: {
  clientDir: string
  fileExistsResponse: boolean
  expected: string | Error
  resolvedDir?: string
}) {
  jest.spyOn(env, 'default').mockReturnValue({
    CLIENT_DIR: clientDir,
  } as any)
  const fileExistsSpy = jest.spyOn(nodeUtils, 'fileExists').mockResolvedValue(fileExistsResponse)
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  ClientUtil['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
  } as any

  const promise = ClientUtil.getDirectory()
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(fileExistsSpy.mock.calls).toEqual([[resolvedDir || clientDir]])
  expect(debugSpy.mock.calls).toEqual([[`Client directory resolved to "${resolvedDir || clientDir}"`]])
  expect(traceSpy.mock.calls).toEqual([[`clientDir: "${clientDir}"`]])
}

async function testSetEnvVars({
  clientDir,
  fileExistsResponse,
  error,
}: {
  clientDir: string
  fileExistsResponse: boolean
  error?: Error
}) {
  const envFile = path.join(clientDir, 'dynamic-env.js')
  const apiUrl = 'http://localhost:4000'
  const emailAddress = 'james.bond@mi6.com'
  const githubLink = 'https://github.com/aboe026/gwent-oss'
  const webSocketPingIntervalSeconds = 5
  const fileExistsSpy = jest.spyOn(nodeUtils, 'fileExists').mockResolvedValue(fileExistsResponse)
  jest.spyOn(env, 'default').mockReturnValue({
    API_BASE_URL: apiUrl,
    EMAIL_ADDRESS: emailAddress,
    GITHUB_LINK: githubLink,
    WEB_SOCKET_PING_INTERVAL_SECONDS: webSocketPingIntervalSeconds,
  } as any)
  const traceSpy = jest.fn().mockImplementation()
  ClientUtil['logger'] = {
    trace: traceSpy,
  } as any
  const replaceInFileSpy = jest.spyOn(replaceInFile, 'replaceInFile').mockImplementation()

  const promise = ClientUtil.setEnvVars(clientDir)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(undefined)
  }

  expect(fileExistsSpy.mock.calls).toEqual([[envFile]])
  expect(traceSpy.mock.calls).toEqual([
    [`envFile: "${envFile}"`],
    [`env.API_BASE_URL: "${apiUrl}"`],
    [`env.EMAIL_ADDRESS: "${emailAddress}"`],
    [`env.GITHUB_LINK: "${githubLink}"`],
    [`env.WEB_SOCKET_PING_INTERVAL_SECONDS: "${webSocketPingIntervalSeconds}"`],
  ])
  expect(replaceInFileSpy.mock.calls).toEqual(
    error
      ? []
      : [
          [
            {
              files: [envFile],
              disableGlobs: true,
              from: /API_BASE_URL:(\s*)(['"]).*?(['"])/,
              to: `API_BASE_URL:$1$2${apiUrl}$3`,
            },
          ],
          [
            {
              files: [envFile],
              disableGlobs: true,
              from: /EMAIL_ADDRESS:(\s*)(['"]).*?(['"])/,
              to: `EMAIL_ADDRESS:$1$2${emailAddress}$3`,
            },
          ],
          [
            {
              files: [envFile],
              disableGlobs: true,
              from: /GITHUB_LINK:(\s*)(['"]).*?(['"])/,
              to: `GITHUB_LINK:$1$2${githubLink}$3`,
            },
          ],
          [
            {
              files: [envFile],
              disableGlobs: true,
              from: /WEB_SOCKET_PING_INTERVAL_SECONDS:(\s*)(['"]).*?(['"])/,
              to: `WEB_SOCKET_PING_INTERVAL_SECONDS:$1$2${webSocketPingIntervalSeconds}$3`,
            },
          ],
        ]
  )
}
