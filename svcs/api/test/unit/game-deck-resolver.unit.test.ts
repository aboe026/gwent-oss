import { ObjectId } from 'mongodb'
import DeckResolver from '../../src/graphql/resolvers/deck-resolver'
import DeckUnitResolver from '../../src/graphql/resolvers/deck-unit-resolver'
import { Deck, DeckUnit, Faction, Leader, User } from '@gwent/graphql-schema/resolver-typings'
import GameDeckResolver from '../../src/graphql/resolvers/game-deck-resolver'
import { DeckDbObject, DeckUnitDbObject, GameDeckDbObject } from '@gwent/graphql-schema/database-typings'
import TestUtil from '../test-util'

describe('game-deck-resolver', () => {
  describe('resolveFromObject', () => {
    it('does not call out to deck resolver if no from', async () => {
      await testResolveFromObject({
        from: false,
      })
    })
    it('calls out to deck resolver if from with undefined neutral stats', async () => {
      await testResolveFromObject({})
    })
    it('calls out to deck resolver if from with explicit false neutral stats', async () => {
      await testResolveFromObject({
        neutralDeckStats: false,
        neutralLeaderStats: false,
        neutralUnitStats: false,
      })
    })
    it('calls out to deck resolver if from with explicit true neutral stats', async () => {
      await testResolveFromObject({
        neutralDeckStats: true,
        neutralLeaderStats: true,
        neutralUnitStats: true,
      })
    })
  })
})

async function testResolveFromObject({
  from = true,
  neutralDeckStats,
  neutralLeaderStats,
  neutralUnitStats,
}: {
  from?: boolean
  neutralDeckStats?: boolean
  neutralLeaderStats?: boolean
  neutralUnitStats?: boolean
}) {
  const discardId = new ObjectId()
  const handId = new ObjectId()
  const redrawFromId = new ObjectId()
  const redrawToId = new ObjectId()
  const undrawnId = new ObjectId()
  const discard = getDeckUnit(discardId)
  const hand = getDeckUnit(handId)
  const redrawFrom = getDeckUnit(redrawFromId)
  const redrawTo = getDeckUnit(redrawToId)
  const undrawn = getDeckUnit(undrawnId)
  const deckDbObject: DeckDbObject = {
    _id: new ObjectId(),
    created: new Date(),
    faction: new ObjectId(),
    leader: new ObjectId(),
    name: 'deck-name',
    stats: TestUtil.getStats(),
    units: [],
    user: new ObjectId(),
  }
  const resolvedDeck: Deck = {
    created: deckDbObject.created,
    faction: {
      id: deckDbObject.faction.toString(),
    } as Faction,
    id: deckDbObject._id.toString(),
    leader: {
      id: deckDbObject.leader.toString(),
    } as Leader,
    name: deckDbObject.name,
    stats: deckDbObject.stats,
    units: [],
    user: {
      id: deckDbObject.user.toString(),
    } as User,
  }
  const gameDeck: GameDeckDbObject = {
    discard: [getDeckUnitDbObject(discardId)],
    hand: [getDeckUnitDbObject(handId)],
    redraws: [
      {
        from: getDeckUnitDbObject(redrawFromId),
        to: getDeckUnitDbObject(redrawToId),
      },
    ],
    undrawn: [getDeckUnitDbObject(undrawnId)],
  }
  if (from) {
    gameDeck.from = deckDbObject
  }
  const deckResolverSpy = jest.spyOn(DeckResolver, 'resolveFromObject')
  if (from) {
    deckResolverSpy.mockResolvedValue(resolvedDeck)
  }
  const deckUnitResolverSpy = jest
    .spyOn(DeckUnitResolver, 'resolveFromArray')
    .mockResolvedValue([discard, hand, redrawFrom, redrawTo, undrawn])

  await expect(
    GameDeckResolver.resolveFromObject({
      gameDeck,
      neutralDeckStats,
      neutralLeaderStats,
      neutralUnitStats,
    })
  ).resolves.toEqual({
    discard: [discard],
    from: from ? resolvedDeck : undefined,
    hand: [hand],
    redraws: [
      {
        from: redrawFrom,
        to: redrawTo,
      },
    ],
    undrawn: [undrawn],
  })

  expect(deckResolverSpy.mock.calls).toEqual(
    from
      ? [
          [
            {
              deck: gameDeck.from,
              neutralDeckStats,
              neutralLeaderStats,
              neutralUnitStats,
            },
          ],
        ]
      : []
  )
  expect(deckUnitResolverSpy.mock.calls).toEqual([
    [
      {
        deckUnits: [
          getDeckUnitDbObject(discardId),
          getDeckUnitDbObject(handId),
          getDeckUnitDbObject(redrawFromId),
          getDeckUnitDbObject(redrawToId),
          getDeckUnitDbObject(undrawnId),
        ],
        neutralStats: neutralUnitStats,
      },
    ],
  ])
}

function getDeckUnitDbObject(id: ObjectId): DeckUnitDbObject {
  return {
    artStyle: 1,
    unit: id,
  }
}

function getDeckUnit(id: ObjectId): DeckUnit {
  return {
    artStyle: 1,
    unit: {
      created: new Date(),
      deckable: true,
      faction: {} as Faction,
      id: id.toString(),
      images: ['unit-image'],
      name: 'unit-name',
      quote: 'unit-quote',
    },
  }
}
