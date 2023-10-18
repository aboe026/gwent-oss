import { ApolloServer } from '@apollo/server' // eslint-disable-line @typescript-eslint/no-unused-vars
import log4js from 'log4js' // eslint-disable-line @typescript-eslint/no-unused-vars
import express from 'express' // eslint-disable-line @typescript-eslint/no-unused-vars
import http from 'http' // eslint-disable-line @typescript-eslint/no-unused-vars

import DbUpgrader from '../../src/database/db-upgrader' // eslint-disable-line @typescript-eslint/no-unused-vars
import sleep from '../../src/util/sleep'

jest.mock('log4js', () => ({
  configure: jest.fn().mockImplementation(),
  getLogger: jest.fn().mockReturnValue({
    info: jest.fn().mockImplementation(),
    debug: jest.fn().mockImplementation(),
    trace: jest.fn().mockImplementation(),
    error: jest.fn().mockImplementation(),
  }),
}))
jest.mock('express', () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({
    use: jest.fn().mockReturnValue(undefined),
  }),
}))
jest.mock('http', () => ({
  createServer: jest.fn().mockReturnValue({
    listen: jest.fn().mockImplementation((options, callback) => {
      callback()
    }),
    on: jest.fn().mockReturnValue(undefined),
  }),
}))
jest.mock('@apollo/server', () => {
  return {
    ApolloServer: jest.fn().mockImplementation(() => {
      return {
        start: jest.fn().mockResolvedValue(undefined),
        assertStarted: jest.fn().mockImplementation(),
      }
    }),
  }
})

describe('api', () => {
  it('exits with successful code if no error thrown', async () => {
    jest.mock('../../src/database/db-upgrader', () => ({
      run: jest.fn().mockResolvedValue(undefined),
    }))
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation()

    await jest.isolateModules(async () => {
      await import('../../src/api')
    })

    await sleep(0.25) // need explicit sleep here because isolateModules does not await :/
    expect(exitSpy.mock.calls).toEqual([])
  }, 10000) // Needed to pass in CI
  it('exits with unsuccessful code if error thrown', async () => {
    jest.mock('../../src/database/db-upgrader', () => ({
      run: jest.fn().mockRejectedValue(undefined),
    }))
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation()

    await jest.isolateModules(async () => {
      await import('../../src/api')
    })

    await sleep(0.25) // need explicit sleep here because isolateModules does not await thrown error :/
    expect(exitSpy.mock.calls).toEqual([[1]])
  }, 10000) // Needed to pass in CI
})
