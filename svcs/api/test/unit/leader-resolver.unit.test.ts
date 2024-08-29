import { FactionDbObject, LeaderDbObject } from '@gwent/graphql-schema/database-typings'
import DlcResolver from '../../src/graphql/resolvers/dlc-resolver'
import FactionResolver from '../../src/graphql/resolvers/faction-resolver'
import { Dlc, DlcKey, Faction, FactionKey, Leader, UnitStats } from '@gwent/graphql-schema/resolver-typings'
import LeaderResolver from '../../src/graphql/resolvers/leader-resolver'
import { ObjectId } from 'mongodb'
import LeaderStore from '../../src/database/stores/leader-store'

describe('leader-resolver', () => {
  describe('resolveFromObject', () => {
    const leader: LeaderDbObject = {
      _id: new ObjectId(),
      ability: 'leader-ability',
      created: new Date(),
      faction: new ObjectId(),
      image: 'leader-image',
      name: 'leader-name',
      quote: 'leader-quote',
    }
    it('throws error if faction not resolveable', async () => {
      await testResolveFromObject({
        leader,
        resolveFaction: false,
        error: `Could not resolve faction "${leader.faction}" for leader "${leader._id}".`,
      })
    })
    it('throws error if dlc not resolveable', async () => {
      const dlcId = new ObjectId()
      await testResolveFromObject({
        leader: {
          ...leader,
          dlc: dlcId,
        },
        resolveDlc: false,
        error: `Could not resolve dlc "${dlcId}" for leader "${leader._id}".`,
      })
    })
    it('does not call to external resolvers if required fields provided', async () => {
      await testResolveFromObject({
        leader,
        faction: {
          created: new Date(),
          id: leader.faction.toString(),
          image: 'faction-image',
          key: FactionKey.Monsters,
          name: 'faction-name',
          stats: {} as UnitStats,
        },
      })
    })
    it('does not call to external resolvers if all fields provided', async () => {
      const dlc: Dlc = {
        created: new Date(),
        id: new ObjectId().toString(),
        image: 'dlc-image',
        key: DlcKey.BloodAndWine,
        name: 'dlc-name',
      }
      await testResolveFromObject({
        leader: {
          ...leader,
          dlc: new ObjectId(dlc.id),
        },
        faction: {
          created: new Date(),
          id: leader.faction.toString(),
          image: 'faction-image',
          key: FactionKey.Monsters,
          name: 'faction-name',
          stats: {} as UnitStats,
        },
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
    it('returns undefined if resolveFromIds returns undefined', async () => {
      const id = new ObjectId()
      const resolveFromIdsSpy = jest.spyOn(LeaderResolver, 'resolveFromIds').mockResolvedValue(undefined as any)

      await expect(
        LeaderResolver.resolveFromId({
          id,
        })
      ).resolves.toEqual(undefined)

      expect(resolveFromIdsSpy.mock.calls).toEqual([
        [
          {
            ids: [id],
            neutralStats: undefined,
          },
        ],
      ])
    })
    it('returns first leader if resolveFromIds returns a leader', async () => {
      const id = new ObjectId()
      const leader: Leader = {
        ability: 'leader-ability',
        created: new Date(),
        faction: {} as Faction,
        id: id.toString(),
        image: 'leader-image',
        name: 'leader-name',
        quote: 'leader-quote',
      }
      const resolveFromIdsSpy = jest.spyOn(LeaderResolver, 'resolveFromIds').mockResolvedValue([leader])

      await expect(
        LeaderResolver.resolveFromId({
          id,
        })
      ).resolves.toEqual(leader)

      expect(resolveFromIdsSpy.mock.calls).toEqual([
        [
          {
            ids: [id],
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
    it('throws error if faction cannot be resolved', async () => {
      const leader: LeaderDbObject = {
        _id: new ObjectId(),
        ability: 'leader-ability',
        created: new Date(),
        faction: new ObjectId(),
        image: 'leader-image',
        name: 'leader-name',
        quote: 'leader-quote',
      }
      await testResolveFromArray({
        leaders: [leader],
        resolvedFactions: [],
        error: `Could not resolve faction "${leader.faction}" for leader "${leader._id}" in array.`,
      })
    })
    it('throws error if dlc cannot be resolved', async () => {
      const leader: LeaderDbObject = {
        _id: new ObjectId(),
        ability: 'leader-ability',
        created: new Date(),
        faction: new ObjectId(),
        image: 'leader-image',
        name: 'leader-name',
        quote: 'leader-quote',
        dlc: new ObjectId(),
      }
      const resolvedFaction: Faction = {
        created: new Date(),
        id: leader.faction.toString(),
        image: 'faction-image',
        key: FactionKey.Monsters,
        name: 'faction-name',
        stats: {} as UnitStats,
      }
      await testResolveFromArray({
        leaders: [leader],
        resolvedFactions: [resolvedFaction],
        dlcsResolveResponse: [],
        error: `Could not resolve dlc "${leader.dlc}" for leader "${leader._id}" in array.`,
        dlcsResolverCalls: [[[leader.dlc]]],
      })
    })
    it('does not call to FactionResolver if resolved factions provided', async () => {
      const leader: LeaderDbObject = {
        _id: new ObjectId(),
        ability: 'leader-ability',
        created: new Date(),
        faction: new ObjectId(),
        image: 'leader-image',
        name: 'leader-name',
        quote: 'leader-quote',
      }
      const resolvedFaction: Faction = {
        created: new Date(),
        id: leader.faction.toString(),
        image: 'faction-image',
        key: FactionKey.Monsters,
        name: 'faction-name',
        stats: {} as UnitStats,
      }
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
      const leader: LeaderDbObject = {
        _id: new ObjectId(),
        ability: 'leader-ability',
        created: new Date(),
        faction: new ObjectId(),
        image: 'leader-image',
        name: 'leader-name',
        quote: 'leader-quote',
      }
      const resolvedFaction: Faction = {
        created: new Date(),
        id: leader.faction.toString(),
        image: 'faction-image',
        key: FactionKey.Monsters,
        name: 'faction-name',
        stats: {} as UnitStats,
      }
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
      const leader: LeaderDbObject = {
        _id: new ObjectId(),
        ability: 'leader-ability',
        created: new Date(),
        faction: new ObjectId(),
        image: 'leader-image',
        name: 'leader-name',
        quote: 'leader-quote',
      }
      const faction: FactionDbObject = {
        _id: leader.faction,
        created: new Date(),
        image: 'faction-image',
        key: FactionKey.Monsters,
        name: 'faction-name',
        stats: {} as UnitStats,
      }
      const resolvedFaction: Faction = {
        created: faction.created,
        id: leader.faction.toString(),
        image: faction.image,
        key: FactionKey.Monsters,
        name: faction.name,
        stats: faction.stats,
      }
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
      const dlc: Dlc = {
        created: new Date(),
        id: new ObjectId().toString(),
        image: 'dlc-image',
        key: DlcKey.BloodAndWine,
        name: 'dlc-name',
      }
      const leader1: LeaderDbObject = {
        _id: new ObjectId(),
        ability: 'leader-1-ability',
        created: new Date(),
        faction: new ObjectId(),
        image: 'leader-1-image',
        name: 'leader-1-name',
        quote: 'leader-1-quote',
        dlc: new ObjectId(dlc.id),
      }
      const leader2: LeaderDbObject = {
        _id: new ObjectId(),
        ability: 'leader-2-ability',
        created: new Date(),
        faction: leader1.faction,
        image: 'leader-2-image',
        name: 'leader-2-name',
        quote: 'leader-2-quote',
        dlc: new ObjectId(dlc.id),
      }
      const resolvedFaction: Faction = {
        created: new Date(),
        id: leader1.faction.toString(),
        image: 'faction-image',
        key: FactionKey.Monsters,
        name: 'faction-name',
        stats: {} as UnitStats,
      }
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
  resolveFaction = true,
  resolveDlc = true,
  dlc,
  neutralStats,
  error,
}: {
  leader: LeaderDbObject
  faction?: Faction
  resolveFaction?: boolean
  resolveDlc?: boolean
  dlc?: Dlc
  neutralStats?: boolean
  error?: string
}) {
  const resolvedDlc: Dlc = dlc || {
    created: new Date(),
    id: (leader.dlc || '')?.toString(),
    image: 'dlc-image',
    key: DlcKey.BloodAndWine,
    name: 'dlc-name',
  }
  const resolvedFaction: Faction = faction || {
    created: new Date(),
    id: leader.faction.toString(),
    image: 'faction-iamge',
    key: FactionKey.Monsters,
    name: 'faction-name',
    stats: {} as UnitStats,
  }
  const resolvedLeader: Leader = {
    ability: leader.ability,
    created: leader.created,
    faction: resolvedFaction,
    id: leader._id.toString(),
    image: leader.image,
    name: leader.name,
    quote: leader.quote,
    dlc: null,
  }
  if (leader.dlc) {
    resolvedLeader.dlc = resolvedDlc
  }
  const dlcResolverSpy = jest.spyOn(DlcResolver, 'resolveFromId').mockResolvedValue(resolveDlc ? resolvedDlc : null)
  const factionResolverSpy = jest
    .spyOn(FactionResolver, 'resolveFromId')
    .mockResolvedValue(resolveFaction ? resolvedFaction : undefined)

  if (error) {
    await expect(
      LeaderResolver.resolveFromObject({
        leader,
        dlc,
        faction,
        neutralStats,
      })
    ).rejects.toThrow(Error(error))
  } else {
    await expect(
      LeaderResolver.resolveFromObject({
        leader,
        dlc,
        faction,
        neutralStats,
      })
    ).resolves.toEqual(resolvedLeader)
  }

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

async function testResolveFromIds({ ids }: { ids: (ObjectId | string)[] }) {
  const leaders: LeaderDbObject[] = ids
    ? ids.map((id, index) => {
        return {
          _id: new ObjectId(id),
          ability: `leader-${index}-ability`,
          created: new Date(),
          faction: new ObjectId(),
          image: `leader-${index}-image`,
          name: `leader-${index}-name`,
          quote: `leader-${index}-quote`,
        }
      })
    : []
  const resolvedLeaders = leaders.map((leader) => {
    return {
      ability: leader.ability,
      created: leader.created,
      faction: {} as Faction,
      id: leader._id.toString(),
      image: leader.image,
      name: leader.name,
      quote: leader.quote,
    }
  })
  const getSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue(leaders)
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
