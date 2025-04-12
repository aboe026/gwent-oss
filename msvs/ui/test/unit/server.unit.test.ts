import express from 'express'
import fs from 'fs-extra'
import path from 'path'

import ClientUtil from '../../src/client-util'
import * as env from '../../src/env'
import Server from '../../src/server'

jest.mock('express', () => {
  return jest.fn().mockImplementation(() => {
    return {
      static: jest.fn().mockImplementation(),
    }
  })
})

describe('server', () => {
  describe('run', () => {
    it('calls to other class methods and initializes express app', async () => {
      const configureClientDirSpy = jest.spyOn(Server as any, 'configureClientDir').mockImplementation()
      const configureImagesSpy = jest.spyOn(Server as any, 'configureImages').mockImplementation()
      const serveSpy = jest.spyOn(Server as any, 'serve').mockImplementation()
      expect(Server['app']).toEqual(undefined)

      await expect(Server.run()).resolves.toEqual(undefined)

      expect(configureClientDirSpy.mock.calls).toEqual([[]])
      expect(configureImagesSpy.mock.calls).toEqual([[]])
      expect(serveSpy.mock.calls).toEqual([[]])
      expect((express as any).mock.calls).toEqual([[]])
    })
  })
  describe('configureClientDir', () => {
    it('calls to get client dir and set env vars', async () => {
      const clientDir = 'dir'
      const getDirectorySpy = jest.spyOn(ClientUtil, 'getDirectory').mockResolvedValue(clientDir)
      const setEnvVarsSpy = jest.spyOn(ClientUtil, 'setEnvVars').mockImplementation()
      expect(Server['clientDir']).toEqual(undefined)

      await expect(Server['configureClientDir']()).resolves.toEqual(undefined)

      expect(getDirectorySpy.mock.calls).toEqual([[]])
      expect(setEnvVarsSpy.mock.calls).toEqual([[clientDir]])
      expect(Server['clientDir']).toEqual(clientDir)
    })
  })
  describe('configureImages', () => {
    it('throws error if IMAGES_DIR does not exist', async () => {
      const imagesDir = 'images-dir'
      const imagesPath = imagesDir
      const envSpy = jest.spyOn(env, 'default').mockReturnValue({
        IMAGES_DIR: imagesDir,
      } as any)
      const isAbsoluteSpy = jest.spyOn(path, 'isAbsolute').mockReturnValue(false)
      const joinSpy = jest.spyOn(path, 'join').mockReturnValue(imagesPath)
      const existsSpy = jest.spyOn(fs, 'exists').mockImplementation(() => Promise.resolve(false))
      const staticResult = 'static'
      const staticSpy = jest.fn().mockReturnValue(staticResult)
      express.static = staticSpy as any
      const useSpy = jest.fn().mockImplementation()
      Server['app'] = {
        use: useSpy,
      } as any

      await expect(Server['configureImages']()).rejects.toThrow(`IMAGES_DIR "${imagesDir}" does not exist.`)

      expect(envSpy.mock.calls).toEqual([[]])
      expect(isAbsoluteSpy.mock.calls[0]).toEqual([imagesDir]) // for some reason CI has more calls
      expect(joinSpy.mock.calls).toEqual([[expect.any(String), imagesDir]])
      expect(existsSpy.mock.calls).toEqual([[imagesPath]])
      expect(staticSpy.mock.calls).toEqual([])
      expect(useSpy.mock.calls).toEqual([])
    })
    it('calls server to use images dir when relative', async () => {
      const imagesDir = 'images-dir'
      const imagesPath = imagesDir
      const envSpy = jest.spyOn(env, 'default').mockReturnValue({
        IMAGES_DIR: imagesDir,
      } as any)
      const isAbsoluteSpy = jest.spyOn(path, 'isAbsolute').mockReturnValue(false)
      const joinSpy = jest.spyOn(path, 'join').mockReturnValue(imagesPath)
      const existsSpy = jest.spyOn(fs, 'exists').mockImplementation(() => Promise.resolve(true))
      const staticResult = 'static'
      const staticSpy = jest.fn().mockReturnValue(staticResult)
      express.static = staticSpy as any
      const useSpy = jest.fn().mockImplementation()
      Server['app'] = {
        use: useSpy,
      } as any

      await expect(Server['configureImages']()).resolves.toEqual(undefined)

      expect(envSpy.mock.calls).toEqual([[]])
      expect(isAbsoluteSpy.mock.calls).toEqual([[imagesDir]])
      expect(joinSpy.mock.calls).toEqual([[expect.any(String), imagesDir]])
      expect(existsSpy.mock.calls).toEqual([[imagesPath]])
      expect(staticSpy.mock.calls).toEqual([[imagesPath]])
      expect(useSpy.mock.calls).toEqual([['/images', staticResult]])
    })
    it('calls server to use images dir when absolute', async () => {
      const imagesDir = 'images-dir'
      const imagesPath = imagesDir
      const envSpy = jest.spyOn(env, 'default').mockReturnValue({
        IMAGES_DIR: imagesDir,
      } as any)
      const isAbsoluteSpy = jest.spyOn(path, 'isAbsolute').mockReturnValue(true)
      const joinSpy = jest.spyOn(path, 'join').mockReturnValue(imagesPath)
      const existsSpy = jest.spyOn(fs, 'exists').mockImplementation(() => Promise.resolve(true))
      const staticResult = 'static'
      const staticSpy = jest.fn().mockReturnValue(staticResult)
      express.static = staticSpy as any
      const useSpy = jest.fn().mockImplementation()
      Server['app'] = {
        use: useSpy,
      } as any

      await expect(Server['configureImages']()).resolves.toEqual(undefined)

      expect(envSpy.mock.calls).toEqual([[]])
      expect(isAbsoluteSpy.mock.calls).toEqual([[imagesDir]])
      expect(joinSpy.mock.calls).toEqual([])
      expect(existsSpy.mock.calls).toEqual([[imagesPath]])
      expect(staticSpy.mock.calls).toEqual([[imagesPath]])
      expect(useSpy.mock.calls).toEqual([['/images', staticResult]])
    })
  })
  describe('serve', () => {
    it('configures app and listens', async () => {
      const clientDir = 'dir'
      Server['clientDir'] = clientDir
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
      Server['app'] = {
        use: useSpy,
        get: getSpy,
        listen: listenSpy,
      } as any
      const infoSpy = jest.fn().mockImplementation()
      const traceSpy = jest.fn().mockImplementation()
      Server['logger'] = {
        info: infoSpy,
        trace: traceSpy,
      } as any
      const port = 3000
      const envSpy = jest.spyOn(env, 'default').mockReturnValue({
        PORT: port,
      } as any)
      const resolvedPath = 'resolved/path'
      const resolveSpy = jest.spyOn(path, 'resolve').mockReturnValue(resolvedPath)

      await expect(Server['serve']()).resolves.toEqual(undefined)

      expect(staticSpy.mock.calls).toEqual([[clientDir]])
      expect(useSpy.mock.calls).toEqual([[undefined]])
      expect(sendFileSpy.mock.calls).toEqual([[resolvedPath]])
      expect(resolveSpy.mock.calls).toEqual([[clientDir, 'index.html']])
      expect(getSpy.mock.calls).toEqual([['*', expect.any(Function)]])
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
