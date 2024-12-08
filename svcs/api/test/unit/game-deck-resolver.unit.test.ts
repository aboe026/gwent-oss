import { ObjectId } from 'mongodb'

import DeckResolver from '../../src/graphql/resolvers/types/deck-resolver'
import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import GameDeckResolver from '../../src/graphql/resolvers/types/game-deck-resolver'
import TestUtil from '../test-util'

describe('game-deck-resolver', () => {
  describe('fromObject', () => {
    it('does not call out to deck resolver if no from', async () => {
      await testResolveFromObject({
        from: false,
      })
    })
    it('calls out to deck resolver if from', async () => {
      await testResolveFromObject({})
    })
  })
})

async function testResolveFromObject({ from = true }: { from?: boolean }) {
  const discardId = new ObjectId()
  const handId = new ObjectId()
  const redrawFromId = new ObjectId()
  const redrawToId = new ObjectId()
  const undrawnId = new ObjectId()
  const discard = TestUtil.getDeckUnit({
    id: discardId,
  })
  const hand = TestUtil.getDeckUnit({
    id: handId,
  })
  const redrawFrom = TestUtil.getDeckUnit({
    id: redrawFromId,
  })
  const redrawTo = TestUtil.getDeckUnit({
    id: redrawToId,
  })
  const undrawn = TestUtil.getDeckUnit({
    id: undrawnId,
  })
  const deckDbObject = TestUtil.getDbDeck({})
  const resolvedDeck = TestUtil.getDeckFromDbDeck({
    deck: deckDbObject,
  })
  const gameDeck = TestUtil.getDbGameDeck({
    discard: [
      TestUtil.getDbDeckUnit({
        id: discardId,
      }),
    ],
    hand: [
      TestUtil.getDbDeckUnit({
        id: handId,
      }),
    ],
    redraws: [
      {
        from: TestUtil.getDbDeckUnit({
          id: redrawFromId,
        }),
        to: TestUtil.getDbDeckUnit({
          id: redrawToId,
        }),
      },
    ],
    undrawn: [
      TestUtil.getDbDeckUnit({
        id: undrawnId,
      }),
    ],
  })
  if (from) {
    gameDeck.from = deckDbObject
  }
  const deckResolverSpy = jest.spyOn(DeckResolver, 'fromObject')
  if (from) {
    deckResolverSpy.mockResolvedValue(resolvedDeck)
  }
  const deckUnitResolverSpy = jest
    .spyOn(DeckUnitResolver, 'fromArray')
    .mockResolvedValue([discard, hand, redrawFrom, redrawTo, undrawn])

  await expect(
    GameDeckResolver.fromObject({
      gameDeck,
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
            },
          ],
        ]
      : []
  )
  expect(deckUnitResolverSpy.mock.calls).toEqual([
    [
      {
        deckUnits: [
          TestUtil.getDbDeckUnit({
            id: discardId,
          }),
          TestUtil.getDbDeckUnit({
            id: handId,
          }),
          TestUtil.getDbDeckUnit({
            id: redrawFromId,
          }),
          TestUtil.getDbDeckUnit({
            id: redrawToId,
          }),
          TestUtil.getDbDeckUnit({
            id: undrawnId,
          }),
        ],
      },
    ],
  ])
}
