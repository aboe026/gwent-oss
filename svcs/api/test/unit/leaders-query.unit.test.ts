import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { FactionDbObject } from '@gwent/graphql-schema/database-typings'
import { FactionKey, QueryLeadersArgs } from '@gwent/graphql-schema/resolver-typings'
import FactionStore from '../../src/database/stores/faction-store'
import LeaderResolver from '../../src/graphql/resolvers/types/leader-resolver'
import LeadersQuery from '../../src/graphql/resolvers/queries/leaders-query'
import LeaderStore from '../../src/database/stores/leader-store'
import TestUtil from '../test-util'

describe('leaders-query', () => {
  describe('leaders', () => {
    it('does not reach out to FactionStore if no factions in args', async () => {
      await testLeaders({
        leaderGetCalls: [
          [
            {
              factionIds: undefined,
            },
          ],
        ],
      })
    })
    it('reaches out to get faction ids if single faction in args', async () => {
      const factionKey = FactionKey.Monsters
      const factionId = new ObjectId()
      await testLeaders({
        factionKeys: [factionKey],
        factionGetCalls: [
          [
            {
              keys: [factionKey],
            },
          ],
        ],
        factionGetResponse: [
          TestUtil.getDbFaction({
            id: factionId,
          }),
        ],
        leaderGetCalls: [
          [
            {
              factionIds: [factionId.toString()],
            },
          ],
        ],
      })
    })
    it('logs to trace if enabled', async () => {
      const factionKey = FactionKey.Monsters
      const factionId = new ObjectId()
      await testLeaders({
        factionKeys: [factionKey],
        factionGetCalls: [
          [
            {
              keys: [factionKey],
            },
          ],
        ],
        factionGetResponse: [
          TestUtil.getDbFaction({
            id: factionId,
          }),
        ],
        leaderGetCalls: [
          [
            {
              factionIds: [factionId.toString()],
            },
          ],
        ],
        traceEnabled: true,
      })
    })
  })
})

async function testLeaders({
  factionKeys,
  factionGetResponse,
  factionGetCalls = [],
  leaderGetCalls,
  traceEnabled,
}: {
  factionKeys?: FactionKey[]
  factionGetResponse?: FactionDbObject[]
  factionGetCalls?: any[][]
  leaderGetCalls: any[][]
  traceEnabled?: boolean
}) {
  const context: Context = {
    session: {
      user: TestUtil.getDbUser({}),
    },
  }
  const logPrefix = `leaders by "${context.session?.user?._id}"`
  const args: QueryLeadersArgs = {
    factions: factionKeys,
  }
  const leader = TestUtil.getDbLeader({})
  const resolvedLeader = TestUtil.getLeaderFromDbLeader(leader)
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(factionGetResponse || [])
  const leaderGetSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue([leader])
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'fromArray').mockResolvedValue([resolvedLeader])
  const traceSpy = jest.fn().mockImplementation()
  LeadersQuery['logger'] = {
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(LeadersQuery.leaders(args, context, null as any)).resolves.toEqual([resolvedLeader])

  expect(factionGetSpy.mock.calls).toEqual(factionGetCalls)
  expect(leaderGetSpy.mock.calls).toEqual(leaderGetCalls)
  expect(leaderResolverSpy.mock.calls).toEqual([
    [
      {
        factions: factionGetResponse,
        leaders: [leader],
        neutralStats: undefined,
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} args: "${JSON.stringify({ factions: factionKeys })}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} factions: "${JSON.stringify(factionGetResponse)}"`],
          [`${logPrefix} factionIds: "${JSON.stringify(factionGetResponse?.map((faction) => faction._id))}"`],
          [`${logPrefix} leaders: "${JSON.stringify([leader])}"`],
        ]
      : []
  )
}
