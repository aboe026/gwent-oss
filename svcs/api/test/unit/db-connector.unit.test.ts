import { MongoClient } from 'mongodb'

import DbConnector from '../../src/database/db-connector'
import env from '../../src/env'

describe('db-connector', () => {
  describe('getClient', () => {
    it('returns undefined if client not initialized', () => {
      DbConnector['client'] = undefined as any

      expect(DbConnector.getClient()).toEqual(undefined)
    })
    it('returns undefined if initialized', () => {
      const client = new MongoClient('mongodb://localhost')
      DbConnector['client'] = client

      expect(DbConnector.getClient()).toEqual(client)
    })
  })
  describe('initialize', () => {
    it('calls to connect client and sets connected to true', async () => {
      await testInitialize()
    })
  })
  describe('connect', () => {
    it('does not call to initialize if client defined and connected true', async () => {
      await testConnect({
        client: true,
        connected: true,
        debugCalls: undefined,
        traceEnabled: false,
        traceCalls: undefined,
        initializeCalled: false,
      })
    })
    it('calls to initialize if client undefined and connected true', async () => {
      await testConnect({
        client: undefined,
        connected: true,
        debugCalls: [['Client not initialized or connecting, initializing']],
        traceEnabled: false,
        traceCalls: undefined,
        initializeCalled: true,
      })
    })
    it('calls to initialize if client defined and connected false', async () => {
      await testConnect({
        client: true,
        connected: false,
        debugCalls: [['Client not initialized or connecting, initializing']],
        traceEnabled: false,
        traceCalls: undefined,
        initializeCalled: true,
      })
    })
    it('calls to initialize if client unddefined and connected false', async () => {
      await testConnect({
        client: false,
        connected: false,
        debugCalls: [['Client not initialized or connecting, initializing']],
        traceEnabled: false,
        traceCalls: undefined,
        initializeCalled: true,
      })
    })
    it('outputs trace logs if trace enabled', async () => {
      await testConnect({
        client: false,
        connected: false,
        debugCalls: [['Client not initialized or connecting, initializing']],
        traceEnabled: true,
        traceCalls: [['client: "undefined"'], ['connected: "false"']],
        initializeCalled: true,
      })
    })
  })
  describe('disconnect', () => {
    it('does not call to close if client undefined and connected false', async () => {
      await testDisconnect({
        client: undefined,
        connected: false,
        info: undefined,
      })
    })
    it('does not call to close if client defined and connected false', async () => {
      await testDisconnect({
        client: true,
        connected: false,
        info: undefined,
      })
    })
    it('does not call to close if client undefined and connected true', async () => {
      await testDisconnect({
        client: undefined,
        connected: true,
        info: undefined,
      })
    })
    it('calls to close if client is defined and connected is true', async () => {
      await testDisconnect({
        client: true,
        connected: true,
        info: `Disconnecting from MongoDB database "${env().MONGO_DB}"`,
      })
    })
  })
})

async function testInitialize() {
  const disconnectReason = 'connection pool closed'
  const debugSpy = jest.fn().mockImplementation()
  const infoSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  DbConnector['logger'] = {
    debug: debugSpy,
    info: infoSpy,
    warn: warnSpy,
  } as any
  const onSpy = jest.fn().mockImplementation()
  const connectSpy = jest.spyOn(MongoClient, 'connect').mockResolvedValue({
    on: onSpy,
  } as any)

  expect(DbConnector['connected']).toEqual(false)

  await expect(DbConnector['initialize']()).resolves.toEqual(undefined)

  expect(DbConnector['connected']).toEqual(true)
  expect(debugSpy.mock.calls).toEqual([[`MONGO_URL: '${env().MONGO_URL}'`]])
  expect(infoSpy.mock.calls).toEqual([[`Connecting to MongoDB database "${env().MONGO_DB}"`]])
  expect(connectSpy.mock.calls).toEqual([[env().MONGO_URL]])
  expect(onSpy.mock.calls).toEqual([['connectionClosed', expect.any(Function)]])

  onSpy.mock.calls[0][1]({
    reason: disconnectReason,
  })
  expect(warnSpy.mock.calls).toEqual([
    [`Lost connection to MongoDB database "${env().MONGO_DB}" due to "${disconnectReason}"`],
  ])
  expect(DbConnector['connected']).toEqual(false)
}

async function testConnect({
  connected,
  client,
  debugCalls,
  traceCalls,
  traceEnabled,
  initializeCalled,
}: {
  connected: boolean
  client: boolean | undefined
  debugCalls: string[][] | undefined
  traceCalls: string[][] | undefined
  traceEnabled: boolean
  initializeCalled: boolean
}) {
  const traceSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  DbConnector['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any
  const dbSpy = jest.fn().mockImplementation()
  if (client) {
    DbConnector['client'] = {
      db: dbSpy,
    } as any
  } else {
    DbConnector['client'] = undefined as any
  }
  const initializeSpy = jest.fn().mockImplementation(() => {
    return new Promise((resolve) => {
      DbConnector['client'] = {
        db: dbSpy,
      } as any
      resolve(undefined)
    })
  })
  DbConnector['initialize'] = initializeSpy
  DbConnector['connected'] = connected

  await expect(DbConnector.connect()).resolves.toEqual(undefined)

  expect(debugSpy.mock.calls).toEqual(debugCalls ? debugCalls : [])
  expect(traceSpy.mock.calls).toEqual(traceCalls ? traceCalls : [])
  expect(initializeSpy.mock.calls).toEqual(initializeCalled ? [[]] : [])
  expect(dbSpy.mock.calls).toEqual([[env().MONGO_DB]])
}

async function testDisconnect({
  connected,
  client,
  info,
}: {
  connected: boolean
  client: boolean | undefined
  info: string | undefined
}) {
  const infoSpy = jest.fn().mockImplementation()
  DbConnector['logger'] = {
    info: infoSpy,
  } as any
  const closeSpy = jest.fn().mockImplementation(() => Promise.resolve())
  if (client) {
    DbConnector['client'] = {
      close: closeSpy,
    } as any
  } else {
    DbConnector['client'] = undefined as any
  }
  DbConnector['connected'] = connected

  await expect(DbConnector.disconnect()).resolves.toEqual(undefined)

  expect(infoSpy.mock.calls).toEqual(info ? [[info]] : [])
  expect(closeSpy.mock.calls).toEqual(client && connected ? [[]] : [])
}
