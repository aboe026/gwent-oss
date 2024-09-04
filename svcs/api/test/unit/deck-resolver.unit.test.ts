import { DeckDbObject } from '@gwent/graphql-schema/database-typings'
import FactionResolver from '../../src/graphql/resolvers/faction-resolver'
import { DeckUnit, Faction, Leader, User } from '@gwent/graphql-schema/resolver-typings'
import LeaderResolver from '../../src/graphql/resolvers/leader-resolver'
import DeckUnitResolver from '../../src/graphql/resolvers/deck-unit-resolver'
import UserResolver from '../../src/graphql/resolvers/user-resolver'
import DeckResolver from '../../src/graphql/resolvers/deck-resolver'
import { ObjectId } from 'mongodb'
import FactionStore from '../../src/database/stores/faction-store'
import UnitResolver from '../../src/graphql/resolvers/unit-resolver'
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
    it('calls to other resolvers with unique ids and undefined for stats', async () => {
      await testResolveFromArray({})
    })
    it('calls to other resolvers with unique ids and explicit false for stats', async () => {
      await testResolveFromArray({
        neutralDeckStats: false,
        neutralLeaderStats: false,
        neutralUnitStats: false,
      })
    })
    it('calls to other resolvers with unique ids and explicit true for stats', async () => {
      await testResolveFromArray({
        neutralDeckStats: true,
        neutralLeaderStats: true,
        neutralUnitStats: true,
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
  neutralDeckStats,
  neutralLeaderStats,
  neutralUnitStats,
}: {
  neutralDeckStats?: boolean
  neutralLeaderStats?: boolean
  neutralUnitStats?: boolean
}) {
  const user = TestUtil.getUser({})
  const faction = TestUtil.getDbFaction({})
  const resolvedFaction = TestUtil.getFactionFromDbFaction(faction)
  const leader = TestUtil.getLeader({
    faction: resolvedFaction,
  })
  const unit = TestUtil.getUnit({
    faction: resolvedFaction,
  })
  const deck1 = TestUtil.getDbDeck({
    user: user.id,
    faction: faction._id,
    leader: leader.id,
    units: [
      {
        artStyle: 1,
        unit: new ObjectId(unit.id),
      },
    ],
  })
  const deck2 = TestUtil.getDbDeck({
    user: user.id,
    faction: faction._id,
    leader: leader.id,
    units: [
      {
        artStyle: 1,
        unit: new ObjectId(unit.id),
      },
    ],
  })
  const resolvedDeck1 = TestUtil.getDeckFromDbDeck(deck1)
  const resolvedDeck2 = TestUtil.getDeckFromDbDeck(deck2)
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([faction])
  const factionResolveSpy = jest.spyOn(FactionResolver, 'resolveFromArray').mockResolvedValue([resolvedFaction])
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'resolveFromIds').mockResolvedValue([leader])
  const unitResolverSpy = jest.spyOn(UnitResolver, 'resolveFromIds').mockResolvedValue([unit])
  const userResolverSpy = jest.spyOn(UserResolver, 'resolveByIds').mockResolvedValue([user])
  const deckResolverSpy = jest
    .spyOn(DeckResolver, 'resolveFromObject')
    .mockResolvedValueOnce(resolvedDeck1)
    .mockResolvedValueOnce(resolvedDeck2)

  await expect(
    DeckResolver.resolveFromArray({
      decks: [deck1, deck2],
      neutralDeckStats,
      neutralLeaderStats,
      neutralUnitStats,
    })
  ).resolves.toEqual([resolvedDeck1, resolvedDeck2])

  expect(factionGetSpy.mock.calls).toEqual([
    [
      {
        ids: [faction._id],
      },
    ],
  ])
  expect(factionResolveSpy.mock.calls).toEqual([
    [
      {
        factions: [faction],
        neutralStats: neutralDeckStats,
      },
    ],
  ])
  expect(leaderResolverSpy.mock.calls).toEqual([
    [
      {
        ids: [new ObjectId(leader.id)],
        factions: [faction],
        neutralStats: neutralLeaderStats,
      },
    ],
  ])
  expect(unitResolverSpy.mock.calls).toEqual([
    [
      {
        ids: [unit.id],
        factions: [faction],
        neutralStats: neutralUnitStats,
      },
    ],
  ])
  expect(userResolverSpy.mock.calls).toEqual([[[new ObjectId(user.id)]]])
  expect(deckResolverSpy.mock.calls).toEqual([
    [
      {
        deck: deck1,
        faction: resolvedFaction,
        leader,
        units: [
          {
            artStyle: 1,
            unit,
          },
        ],
        user,
      },
    ],
    [
      {
        deck: deck2,
        faction: resolvedFaction,
        leader,
        units: [
          {
            artStyle: 1,
            unit,
          },
        ],
        user,
      },
    ],
  ])
}
