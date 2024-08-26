import { DeckDbObject } from '@gwent/graphql-schema/database-typings'
import FactionResolver from '../../src/graphql/resolvers/faction-resolver'
import { DeckUnit, Faction, FactionKey, Leader, UnitStats, User } from '@gwent/graphql-schema/resolver-typings'
import LeaderResolver from '../../src/graphql/resolvers/leader-resolver'
import DeckUnitResolver from '../../src/graphql/resolvers/deck-unit-resolver'
import UserResolver from '../../src/graphql/resolvers/user-resolver'
import DeckResolver from '../../src/graphql/resolvers/deck-resolver'
import { ObjectId } from 'mongodb'

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
      })
    })
    it('calls to external resolvers without neutral stats if only deck provided', async () => {
      await testResolveFromObject({
        deck,
      })
    })
    // test explicit neutral stats (true and false)
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
}: {
  deck: DeckDbObject
  faction?: Faction
  leader?: Leader
  units?: DeckUnit[]
  user?: User
  neutralDeckStats?: boolean
  neutralLeaderStats?: boolean
  neutralUnitStats?: boolean
}) {
  const retrievedFaction: Faction = {
    created: new Date(),
    id: deck.faction.toString(),
    image: 'faction-image',
    key: FactionKey.Monsters,
    name: 'faction-retreived-name',
    stats: {} as UnitStats,
  }
  const factionResolverSpy = jest.spyOn(FactionResolver, 'resolveFromId').mockResolvedValue(retrievedFaction)
  const retrievedLeader: Leader = {
    ability: 'leader-ability',
    created: new Date(),
    faction: faction || retrievedFaction,
    id: deck.leader.toString(),
    image: 'leader-image',
    name: 'leader-retreived-name',
    quote: 'leader-quote',
  }
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'resolveFromId').mockResolvedValue(retrievedLeader)
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
  const userResolverSpy = jest.spyOn(UserResolver, 'resolveById').mockResolvedValue(retrievedUser)

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

  expect(factionResolverSpy.mock.calls).toEqual(
    faction
      ? []
      : [
          [
            {
              id: deck.faction,
              neutrals: neutralDeckStats,
            },
          ],
        ]
  )
  expect(leaderResolverSpy.mock.calls).toEqual(
    leader
      ? []
      : [
          [
            {
              id: deck.leader,
              neutralStats: neutralLeaderStats,
            },
          ],
        ]
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
  expect(userResolverSpy.mock.calls).toEqual(user ? [] : [[deck.user]])
}
