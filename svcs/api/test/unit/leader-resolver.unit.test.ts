import { FactionDbObject, LeaderDbObject } from '@gwent/graphql-schema/database-typings'
import DlcResolver from '../../src/graphql/resolvers/dlc-resolver'
import FactionResolver from '../../src/graphql/resolvers/faction-resolver'
import { Dlc, Faction, Leader } from '@gwent/graphql-schema/resolver-typings'
import LeaderResolver from '../../src/graphql/resolvers/leader-resolver'
import { ObjectId } from 'mongodb'
import LeaderStore from '../../src/database/stores/leader-store'
import TestUtil from '../test-util'
import Verifier from '../../src/util/verify-objects'

describe('leader-resolver', () => {
  describe('resolveFromObject', () => {
    const leader = TestUtil.getDbLeader({})
    it('does not call to external resolvers if required fields provided', async () => {
      await testResolveFromObject({
        leader,
        faction: TestUtil.getFaction({
          id: leader.faction,
        }),
      })
    })
    it('does not call to external resolvers if all fields provided', async () => {
      const dlc = TestUtil.getDlc({})
      await testResolveFromObject({
        leader: {
          ...leader,
          dlc: new ObjectId(dlc.id),
        },
        faction: TestUtil.getFaction({
          id: leader.faction,
        }),
        dlc,
      })
    })
    it('calls to external resolvers if dlc on leader but not provided', async () => {
      await testResolveFromObject({
        leader: {
          ...leader,
          dlc: new ObjectId(),
        },
      })
    })
    it('calls to external resolvers without neutral stats if only leader provided', async () => {
      await testResolveFromObject({
        leader,
      })
    })
    it('calls to external resolvers with neutral stats if explicit false provided', async () => {
      await testResolveFromObject({
        leader,
        neutralStats: false,
      })
    })
    it('calls to external resolvers with neutral stats if explicit true provided', async () => {
      await testResolveFromObject({
        leader,
        neutralStats: true,
      })
    })
  })
  describe('resolveFromId', () => {
    it('returns first leader from resolveFromIds', async () => {
      const leader = TestUtil.getLeader({})
      const resolveFromIdsSpy = jest.spyOn(LeaderResolver, 'resolveFromIds').mockResolvedValue([leader])

      await expect(
        LeaderResolver.resolveFromId({
          id: leader.id,
        })
      ).resolves.toEqual(leader)

      expect(resolveFromIdsSpy.mock.calls).toEqual([
        [
          {
            ids: [leader.id],
            neutralStats: undefined,
          },
        ],
      ])
    })
  })
  describe('resolveFromIds', () => {
    it('does not call to other methods and just if empty array', async () => {
      await testResolveFromIds({
        ids: [],
      })
    })
    it('calls to leader store and resolves result from array with single ObjectId', async () => {
      await testResolveFromIds({
        ids: [new ObjectId()],
      })
    })
    it('calls to leader store and resolves result from array with single string', async () => {
      await testResolveFromIds({
        ids: [new ObjectId().toString()],
      })
    })
    it('calls to leader store and resolves result from array with ObjectId and string', async () => {
      await testResolveFromIds({
        ids: [new ObjectId(), new ObjectId().toString()],
      })
    })
  })
  describe('resolveFromArray', () => {
    it('does not call to FactionResolver if resolved factions provided', async () => {
      const leader = TestUtil.getDbLeader({})
      const resolvedFaction = TestUtil.getFaction({
        id: leader.faction,
      })
      await testResolveFromArray({
        leaders: [leader],
        resolvedFactions: [resolvedFaction],
        expected: [
          {
            ability: leader.ability,
            created: leader.created,
            faction: resolvedFaction,
            id: leader._id.toString(),
            image: leader.image,
            name: leader.name,
            quote: leader.quote,
          },
        ],
      })
    })
    it('calls to FactionResolver resolveFromIds if no factions provided', async () => {
      const leader = TestUtil.getDbLeader({})
      const resolvedFaction = TestUtil.getFaction({
        id: leader.faction,
      })
      await testResolveFromArray({
        leaders: [leader],
        factionsResolveResponse: [resolvedFaction],
        expected: [
          {
            ability: leader.ability,
            created: leader.created,
            faction: resolvedFaction,
            id: leader._id.toString(),
            image: leader.image,
            name: leader.name,
            quote: leader.quote,
          },
        ],
        factionResolveFromIdsCalls: [
          [
            {
              ids: [leader.faction],
              neutralStats: undefined,
            },
          ],
        ],
      })
    })
    it('calls to FactionResolver resolveFromArray if faction provided', async () => {
      const faction = TestUtil.getDbFaction({})
      const leader = TestUtil.getDbLeader({
        faction: faction._id,
      })
      const resolvedFaction = TestUtil.getFactionFromDbFaction(faction)
      await testResolveFromArray({
        leaders: [leader],
        factions: [faction],
        factionsResolveResponse: [resolvedFaction],
        expected: [
          {
            ability: leader.ability,
            created: leader.created,
            faction: resolvedFaction,
            id: leader._id.toString(),
            image: leader.image,
            name: leader.name,
            quote: leader.quote,
          },
        ],
        factionResolveFromArrayCalls: [
          [
            {
              factions: [faction],
              neutralStats: undefined,
            },
          ],
        ],
      })
    })
    it('calls to DlcResolver with unique ids if leaders have DLC', async () => {
      const dlc = TestUtil.getDlc({})
      const leader1 = TestUtil.getDbLeader({
        dlc: dlc.id,
      })
      const leader2 = TestUtil.getDbLeader({
        faction: leader1.faction,
        dlc: dlc.id,
      })
      const resolvedFaction = TestUtil.getFaction({
        id: leader1.faction,
      })
      await testResolveFromArray({
        leaders: [leader1, leader2],
        resolvedFactions: [resolvedFaction],
        dlcsResolveResponse: [dlc],
        expected: [
          {
            ability: leader1.ability,
            created: leader1.created,
            faction: resolvedFaction,
            id: leader1._id.toString(),
            image: leader1.image,
            name: leader1.name,
            quote: leader1.quote,
          },
          {
            ability: leader2.ability,
            created: leader2.created,
            faction: resolvedFaction,
            id: leader2._id.toString(),
            image: leader2.image,
            name: leader2.name,
            quote: leader2.quote,
          },
        ],
        dlcsResolverCalls: [[[new ObjectId(dlc.id)]]],
      })
    })
  })
})

async function testResolveFromObject({
  leader,
  faction,
  dlc,
  neutralStats,
}: {
  leader: LeaderDbObject
  faction?: Faction
  dlc?: Dlc
  neutralStats?: boolean
}) {
  const resolvedDlc: Dlc =
    dlc ||
    TestUtil.getDlc({
      id: leader.dlc,
    })
  const resolvedFaction: Faction =
    faction ||
    TestUtil.getFaction({
      id: leader.faction,
    })
  const resolvedLeader = TestUtil.getLeaderFromDbLeader(leader, resolvedFaction)
  if (leader.dlc) {
    resolvedLeader.dlc = resolvedDlc
  }
  const dlcResolverSpy = jest.spyOn(DlcResolver, 'resolveFromId').mockResolvedValue(resolvedDlc)
  const factionResolverSpy = jest.spyOn(FactionResolver, 'resolveFromId').mockResolvedValue(resolvedFaction)

  await expect(
    LeaderResolver.resolveFromObject({
      leader,
      dlc,
      faction,
      neutralStats,
    })
  ).resolves.toEqual(resolvedLeader)

  expect(dlcResolverSpy.mock.calls).toEqual(dlc || !leader.dlc ? [] : [[leader.dlc]])
  expect(factionResolverSpy.mock.calls).toEqual(
    faction
      ? []
      : [
          [
            {
              id: leader.faction,
              neutrals: neutralStats,
            },
          ],
        ]
  )
}

async function testResolveFromIds({
  ids,
  verifyObjectsResponse,
}: {
  ids: (ObjectId | string)[]
  verifyObjectsResponse?: Error
}) {
  const leaders: LeaderDbObject[] = ids.map((id) =>
    TestUtil.getDbLeader({
      id,
    })
  )
  const resolvedLeaders = leaders.map((leader) => TestUtil.getLeaderFromDbLeader(leader))
  const getSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue(leaders)
  const verifyObjectsSpy = jest.spyOn(Verifier, 'checkObjects')
  if (verifyObjectsResponse) {
    verifyObjectsSpy.mockImplementation(() => {
      throw verifyObjectsResponse
    })
  } else {
    verifyObjectsSpy.mockReturnValue()
  }
  const resolveFromArraySpy = jest.spyOn(LeaderResolver, 'resolveFromArray').mockResolvedValue(resolvedLeaders)

  await expect(
    LeaderResolver.resolveFromIds({
      ids,
    })
  ).resolves.toEqual(resolvedLeaders)

  expect(getSpy.mock.calls).toEqual(
    ids.length > 0
      ? [
          [
            {
              ids,
            },
          ],
        ]
      : []
  )
  expect(verifyObjectsSpy.mock.calls).toEqual(
    ids.length > 0
      ? [
          [
            {
              expectedKeys: ids,
              objects: leaders,
              field: '_id',
              logger: LeaderResolver['logger'],
              resourceLabelPlural: 'leaders',
            },
          ],
        ]
      : []
  )
  expect(resolveFromArraySpy.mock.calls).toEqual(
    ids.length > 0
      ? [
          [
            {
              leaders: leaders,
              factions: undefined,
              resolvedFactions: undefined,
              neutralStats: undefined,
            },
          ],
        ]
      : []
  )
}

async function testResolveFromArray({
  leaders,
  factions,
  resolvedFactions,
  dlcsResolveResponse = [],
  factionsResolveResponse = [],
  expected,
  error,
  dlcsResolverCalls = [[[]]],
  factionResolveFromArrayCalls = [],
  factionResolveFromIdsCalls = [],
}: {
  leaders: LeaderDbObject[]
  factions?: FactionDbObject[]
  resolvedFactions?: Faction[]
  dlcsResolveResponse?: Dlc[]
  factionsResolveResponse?: Faction[]
  expected?: Leader[]
  error?: string
  dlcsResolverCalls?: any[][]
  factionResolveFromArrayCalls?: any[][]
  factionResolveFromIdsCalls?: any[][]
}) {
  const dlcResolverSpy = jest.spyOn(DlcResolver, 'resolveFromIds').mockResolvedValue(dlcsResolveResponse)
  const factionResolveFromArraySpy = jest
    .spyOn(FactionResolver, 'resolveFromArray')
    .mockResolvedValue(factionsResolveResponse)
  const factionResolveFromIdsSpy = jest
    .spyOn(FactionResolver, 'resolveFromIds')
    .mockResolvedValue(factionsResolveResponse)
  const resolveFromObjectSpy = jest.spyOn(LeaderResolver, 'resolveFromObject')
  if (expected) {
    for (const expectedLeader of expected) {
      resolveFromObjectSpy.mockResolvedValueOnce(expectedLeader)
    }
  }

  const promise = LeaderResolver.resolveFromArray({
    leaders,
    factions,
    resolvedFactions,
  })
  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(dlcResolverSpy.mock.calls).toEqual(dlcsResolverCalls)
  expect(factionResolveFromArraySpy.mock.calls).toEqual(factionResolveFromArrayCalls)
  expect(factionResolveFromIdsSpy.mock.calls).toEqual(factionResolveFromIdsCalls)
}
