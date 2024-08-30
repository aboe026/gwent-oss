import { DeckDbObject, FactionDbObject } from '@gwent/graphql-schema/database-typings'
import FactionResolver from '../../src/graphql/resolvers/faction-resolver'
import {
  Deck,
  DeckUnit,
  Faction,
  FactionKey,
  Leader,
  Unit,
  UnitStats,
  User,
} from '@gwent/graphql-schema/resolver-typings'
import LeaderResolver from '../../src/graphql/resolvers/leader-resolver'
import DeckUnitResolver from '../../src/graphql/resolvers/deck-unit-resolver'
import UserResolver from '../../src/graphql/resolvers/user-resolver'
import DeckResolver from '../../src/graphql/resolvers/deck-resolver'
import { ObjectId } from 'mongodb'
import FactionStore from '../../src/database/stores/faction-store'
import UnitResolver from '../../src/graphql/resolvers/unit-resolver'

describe('deck-resolver', () => {
  describe('resolveFromObject', () => {
    const deck: DeckDbObject = {
      _id: new ObjectId(),
      created: new Date(),
      faction: new ObjectId(),
      leader: new ObjectId(),
      name: 'deck-name',
      stats: {} as UnitStats,
      units: [
        {
          artStyle: 1,
          unit: new ObjectId(),
        },
      ],
      user: new ObjectId(),
    }
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
      const faction: Faction = {
        created: new Date(),
        id: deck.faction.toString(),
        image: 'faction-image',
        key: FactionKey.Monsters,
        name: 'faction-name',
        stats: {} as UnitStats,
      }
      await testResolveFromObject({
        deck,
        faction,
        leader: {
          ability: 'leader-ability',
          created: new Date(),
          faction: faction,
          id: deck.leader.toString(),
          image: 'leader-image',
          name: 'leader-name',
          quote: 'leader-quote',
        },
        units: [
          {
            artStyle: 1,
            unit: {
              created: new Date(),
              deckable: true,
              faction: faction,
              id: new ObjectId().toString(),
              images: ['deck-unit-image'],
              name: 'deck-unit-name',
              quote: 'deck-unit-quote',
            },
          },
        ],
        user: {
          created: new Date(),
          id: deck.user.toString(),
          name: 'user-name',
        },
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
  const retrievedFaction: Faction = {
    created: new Date(),
    id: deck.faction.toString(),
    image: 'faction-image',
    key: FactionKey.Monsters,
    name: 'faction-retreived-name',
    stats: {} as UnitStats,
  }
  const factionResolverSpy = jest
    .spyOn(FactionResolver, 'resolveFromId')
    .mockResolvedValue(factionResolved ? retrievedFaction : undefined)
  const retrievedLeader: Leader = {
    ability: 'leader-ability',
    created: new Date(),
    faction: faction || retrievedFaction,
    id: deck.leader.toString(),
    image: 'leader-image',
    name: 'leader-retreived-name',
    quote: 'leader-quote',
  }
  const leaderResolverSpy = jest
    .spyOn(LeaderResolver, 'resolveFromId')
    .mockResolvedValue(leaderResolved ? retrievedLeader : undefined)
  const retrievedUnits: DeckUnit[] = deck.units.map((deckUnit, index) => {
    return {
      artStyle: 1,
      unit: {
        created: new Date(),
        deckable: true,
        faction: faction || retrievedFaction,
        id: deckUnit.unit.id.toString(),
        images: [`deck-unit-image-${index}`],
        name: `deck-unit-retreived-name-${index}`,
        quote: `deck-unit-quote-${index}`,
      },
    }
  })
  const deckUnitResolverSpy = jest
    .spyOn(DeckUnitResolver, 'resolveFromArray')
    .mockResolvedValue(units || retrievedUnits)
  const retrievedUser: User = {
    created: new Date(),
    id: deck.user.toString(),
    name: 'user-retreived-name',
  }
  const userResolverSpy = jest
    .spyOn(UserResolver, 'resolveById')
    .mockResolvedValue(userResolved ? retrievedUser : undefined)

  if (error) {
    await expect(
      DeckResolver.resolveFromObject({
        deck,
        faction,
        leader,
        neutralDeckStats,
        neutralLeaderStats,
        neutralUnitStats,
        units,
        user,
      })
    ).rejects.toThrow(Error(error))
  } else {
    await expect(
      DeckResolver.resolveFromObject({
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
  const user: User = {
    id: new ObjectId().toString(),
    created: new Date(),
    name: 'user-name',
  }
  const faction: FactionDbObject = {
    _id: new ObjectId(),
    created: new Date(),
    image: 'faction-image',
    key: FactionKey.Monsters,
    name: 'faction-name',
    stats: {} as UnitStats,
  }
  const resolvedFaction: Faction = {
    created: faction.created,
    id: faction._id.toString(),
    image: faction.image,
    key: FactionKey.Monsters,
    name: faction.name,
    stats: faction.stats,
  }
  const leader: Leader = {
    id: new ObjectId().toString(),
    ability: 'leader-ability',
    created: new Date(),
    faction: resolvedFaction,
    image: 'leader-image',
    name: 'leader-name',
    quote: 'leader-quote',
  }
  const unit: Unit = {
    id: new ObjectId().toString(),
    created: new Date(),
    deckable: true,
    faction: resolvedFaction,
    images: ['unit-image'],
    name: 'unit-name',
    quote: 'unit-quote',
  }
  const deck1: DeckDbObject = {
    _id: new ObjectId(),
    created: new Date(),
    faction: faction._id,
    leader: new ObjectId(leader.id),
    name: 'deck-name-1',
    stats: {} as UnitStats,
    units: [
      {
        artStyle: 1,
        unit: new ObjectId(unit.id),
      },
    ],
    user: new ObjectId(user.id),
  }
  const deck2: DeckDbObject = {
    _id: new ObjectId(),
    created: new Date(),
    faction: faction._id,
    leader: new ObjectId(leader.id),
    name: 'deck-name-2',
    stats: {} as UnitStats,
    units: [
      {
        artStyle: 1,
        unit: new ObjectId(unit.id),
      },
    ],
    user: new ObjectId(user.id),
  }
  const resolvedDeck1: Deck = {
    created: deck1.created,
    faction: resolvedFaction,
    id: deck1._id.toString(),
    leader,
    name: deck1.name,
    stats: deck1.stats,
    units: [
      {
        artStyle: 1,
        unit,
      },
    ],
    user,
  }

  const resolvedDeck2: Deck = {
    created: deck2.created,
    faction: resolvedFaction,
    id: deck2._id.toString(),
    leader,
    name: deck2.name,
    stats: deck2.stats,
    units: [
      {
        artStyle: 1,
        unit,
      },
    ],
    user,
  }
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
