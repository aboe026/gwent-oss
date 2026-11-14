import AdminDb from '../../src/database/upgrades/admin-db'
import DbConnector from '../../src/database/db-connector'

describe('admin-db', () => {
  describe('getDatabaseVersion', () => {
    it('returns version without trace logging enabled', async () => {
      await testGetDatabaseVersion({})
    })
    it('returns version with trace logging enabled', async () => {
      await testGetDatabaseVersion({
        traceEnabled: true,
      })
    })
  })
  describe('getFeatureCompatibilityVersion', () => {
    it('returns version without trace logging enabled', async () => {
      await testGetFeatureCompatibilityVersion({})
    })
    it('returns version with trace logging enabled', async () => {
      await testGetFeatureCompatibilityVersion({
        traceEnabled: true,
      })
    })
  })
  describe('setFeatureCompatibilityVersion', () => {
    it('does not throw error if result ok is 1', async () => {
      await testSetFeatureCompatibilityVersion({
        resultOk: 1,
      })
    })
    it('throws error if result ok is not 1', async () => {
      await testSetFeatureCompatibilityVersion({
        resultOk: 0,
        error: true,
      })
    })
    it('logs to trace if enabled', async () => {
      await testSetFeatureCompatibilityVersion({
        resultOk: 1,
        traceEnabled: true,
      })
    })
  })
})

async function testGetDatabaseVersion({ traceEnabled }: { traceEnabled?: boolean }) {
  const version = '9.0.8'
  const db = {
    command: jest.fn().mockResolvedValue({
      version,
    }),
  }
  const client = {
    db: jest.fn().mockReturnValue(db),
  }
  const getClientSpy = jest.spyOn(DbConnector, 'getClient').mockReturnValue(client as any)
  const traceSpy = jest.fn().mockImplementation()
  AdminDb['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(AdminDb.getDatabaseVersion()).resolves.toEqual(version)

  expect(getClientSpy.mock.calls).toEqual([[]])
  expect(client.db.mock.calls).toEqual([[AdminDb.DATABASE_NAME]])
  expect(db.command.mock.calls).toEqual([
    [
      {
        buildInfo: 1,
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `getDatabaseVersion result: "${JSON.stringify({
              version,
            })}"`,
          ],
        ]
      : []
  )
}

async function testGetFeatureCompatibilityVersion({ traceEnabled }: { traceEnabled?: boolean }) {
  const version = '9.0'
  const db = {
    command: jest.fn().mockResolvedValue({
      featureCompatibilityVersion: {
        version,
      },
    }),
  }
  const client = {
    db: jest.fn().mockReturnValue(db),
  }
  const getClientSpy = jest.spyOn(DbConnector, 'getClient').mockReturnValue(client as any)
  const traceSpy = jest.fn().mockImplementation()
  AdminDb['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(AdminDb.getFeatureCompatibilityVersion()).resolves.toEqual(version)

  expect(getClientSpy.mock.calls).toEqual([[]])
  expect(client.db.mock.calls).toEqual([[AdminDb.DATABASE_NAME]])
  expect(db.command.mock.calls).toEqual([
    [
      {
        getParameter: 1,
        featureCompatibilityVersion: 1,
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `getFeatureCompatibilityVersion result: "${JSON.stringify({
              featureCompatibilityVersion: {
                version,
              },
            })}"`,
          ],
        ]
      : []
  )
}

async function testSetFeatureCompatibilityVersion({
  resultOk,
  error,
  traceEnabled,
}: {
  resultOk: number
  error?: boolean
  traceEnabled?: boolean
}) {
  const version = '9.0'
  const db = {
    command: jest.fn().mockResolvedValue({
      ok: resultOk,
    }),
  }
  const client = {
    db: jest.fn().mockReturnValue(db),
  }
  const getClientSpy = jest.spyOn(DbConnector, 'getClient').mockReturnValue(client as any)
  const errorSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  AdminDb['logger'] = {
    error: errorSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = AdminDb.setFeatureCompatibilityVersion(version)
  if (error) {
    await expect(promise).rejects.toThrow('Could not update FCV.')
  } else {
    await expect(promise).resolves.toEqual(undefined)
  }

  expect(getClientSpy.mock.calls).toEqual([[]])
  expect(client.db.mock.calls).toEqual([[AdminDb.DATABASE_NAME]])
  expect(db.command.mock.calls).toEqual([
    [
      {
        setFeatureCompatibilityVersion: version,
        confirm: true,
      },
    ],
  ])
  expect(errorSpy.mock.calls).toEqual(
    error
      ? [
          [
            `Could not update FCV, result: "${JSON.stringify({
              ok: resultOk,
            })}"`,
          ],
        ]
      : []
  )
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `setFeatureCompatibilityVersion result: "${JSON.stringify({
              ok: resultOk,
            })}"`,
          ],
        ]
      : []
  )
}
