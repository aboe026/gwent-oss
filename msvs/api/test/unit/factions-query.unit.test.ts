import { Context } from '@gwent/graphql-schema/context'
import FactionResolver from '../../src/graphql/resolvers/types/faction-resolver'
import FactionsQuery from '../../src/graphql/resolvers/queries/factions-query'
import FactionStore from '../../src/database/stores/faction-store'
import { FactionKey, QueryFactionsArgs } from '@gwent/graphql-schema/resolver-typings'
import Permissions from '../../src/graphql/permissions'
import TestUtil from '../util/test-util'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'

describe('factions-query', () => {
  describe('factions', () => {
    it('throws error if isAuthenticated throws error', async () => {
      await testFactions({
        isAuthenticatedResponse: Error('isAuthenticated error'),
      })
    })
    it('reaches out to FactionStore without keys arg', async () => {
      await testFactions({
        isAuthenticatedResponse: TestUtil.getDbUser({}),
      })
    })
    it('reaches out to FactionStore with single keys arg', async () => {
      await testFactions({
        isAuthenticatedResponse: TestUtil.getDbUser({}),
        keys: [FactionKey.Neutral],
      })
    })
    it('reaches out to FactionStore with multiple keys arg', async () => {
      await testFactions({
        isAuthenticatedResponse: TestUtil.getDbUser({}),
        keys: [FactionKey.NorthernRealms, FactionKey.Neutral],
      })
    })
    it('logs to trace if enabled', async () => {
      await testFactions({
        isAuthenticatedResponse: TestUtil.getDbUser({}),
        traceEnabled: true,
      })
    })
  })
})

async function testFactions({
  isAuthenticatedResponse,
  keys,
  traceEnabled,
}: {
  isAuthenticatedResponse: UserDbObject | Error
  keys?: FactionKey[]
  traceEnabled?: boolean
}) {
  const context: Context = {
    session: {
      user: isAuthenticatedResponse instanceof Error ? undefined : isAuthenticatedResponse,
    },
  }
  const args: QueryFactionsArgs = {}
  if (keys) {
    args.keys = keys
  }
  const logPrefix = `factions by "${context.session?.user?._id}"`
  const faction = TestUtil.getDbFaction({})
  const resolvedFaction = TestUtil.getFactionFromDbFaction(faction)
  const isAuthenticatedSpy = jest.spyOn(Permissions, 'isAuthenticated').mockImplementation(() => {
    if (isAuthenticatedResponse instanceof Error) {
      throw isAuthenticatedResponse
    } else {
      return isAuthenticatedResponse
    }
  })
  const getSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([faction])
  const factionResolverSpy = jest.spyOn(FactionResolver, 'fromArray').mockResolvedValue([resolvedFaction])
  const traceSpy = jest.fn().mockImplementation()
  FactionsQuery['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = FactionsQuery.factions(args, context, null as any)
  if (isAuthenticatedResponse instanceof Error) {
    await expect(promise).rejects.toThrow(isAuthenticatedResponse)
  } else {
    await expect(promise).resolves.toEqual([resolvedFaction])
  }

  expect(isAuthenticatedSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'factions query',
      },
    ],
  ])
  expect(getSpy.mock.calls).toEqual(isAuthenticatedResponse instanceof Error ? [] : [[{ keys }]])
  expect(factionResolverSpy.mock.calls).toEqual(
    isAuthenticatedResponse instanceof Error
      ? []
      : [
          [
            {
              factions: [faction],
            },
          ],
        ]
  )
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} args: "{}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} factions: "${JSON.stringify([faction])}"`],
        ]
      : []
  )
}
