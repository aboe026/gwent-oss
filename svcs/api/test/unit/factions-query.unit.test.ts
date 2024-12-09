import { Context } from '@gwent/graphql-schema/context'
import FactionResolver from '../../src/graphql/resolvers/types/faction-resolver'
import FactionsQuery from '../../src/graphql/resolvers/queries/factions-query'
import FactionStore from '../../src/database/stores/faction-store'
import { FactionKey, QueryFactionsArgs } from '@gwent/graphql-schema/resolver-typings'
import TestUtil from '../test-util'

describe('factions-query', () => {
  describe('factions', () => {
    it('reaches out to FactionStore without keys arg', async () => {
      await testFactions({})
    })
    it('reaches out to FactionStore with single keys arg', async () => {
      await testFactions({
        keys: [FactionKey.Neutral],
      })
    })
    it('reaches out to FactionStore with multiple keys arg', async () => {
      await testFactions({
        keys: [FactionKey.NorthernRealms, FactionKey.Neutral],
      })
    })
    it('logs to trace if enabled', async () => {
      await testFactions({
        traceEnabled: true,
      })
    })
  })
})

async function testFactions({ keys, traceEnabled }: { keys?: FactionKey[]; traceEnabled?: boolean }) {
  const context: Context = {
    session: {
      user: TestUtil.getDbUser({}),
    },
  }
  const args: QueryFactionsArgs = {}
  if (keys) {
    args.keys = keys
  }
  const logPrefix = `factions by "${context.session?.user?._id}"`
  const faction = TestUtil.getDbFaction({})
  const resolvedFaction = TestUtil.getFactionFromDbFaction(faction)
  const getSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([faction])
  const factionResolverSpy = jest.spyOn(FactionResolver, 'fromArray').mockResolvedValue([resolvedFaction])
  const traceSpy = jest.fn().mockImplementation()
  FactionsQuery['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(FactionsQuery.factions(args, context, null as any)).resolves.toEqual([resolvedFaction])

  expect(getSpy.mock.calls).toEqual([[{ keys }]])
  expect(factionResolverSpy.mock.calls).toEqual([
    [
      {
        factions: [faction],
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} factions: "${JSON.stringify([faction])}"`],
        ]
      : []
  )
}
