import express from 'express'
import path from 'path'

import ClientUtil from '../../src/client-util'
import * as env from '../../src/env'
import * as nodeUtils from '@gwent-oss/node-utils'
import { startupText } from '@gwent-oss/utils'
import Ui from '../../src/ui'
import { version } from '../../package.json'

jest.mock('express', () => {
  return jest.fn().mockImplementation(() => {
    return {
      static: jest.fn().mockImplementation(),
    }
  })
})

describe('ui', () => {
  describe('run', () => {
    it('calls to other class methods and initializes express app', async () => {
      const printStartupInfoSpy = jest.spyOn(Ui as any, 'printStartupInfo').mockImplementation()
      const configureClientDirSpy = jest.spyOn(Ui as any, 'configureClientDir').mockImplementation()
      const configureImagesSpy = jest.spyOn(Ui as any, 'configureImages').mockImplementation()
      const serveSpy = jest.spyOn(Ui as any, 'serve').mockImplementation()
      expect(Ui['app']).toEqual(undefined)

      await expect(Ui.run()).resolves.toEqual(undefined)

      expect(printStartupInfoSpy.mock.calls).toEqual([[]])
      expect(configureClientDirSpy.mock.calls).toEqual([[]])
      expect(configureImagesSpy.mock.calls).toEqual([[]])
      expect(serveSpy.mock.calls).toEqual([[]])
      expect((express as any).mock.calls).toEqual([[]])
    })
  })
  describe('printStartupInfo', () => {
    it('logs startup info', async () => {
      const buildNumber = 1
      const appInfoFilePath = 'app-info-file-path.json'
      const nodeEnv = 'DEBUG'
      const logLevel = 'INFO'
      const getBuildNumberSpy = jest.spyOn(nodeUtils.AppInfo, 'getBuildNumber').mockResolvedValue(buildNumber)
      jest.spyOn(env, 'default').mockReturnValue({
        APP_INFO_FILE_PATH: appInfoFilePath,
        NODE_ENV: nodeEnv,
        LOG_LEVEL: logLevel,
      } as any)
      const infoSpy = jest.fn().mockImplementation()
      const debugSpy = jest.fn().mockImplementation()
      const traceSpy = jest.fn().mockImplementation()
      Ui['logger'] = {
        info: infoSpy,
        debug: debugSpy,
        trace: traceSpy,
      } as any

      await expect(Ui['printStartupInfo']()).resolves.toEqual(undefined)

      expect(getBuildNumberSpy.mock.calls).toEqual([[appInfoFilePath]])
      expect(infoSpy.mock.calls).toEqual([[startupText], [`Version: "${version}"`], [`LOG_LEVEL: "${logLevel}"`]])
      expect(debugSpy.mock.calls).toEqual([[`Build: "${buildNumber}"`]])
      expect(traceSpy.mock.calls).toEqual([[`NODE_ENV: "${nodeEnv}"`]])
    })
  })
  describe('configureClientDir', () => {
    it('calls to get client dir and set env vars', async () => {
      const clientDir = 'dir'
      const getDirectorySpy = jest.spyOn(ClientUtil, 'getDirectory').mockResolvedValue(clientDir)
      const setEnvVarsSpy = jest.spyOn(ClientUtil, 'setEnvVars').mockImplementation()
      expect(Ui['clientDir']).toEqual(undefined)

      await expect(Ui['configureClientDir']()).resolves.toEqual(undefined)

      expect(getDirectorySpy.mock.calls).toEqual([[]])
      expect(setEnvVarsSpy.mock.calls).toEqual([[clientDir]])
      expect(Ui['clientDir']).toEqual(clientDir)
    })
  })
  describe('configureImages', () => {
    it('throws error if IMAGES_DIR does not exist', async () => {
      const imagesDir = '/images-dir'
      await testConfigureImages({
        imagesDir,
        fileExistsResponse: false,
        error: Error(`IMAGES_DIR "${imagesDir}" does not exist.`),
      })
    })
    it('calls server to use images dir when relative', async () => {
      const imagesDir = 'images-dir'
      await testConfigureImages({
        imagesDir,
        fileExistsResponse: true,
        resolvedImagesDir: path.join(__dirname, '..', '..', 'src', imagesDir),
      })
    })
    it('calls server to use images dir when absolute', async () => {
      await testConfigureImages({
        imagesDir: '/images-dir',
        fileExistsResponse: true,
      })
    })
  })
  describe('serve', () => {
    it('configures app and listens', async () => {
      const clientDir = 'dir'
      Ui['clientDir'] = clientDir
      const staticSpy = jest.fn().mockImplementation()
      express.static = staticSpy as any
      const useSpy = jest.fn().mockImplementation()
      const sendFileSpy = jest.fn().mockImplementation()
      const getSpy = jest.fn().mockImplementation((path, callback) => {
        callback(undefined, {
          sendFile: sendFileSpy,
        })
      })
      const listenSpy = jest.fn().mockImplementation((config, callback) => {
        callback()
      })
      Ui['app'] = {
        use: useSpy,
        get: getSpy,
        listen: listenSpy,
      } as any
      const infoSpy = jest.fn().mockImplementation()
      const traceSpy = jest.fn().mockImplementation()
      Ui['logger'] = {
        info: infoSpy,
        trace: traceSpy,
      } as any
      const port = 3000
      const envSpy = jest.spyOn(env, 'default').mockReturnValue({
        PORT: port,
      } as any)
      const resolvedPath = 'resolved/path'
      const resolveSpy = jest.spyOn(path, 'resolve').mockReturnValue(resolvedPath)

      await expect(Ui['serve']()).resolves.toEqual(undefined)

      expect(staticSpy.mock.calls).toEqual([[clientDir]])
      expect(useSpy.mock.calls).toEqual([[undefined]])
      expect(sendFileSpy.mock.calls).toEqual([[resolvedPath]])
      expect(resolveSpy.mock.calls).toEqual([[clientDir, 'index.html']])
      expect(getSpy.mock.calls).toEqual([['*name', expect.any(Function)]])
      expect(envSpy.mock.calls).toEqual([[], [], []])
      expect(listenSpy.mock.calls).toEqual([
        [
          {
            port,
          },
          expect.any(Function),
        ],
      ])
      expect(infoSpy.mock.calls).toEqual([[`Serving React app at "http://localhost:${port}"`]])
      expect(traceSpy.mock.calls).toEqual([[`env.PORT: "${port}"`]])
    })
  })
})

async function testConfigureImages({
  imagesDir,
  fileExistsResponse,
  error,
  resolvedImagesDir,
}: {
  imagesDir: string
  fileExistsResponse: boolean
  error?: Error
  resolvedImagesDir?: string
}) {
  const imagesPath = imagesDir
  const envSpy = jest.spyOn(env, 'default').mockReturnValue({
    IMAGES_DIR: imagesDir,
  } as any)
  const existsSpy = jest.spyOn(nodeUtils, 'fileExists').mockResolvedValue(fileExistsResponse)
  const staticResult = 'static'
  const staticSpy = jest.fn().mockReturnValue(staticResult)
  express.static = staticSpy as any
  const useSpy = jest.fn().mockImplementation()
  Ui['app'] = {
    use: useSpy,
  } as any
  const traceSpy = jest.fn().mockImplementation()
  Ui['logger'] = {
    trace: traceSpy,
  } as any

  const promise = Ui['configureImages']()
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(undefined)
  }

  expect(envSpy.mock.calls).toEqual([[]])
  expect(existsSpy.mock.calls).toEqual([[resolvedImagesDir || imagesPath]])
  expect(staticSpy.mock.calls).toEqual(error ? [] : [[resolvedImagesDir || imagesPath]])
  expect(useSpy.mock.calls).toEqual(error ? [] : [['/images', staticResult]])
  expect(traceSpy.mock.calls).toEqual([
    [`imagesDir: "${imagesDir}"`],
    [`imagesPath: "${resolvedImagesDir || imagesDir}"`],
  ])
}
