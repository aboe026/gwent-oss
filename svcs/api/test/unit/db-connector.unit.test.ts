import env from '../../src/env'

describe('db-connector', () => {
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
        debugs: undefined,
        traceEnabled: false,
        traces: undefined,
        initializeCalled: false,
      })
    })
    it('calls to initialize if client undefined and connected true', async () => {
      await testConnect({
        client: undefined,
        connected: true,
        debugs: [['Client not initialized or connecting, initializing']],
        traceEnabled: false,
        traces: undefined,
        initializeCalled: true,
      })
    })
    it('calls to initialize if client defined and connected false', async () => {
      await testConnect({
        client: true,
        connected: false,
        debugs: [['Client not initialized or connecting, initializing']],
        traceEnabled: false,
        traces: undefined,
        initializeCalled: true,
      })
    })
    it('calls to initialize if client unddefined and connected false', async () => {
      await testConnect({
        client: false,
        connected: false,
        debugs: [['Client not initialized or connecting, initializing']],
        traceEnabled: false,
        traces: undefined,
        initializeCalled: true,
      })
    })
    it('outputs trace logs if trace enabled', async () => {
      await testConnect({
        client: false,
        connected: false,
        debugs: [['Client not initialized or connecting, initializing']],
        traceEnabled: true,
        traces: [['client: "undefined"'], ['connected: "false"']],
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
        info: `Disconnecting from MongoDB database "${env.MONGO_DB}"`,
      })
    })
  })
})

async function testInitialize() {
  const disconnectReason = 'connection pool closed'
  const debugSpy = jest.fn().mockImplementation()
  const infoSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  jest.mock('log4js', () => ({
    getLogger: jest.fn().mockReturnValue({
      debug: debugSpy,
      info: infoSpy,
      warn: warnSpy,
    }),
  }))
  const connectSpy = jest.fn().mockImplementation()
  const onSpy = jest.fn().mockImplementation()
  jest.mock('mongodb', () => {
    return {
      MongoClient: jest.fn().mockImplementation(() => {
        return {
          on: onSpy,
          connect: connectSpy,
        }
      }),
    }
  })
  const DbConnector = require('../../src/database/db-connector').default // eslint-disable-line @typescript-eslint/no-var-requires

  expect(DbConnector.connected).toEqual(false)

  await expect(DbConnector.initialize()).resolves.toEqual(undefined)

  expect(DbConnector.connected).toEqual(true)
  expect(debugSpy.mock.calls).toEqual([[`MONGO_URL: '${env.MONGO_URL}'`]])
  expect(infoSpy.mock.calls).toEqual([[`Connecting to MongoDB database "${env.MONGO_DB}"`]])
  expect(connectSpy.mock.calls).toEqual([[]])
  expect(onSpy.mock.calls).toEqual([['connectionClosed', expect.any(Function)]])

  onSpy.mock.calls[0][1]({
    reason: disconnectReason,
  })
  expect(warnSpy.mock.calls).toEqual([
    [`Lost connection to MongoDB database "${env.MONGO_DB}" due to "${disconnectReason}"`],
  ])
  expect(DbConnector.connected).toEqual(false)
}

async function testConnect({
  connected,
  client,
  debugs,
  traces,
  traceEnabled,
  initializeCalled,
}: {
  connected: boolean
  client: boolean | undefined
  debugs: string[][] | undefined
  traces: string[][] | undefined
  traceEnabled: boolean
  initializeCalled: boolean
}) {
  const traceSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  jest.mock('log4js', () => ({
    getLogger: jest.fn().mockReturnValue({
      debug: debugSpy,
      trace: traceSpy,
      isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    }),
  }))
  const DbConnector = require('../../src/database/db-connector').default // eslint-disable-line @typescript-eslint/no-var-requires
  const dbSpy = jest.fn().mockImplementation()
  if (client) {
    DbConnector.client = {
      db: dbSpy,
    }
  }
  const initializeSpy = jest.fn().mockImplementation(() => {
    return new Promise((resolve) => {
      DbConnector.client = {
        db: dbSpy,
      }
      resolve(undefined)
    })
  })
  DbConnector.initialize = initializeSpy
  DbConnector.connected = connected

  await expect(DbConnector.connect()).resolves.toEqual(undefined)

  expect(debugSpy.mock.calls).toEqual(debugs ? debugs : [])
  expect(traceSpy.mock.calls).toEqual(traces ? traces : [])
  expect(initializeSpy.mock.calls).toEqual(initializeCalled ? [[]] : [])
  expect(dbSpy.mock.calls).toEqual([[env.MONGO_DB]])
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
  jest.mock('log4js', () => ({
    getLogger: jest.fn().mockReturnValue({
      info: infoSpy,
    }),
  }))
  const DbConnector = require('../../src/database/db-connector').default // eslint-disable-line @typescript-eslint/no-var-requires
  const closeSpy = jest.fn().mockImplementation()
  if (client) {
    DbConnector.client = {
      close: closeSpy,
    }
  }
  DbConnector.connected = connected

  await expect(DbConnector.disconnect()).resolves.toEqual(undefined)

  expect(infoSpy.mock.calls).toEqual(info ? [[info]] : [])
  expect(closeSpy.mock.calls).toEqual(client && connected ? [[]] : [])
}
