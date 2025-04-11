import fs from 'fs-extra'
import path from 'path'
import replaceInFile from 'replace-in-file'

import ClientUtil from '../../src/client-util'
import * as env from '../../src/env'

describe('client-util', () => {
  describe('getDirectory', () => {
    it('throws error if client directory does not exist', async () => {
      const clientDir = '/path/to/dir'
      const pathExistsSpy = jest.spyOn(fs, 'pathExists').mockImplementation(() => Promise.resolve(false))
      jest.spyOn(env, 'default').mockReturnValue({
        CLIENT_DIR: clientDir,
      } as any)
      const debugSpy = jest.fn().mockImplementation()
      const traceSpy = jest.fn().mockImplementation()
      ClientUtil['logger'] = {
        debug: debugSpy,
        trace: traceSpy,
      } as any

      await expect(ClientUtil.getDirectory()).rejects.toThrow(
        `Invalid client directory "${clientDir}", path either does not exist (potentially needs to be built) or is not accessible due to permissions.`
      )

      expect(pathExistsSpy.mock.calls).toEqual([[clientDir]])
      expect(debugSpy.mock.calls).toEqual([[`Client directory resolved to "${clientDir}"`]])
      expect(traceSpy.mock.calls).toEqual([[`clientDir: "${clientDir}"`]])
    })
    it('returns client directory if absolute path', async () => {
      const clientDir = '/path/to/dir'
      const pathExistsSpy = jest.spyOn(fs, 'pathExists').mockImplementation(() => Promise.resolve(true))
      jest.spyOn(env, 'default').mockReturnValue({
        CLIENT_DIR: clientDir,
      } as any)
      const debugSpy = jest.fn().mockImplementation()
      const traceSpy = jest.fn().mockImplementation()
      ClientUtil['logger'] = {
        debug: debugSpy,
        trace: traceSpy,
      } as any

      await expect(ClientUtil.getDirectory()).resolves.toEqual(clientDir)

      expect(pathExistsSpy.mock.calls).toEqual([[clientDir]])
      expect(debugSpy.mock.calls).toEqual([[`Client directory resolved to "${clientDir}"`]])
      expect(traceSpy.mock.calls).toEqual([[`clientDir: "${clientDir}"`]])
    })
    it('returns client directory if relative path', async () => {
      const clientDir = 'path/to/dir'
      const resolvedDir = path.join(__dirname, '..', '..', 'src', clientDir)
      const pathExistsSpy = jest.spyOn(fs, 'pathExists').mockImplementation(() => Promise.resolve(true))
      jest.spyOn(env, 'default').mockReturnValue({
        CLIENT_DIR: clientDir,
      } as any)
      const debugSpy = jest.fn().mockImplementation()
      const traceSpy = jest.fn().mockImplementation()
      ClientUtil['logger'] = {
        debug: debugSpy,
        trace: traceSpy,
      } as any

      await expect(ClientUtil.getDirectory()).resolves.toEqual(resolvedDir)

      expect(pathExistsSpy.mock.calls).toEqual([[resolvedDir]])
      expect(debugSpy.mock.calls).toEqual([[`Client directory resolved to "${resolvedDir}"`]])
      expect(traceSpy.mock.calls).toEqual([[`clientDir: "${clientDir}"`]])
    })
  })
  describe('setEnvVars', () => {
    it('throws error if the env file does not exist', async () => {
      const clientDir = 'path/to/dir'
      const envFile = path.join(clientDir, 'dynamic-env.js')
      const apiUrl = 'http://localhost:4000'
      const webSocketPingIntervalSeconds = 5
      const pathExistsSpy = jest.spyOn(fs, 'pathExists').mockImplementation(() => Promise.resolve(false))
      jest.spyOn(env, 'default').mockReturnValue({
        API_BASE_URL: apiUrl,
        WEB_SOCKET_PING_INTERVAL_SECONDS: webSocketPingIntervalSeconds,
      } as any)
      const traceSpy = jest.fn().mockImplementation()
      ClientUtil['logger'] = {
        trace: traceSpy,
      } as any

      await expect(ClientUtil.setEnvVars(clientDir)).rejects.toThrow(
        `Client env file "${envFile}" does not exist, ensure it has been built properly.`
      )

      expect(pathExistsSpy.mock.calls).toEqual([[envFile]])
      expect(traceSpy.mock.calls).toEqual([
        [`envFile: "${envFile}"`],
        [`env.API_BASE_URL: "${apiUrl}"`],
        [`env.WEB_SOCKET_PING_INTERVAL_SECONDS: "${webSocketPingIntervalSeconds}"`],
      ])
    })
    it('calls to replaceInFile if file exists', async () => {
      const clientDir = 'path/to/dir'
      const envFile = path.join(clientDir, 'dynamic-env.js')
      const apiUrl = 'http://localhost:4000'
      const webSocketPingIntervalSeconds = 5
      const pathExistsSpy = jest.spyOn(fs, 'pathExists').mockImplementation(() => Promise.resolve(true))
      jest.spyOn(env, 'default').mockReturnValue({
        API_BASE_URL: apiUrl,
        WEB_SOCKET_PING_INTERVAL_SECONDS: webSocketPingIntervalSeconds,
      } as any)
      const traceSpy = jest.fn().mockImplementation()
      ClientUtil['logger'] = {
        trace: traceSpy,
      } as any
      const replaceInFileSpy = jest.spyOn(replaceInFile, 'replaceInFile').mockImplementation()

      await expect(ClientUtil.setEnvVars(clientDir)).resolves.toEqual(undefined)

      expect(pathExistsSpy.mock.calls).toEqual([[envFile]])
      expect(traceSpy.mock.calls).toEqual([
        [`envFile: "${envFile}"`],
        [`env.API_BASE_URL: "${apiUrl}"`],
        [`env.WEB_SOCKET_PING_INTERVAL_SECONDS: "${webSocketPingIntervalSeconds}"`],
      ])
      expect(replaceInFileSpy.mock.calls).toEqual([
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
            from: /WEB_SOCKET_PING_INTERVAL_SECONDS:(\s*)(['"]).*?(['"])/,
            to: `WEB_SOCKET_PING_INTERVAL_SECONDS:$1$2${webSocketPingIntervalSeconds}$3`,
          },
        ],
      ])
    })
  })
})
