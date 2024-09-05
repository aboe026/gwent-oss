import { DeckDbObject, FactionDbObject } from '@gwent/graphql-schema/database-typings'
import FactionResolver from '../../src/graphql/resolvers/faction-resolver'
import { Deck, DeckUnit, Faction, Leader, Unit, User } from '@gwent/graphql-schema/resolver-typings'
import LeaderResolver from '../../src/graphql/resolvers/leader-resolver'
import DeckUnitResolver from '../../src/graphql/resolvers/deck-unit-resolver'
import UserResolver from '../../src/graphql/resolvers/user-resolver'
import DeckResolver from '../../src/graphql/resolvers/deck-resolver'
import FactionStore from '../../src/database/stores/faction-store'
import UnitResolver from '../../src/graphql/resolvers/unit-resolver'
import { getUniqueItems } from '@gwent/utils'
import TestUtil from '../test-util'

describe('deck-resolver', () => {
  describe('resolveFromObject', () => {
    const deck = TestUtil.getDbDeck({})
    it('throws error if faction cannot be resolved', async () => {
      await testResolveFromObject({
        deck,
        factionResolved: false,
        error: `Could not resolve faction "${deck.faction}" for deck "${deck._id}".`,
        leaderResolverCalled: false,
        userResolverCalled: false,
      })
    })
    it('throws error if leader cannot be resolved', async () => {
      await testResolveFromObject({
        deck,
        leaderResolved: false,
        error: `Could not resolve leader "${deck.leader}" for deck "${deck._id}".`,
        userResolverCalled: false,
      })
    })
    it('throws error if user cannot be resolved', async () => {
      await testResolveFromObject({
        deck,
        userResolved: false,
        error: `Could not resolve user "${deck.user}" for deck "${deck._id}".`,
      })
    })
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
  describe('resolveFromArray', () => {
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
    it('throws error if faction not found', async () => {
      await testResolveFromArray({
        decks: [deck],
        factionsGetResponse: [
          TestUtil.getDbFaction({
            id: deck.faction,
          }),
        ],
        factionsResolveResponse: [],
        error: `Could not resolve faction "${deck.faction}" for deck "${deck._id}" in array.`,
      })
    })
    it('throws error if leader not found', async () => {
      await testResolveFromArray({
        decks: [deck],
        factionsGetResponse: [faction],
        factionsResolveResponse: [TestUtil.getFactionFromDbFaction(faction)],
        leadersResolveResponse: [],
        error: `Could not resolve leader "${deck.leader}" for deck "${deck._id}" in array.`,
      })
    })
    it('throws error if unit not found', async () => {
      await testResolveFromArray({
        decks: [deck],
        factionsGetResponse: [faction],
        factionsResolveResponse: [TestUtil.getFactionFromDbFaction(faction)],
        leadersResolveResponse: [
          TestUtil.getLeader({
            id: deck.leader,
          }),
        ],
        error: `Could not resolve unit "${deck.units[0].unit}" for deck "${deck._id}" in array.`,
      })
    })
    it('throws error if user not found', async () => {
      await testResolveFromArray({
        decks: [deck],
        factionsGetResponse: [faction],
        factionsResolveResponse: [TestUtil.getFactionFromDbFaction(faction)],
        leadersResolveResponse: [
          TestUtil.getLeader({
            id: deck.leader,
          }),
        ],
        unitsResolveResponse: deck.units.map((deckUnit) =>
          TestUtil.getUnit({
            id: deckUnit.unit,
          })
        ),
        error: `Could not resolve user "${deck.user}" for deck "${deck._id}" in array.`,
      })
    })
    it('returns resolved deck if no errors and implicit neutral stats', async () => {
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
    it('returns resolved deck if no errors and explicit false neutral stats', async () => {
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
    it('returns resolved deck if no errors and explicit true neutral stats', async () => {
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
    // it('calls to other resolvers with unique ids and undefined for stats', async () => {
    //   await testResolveFromArray({})
    // })
    // it('calls to other resolvers with unique ids and explicit false for stats', async () => {
    //   await testResolveFromArray({
    //     neutralDeckStats: false,
    //     neutralLeaderStats: false,
    //     neutralUnitStats: false,
    //   })
    // })
    // it('calls to other resolvers with unique ids and explicit true for stats', async () => {
    //   await testResolveFromArray({
    //     neutralDeckStats: true,
    //     neutralLeaderStats: true,
    //     neutralUnitStats: true,
    //   })
    // })
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
  factionResolved = true,
  leaderResolved = true,
  userResolved = true,
  error,
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
  factionResolved?: boolean
  leaderResolved?: boolean
  userResolved?: boolean
  error?: string
  factionResolverCalled?: boolean
  leaderResolverCalled?: boolean
  userResolverCalled?: boolean
}) {
  const retrievedFaction = TestUtil.getFaction({
    id: deck.faction,
  })
  const factionResolverSpy = jest
    .spyOn(FactionResolver, 'resolveFromId')
    .mockResolvedValue(factionResolved ? retrievedFaction : undefined)
  const retrievedLeader = TestUtil.getLeader({
    id: deck.leader,
    faction: faction || retrievedFaction,
  })
  const leaderResolverSpy = jest
    .spyOn(LeaderResolver, 'resolveFromId')
    .mockResolvedValue(leaderResolved ? retrievedLeader : undefined)
  const retrievedUnits: DeckUnit[] = deck.units.map((deckUnit) => {
    return {
      artStyle: 1,
      unit: TestUtil.getUnit({
        id: deckUnit.unit,
        faction: faction || retrievedFaction,
      }),
    }
  })
  const deckUnitResolverSpy = jest
    .spyOn(DeckUnitResolver, 'resolveFromArray')
    .mockResolvedValue(units || retrievedUnits)
  const retrievedUser = TestUtil.getUser({
    id: deck.user,
  })
  const userResolverSpy = jest
    .spyOn(UserResolver, 'resolveById')
    .mockResolvedValue(userResolved ? retrievedUser : undefined)

  const promise = DeckResolver.resolveFromObject({
    deck,
    faction,
    leader,
    neutralDeckStats,
    neutralLeaderStats,
    neutralUnitStats,
    units,
    user,
  })
  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual({
      created: deck.created,
      faction: faction || retrievedFaction,
      id: deck._id.toString(),
      leader: leader || retrievedLeader,
      name: deck.name,
      stats: deck.stats,
      units: units || retrievedUnits,
      user: user || retrievedUser,
    })
  }

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
    units || error
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
  error,
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
  error?: string
  deckResolveCalls?: any[][]
}) {
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(factionsGetResponse)
  const factionResolveSpy = jest.spyOn(FactionResolver, 'resolveFromArray').mockResolvedValue(factionsResolveResponse)
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'resolveFromIds').mockResolvedValue(leadersResolveResponse)
  const unitResolverSpy = jest.spyOn(UnitResolver, 'resolveFromIds').mockResolvedValue(unitsResolveResponse)
  const userResolverSpy = jest.spyOn(UserResolver, 'resolveByIds').mockResolvedValue(userResolveResponse)
  const deckResolverSpy = jest.spyOn(DeckResolver, 'resolveFromObject')
  if (resolvedDecks) {
    for (const resolvedDeck of resolvedDecks) {
      deckResolverSpy.mockResolvedValueOnce(resolvedDeck)
    }
  }

  const promise = DeckResolver.resolveFromArray({
    decks,
    neutralDeckStats,
    neutralLeaderStats,
    neutralUnitStats,
  })
  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual(resolvedDecks)
  }

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
