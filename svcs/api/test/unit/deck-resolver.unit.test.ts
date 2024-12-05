import { Deck, DeckUnit, Faction, Leader, Unit, User } from '@gwent/graphql-schema/resolver-typings'
import { DeckDbObject, FactionDbObject } from '@gwent/graphql-schema/database-typings'
import DeckResolver from '../../src/graphql/resolvers/types/deck-resolver'
import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import FactionResolver from '../../src/graphql/resolvers/types/faction-resolver'
import FactionStore from '../../src/database/stores/faction-store'
import LeaderResolver from '../../src/graphql/resolvers/types/leader-resolver'
import { getUniqueItems } from '@gwent/utils'
import TestUtil from '../test-util'
import UnitResolver from '../../src/graphql/resolvers/types/unit-resolver'
import UserResolver from '../../src/graphql/resolvers/types/user-resolver'

describe('deck-resolver', () => {
  describe('fromObject', () => {
    const deck = TestUtil.getDbDeck({})
    it('does not call to external resolvers if fields provided', async () => {
      const faction = TestUtil.getFaction({
        id: deck.faction,
      })
      await testResolveFromObject({
        deck,
        faction,
        leader: TestUtil.getLeader({
          id: deck.leader,
          faction,
        }),
        units: [
          {
            artStyle: 1,
            unit: TestUtil.getUnit({
              faction,
            }),
          },
        ],
        user: TestUtil.getUser({
          id: deck.user,
        }),
        factionResolverCalled: false,
        leaderResolverCalled: false,
        userResolverCalled: false,
      })
    })
    it('calls to external resolvers without neutral stats if only deck provided', async () => {
      await testResolveFromObject({
        deck,
      })
    })
    it('calls to external resolvers with neutral stats if explicit false provided', async () => {
      await testResolveFromObject({
        deck,
        neutralDeckStats: false,
        neutralLeaderStats: false,
        neutralUnitStats: false,
      })
    })
    it('calls to external resolvers with neutral stats if explicit true provided', async () => {
      await testResolveFromObject({
        deck,
        neutralDeckStats: true,
        neutralLeaderStats: true,
        neutralUnitStats: true,
      })
    })
  })
  describe('fromArray', () => {
    const deck = TestUtil.getDbDeck({})
    const faction = TestUtil.getDbFaction({
      id: deck.faction,
    })
    const resolvedFaction = TestUtil.getFactionFromDbFaction(faction)
    const leader = TestUtil.getLeader({
      id: deck.leader,
    })
    const units = deck.units.map((deckUnit) =>
      TestUtil.getUnit({
        id: deckUnit.unit,
        faction: resolvedFaction,
      })
    )
    const user = TestUtil.getUser({
      id: deck.user,
    })
    const deckUnits = units.map((unit) => {
      return {
        artStyle: 1,
        unit,
      }
    })
    it('returns resolved deck if implicit neutral stats', async () => {
      await testResolveFromArray({
        decks: [deck],
        factionsGetResponse: [faction],
        factionsResolveResponse: [resolvedFaction],
        leadersResolveResponse: [leader],
        unitsResolveResponse: units,
        userResolveResponse: [user],
        resolvedDecks: [
          TestUtil.getDeckFromDbDeck({
            deck,
            faction: resolvedFaction,
            leader,
            units: deckUnits,
            user,
          }),
        ],
        deckResolveCalls: [
          [
            {
              deck,
              faction: resolvedFaction,
              leader,
              units: deckUnits,
              user,
            },
          ],
        ],
      })
    })
    it('returns resolved deck if explicit false neutral stats', async () => {
      await testResolveFromArray({
        decks: [deck],
        neutralDeckStats: false,
        neutralLeaderStats: false,
        neutralUnitStats: false,
        factionsGetResponse: [faction],
        factionsResolveResponse: [resolvedFaction],
        leadersResolveResponse: [leader],
        unitsResolveResponse: units,
        userResolveResponse: [user],
        resolvedDecks: [
          TestUtil.getDeckFromDbDeck({
            deck,
            faction: resolvedFaction,
            leader,
            units: deckUnits,
            user,
          }),
        ],
        deckResolveCalls: [
          [
            {
              deck,
              faction: resolvedFaction,
              leader,
              units: deckUnits,
              user,
            },
          ],
        ],
      })
    })
    it('returns resolved deck if explicit true neutral stats', async () => {
      await testResolveFromArray({
        decks: [deck],
        neutralDeckStats: true,
        neutralLeaderStats: true,
        neutralUnitStats: true,
        factionsGetResponse: [faction],
        factionsResolveResponse: [resolvedFaction],
        leadersResolveResponse: [leader],
        unitsResolveResponse: units,
        userResolveResponse: [user],
        resolvedDecks: [
          TestUtil.getDeckFromDbDeck({
            deck,
            faction: resolvedFaction,
            leader,
            units: deckUnits,
            user,
          }),
        ],
        deckResolveCalls: [
          [
            {
              deck,
              faction: resolvedFaction,
              leader,
              units: deckUnits,
              user,
            },
          ],
        ],
      })
    })
  })
})

async function testResolveFromObject({
  deck,
  faction,
  leader,
  neutralDeckStats,
  neutralLeaderStats,
  neutralUnitStats,
  units,
  user,
  factionResolverCalled = true,
  leaderResolverCalled = true,
  userResolverCalled = true,
}: {
  deck: DeckDbObject
  faction?: Faction
  leader?: Leader
  units?: DeckUnit[]
  user?: User
  neutralDeckStats?: boolean
  neutralLeaderStats?: boolean
  neutralUnitStats?: boolean
  factionResolverCalled?: boolean
  leaderResolverCalled?: boolean
  userResolverCalled?: boolean
}) {
  const retrievedFaction = TestUtil.getFaction({
    id: deck.faction,
  })
  const factionResolverSpy = jest.spyOn(FactionResolver, 'fromId').mockResolvedValue(retrievedFaction)
  const retrievedLeader = TestUtil.getLeader({
    id: deck.leader,
    faction: faction || retrievedFaction,
  })
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'fromId').mockResolvedValue(retrievedLeader)
  const retrievedUnits: DeckUnit[] = deck.units.map((deckUnit) => {
    return {
      artStyle: 1,
      unit: TestUtil.getUnit({
        id: deckUnit.unit,
        faction: faction || retrievedFaction,
      }),
    }
  })
  const deckUnitResolverSpy = jest.spyOn(DeckUnitResolver, 'fromArray').mockResolvedValue(units || retrievedUnits)
  const retrievedUser = TestUtil.getUser({
    id: deck.user,
  })
  const userResolverSpy = jest.spyOn(UserResolver, 'fromId').mockResolvedValue(retrievedUser)

  await expect(
    DeckResolver.fromObject({
      deck,
      faction,
      leader,
      neutralDeckStats,
      neutralLeaderStats,
      neutralUnitStats,
      units,
      user,
    })
  ).resolves.toEqual({
    created: deck.created,
    faction: faction || retrievedFaction,
    id: deck._id.toString(),
    leader: leader || retrievedLeader,
    name: deck.name,
    stats: deck.stats,
    units: units || retrievedUnits,
    user: user || retrievedUser,
  })

  expect(factionResolverSpy.mock.calls).toEqual(
    factionResolverCalled
      ? [
          [
            {
              id: deck.faction,
              neutrals: neutralDeckStats,
            },
          ],
        ]
      : []
  )
  expect(leaderResolverSpy.mock.calls).toEqual(
    leaderResolverCalled
      ? [
          [
            {
              id: deck.leader,
              neutralStats: neutralLeaderStats,
            },
          ],
        ]
      : []
  )
  expect(deckUnitResolverSpy.mock.calls).toEqual(
    units
      ? []
      : [
          [
            {
              deckUnits: deck.units,
              neutralStats: neutralUnitStats,
            },
          ],
        ]
  )
  expect(userResolverSpy.mock.calls).toEqual(userResolverCalled ? [[deck.user]] : [])
}

async function testResolveFromArray({
  decks,
  neutralDeckStats,
  neutralLeaderStats,
  neutralUnitStats,
  factionsGetResponse = [],
  factionsResolveResponse = [],
  leadersResolveResponse = [],
  unitsResolveResponse = [],
  userResolveResponse = [],
  resolvedDecks = [],
  deckResolveCalls = [],
}: {
  decks: DeckDbObject[]
  neutralDeckStats?: boolean
  neutralLeaderStats?: boolean
  neutralUnitStats?: boolean
  factionsGetResponse?: FactionDbObject[]
  factionsResolveResponse?: Faction[]
  leadersResolveResponse?: Leader[]
  unitsResolveResponse?: Unit[]
  userResolveResponse?: User[]
  resolvedDecks?: Deck[]
  deckResolveCalls?: any[][]
}) {
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(factionsGetResponse)
  const factionResolveSpy = jest.spyOn(FactionResolver, 'fromArray').mockResolvedValue(factionsResolveResponse)
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'fromIds').mockResolvedValue(leadersResolveResponse)
  const unitResolverSpy = jest.spyOn(UnitResolver, 'fromIds').mockResolvedValue(unitsResolveResponse)
  const userResolverSpy = jest.spyOn(UserResolver, 'fromIds').mockResolvedValue(userResolveResponse)
  const deckResolverSpy = jest.spyOn(DeckResolver, 'fromObject')
  if (resolvedDecks) {
    for (const resolvedDeck of resolvedDecks) {
      deckResolverSpy.mockResolvedValueOnce(resolvedDeck)
    }
  }

  await expect(
    DeckResolver.fromArray({
      decks,
      neutralDeckStats,
      neutralLeaderStats,
      neutralUnitStats,
    })
  ).resolves.toEqual(resolvedDecks)

  expect(factionGetSpy.mock.calls).toEqual([
    [
      {
        ids: decks.map((deck) => deck.faction),
      },
    ],
  ])
  expect(factionResolveSpy.mock.calls).toEqual([
    [
      {
        factions: factionsGetResponse,
        neutralStats: neutralDeckStats,
      },
    ],
  ])
  expect(leaderResolverSpy.mock.calls).toEqual([
    [
      {
        ids: decks.map((deck) => deck.leader),
        factions: factionsGetResponse,
        neutralStats: neutralLeaderStats,
      },
    ],
  ])
  const unitIds: string[] = []
  for (const deck of decks) {
    unitIds.push(...deck.units.map((unit) => unit.unit.toString()))
  }
  expect(unitResolverSpy.mock.calls).toEqual([
    [
      {
        ids: getUniqueItems<string>(unitIds),
        factions: factionsGetResponse,
        neutralStats: neutralUnitStats,
      },
    ],
  ])
  expect(userResolverSpy.mock.calls).toEqual([[decks.map((deck) => deck.user)]])
  expect(deckResolverSpy.mock.calls).toEqual(deckResolveCalls)
}
