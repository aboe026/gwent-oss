import { Deck, DeckUnit, GameDeck, GameDeckDbObject } from '@gwent-oss/graphql-schema/database-typings'
import DeckResolver from '../../src/graphql/resolvers/types/deck-resolver'
import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import GameDeckResolver from '../../src/graphql/resolvers/types/game-deck-resolver'
import TestUtil from '../util/test-util'

describe('game-deck-resolver', () => {
  describe('fromObject', () => {
    describe('invalid', () => {
      it('throws error if cannot find discard unit', async () => {
        const deckUnit = TestUtil.getDeckUnit({})
        const gameDeck = TestUtil.getDbGameDeck({
          discard: [
            TestUtil.getDbDeckUnit({
              id: deckUnit.unit.id,
            }),
          ],
        })
        const message = `Could not resolve discarded DeckUnit "${deckUnit.unit.id}"`
        await testResolveFromObject({
          gameDeck,
          expected: Error(message),
          errorCalls: [[message]],
        })
      })
      it('throws error if cannot find hand unit', async () => {
        const deckUnit = TestUtil.getDeckUnit({})
        const gameDeck = TestUtil.getDbGameDeck({
          hand: [
            TestUtil.getDbDeckUnit({
              id: deckUnit.unit.id,
            }),
          ],
        })
        const message = `Could not resolve hand DeckUnit "${deckUnit.unit.id}"`
        await testResolveFromObject({
          gameDeck,
          expected: Error(message),
          errorCalls: [[message]],
        })
      })
      it('throws error if cannot find redrawn from unit', async () => {
        const deckUnit = TestUtil.getDeckUnit({})
        const gameDeck = TestUtil.getDbGameDeck({
          redraws: [
            {
              from: TestUtil.getDbDeckUnit({
                id: deckUnit.unit.id,
              }),
              to: TestUtil.getDbDeckUnit({}),
            },
          ],
        })
        const message = `Could not resolve from redraw DeckUnit "${deckUnit.unit.id}"`
        await testResolveFromObject({
          gameDeck,
          expected: Error(message),
          errorCalls: [[message]],
        })
      })
      it('throws error if cannot find redrawn to unit', async () => {
        const deckUnit1 = TestUtil.getDeckUnit({})
        const deckUnit2 = TestUtil.getDeckUnit({})
        const gameDeck = TestUtil.getDbGameDeck({
          redraws: [
            {
              from: TestUtil.getDbDeckUnit({
                id: deckUnit1.unit.id,
              }),
              to: TestUtil.getDbDeckUnit({
                id: deckUnit2.unit.id,
              }),
            },
          ],
        })
        const message = `Could not resolve to redraw DeckUnit "${deckUnit2.unit.id}"`
        await testResolveFromObject({
          gameDeck,
          deckUnitsResponse: [deckUnit1],
          expected: Error(message),
          errorCalls: [[message]],
        })
      })
      it('throws error if cannot find undrawn unit', async () => {
        const deckUnit = TestUtil.getDeckUnit({})
        const gameDeck = TestUtil.getDbGameDeck({
          undrawn: [
            TestUtil.getDbDeckUnit({
              id: deckUnit.unit.id,
            }),
          ],
        })
        const message = `Could not resolve undrawn DeckUnit "${deckUnit.unit.id}"`
        await testResolveFromObject({
          gameDeck,
          expected: Error(message),
          errorCalls: [[message]],
        })
      })
    })
    describe('valid', () => {
      it('returns deck if everything empty', async () => {
        const gameDeck = TestUtil.getDbGameDeck({})
        await testResolveFromObject({
          gameDeck,
          expected: {
            ...gameDeck,
            discard: [],
            hand: [],
            from: undefined,
            redraws: [],
            undrawn: [],
          },
        })
      })
      it('does not calls out to deck resolver if no from', async () => {
        const deckUnit1 = TestUtil.getDeckUnit({})
        const deckUnit2 = TestUtil.getDeckUnit({})
        const deckUnit3 = TestUtil.getDeckUnit({})
        const deckUnit4 = TestUtil.getDeckUnit({})
        const deckUnit5 = TestUtil.getDeckUnit({})
        const gameDeck = TestUtil.getDbGameDeck({
          discard: [
            TestUtil.getDbDeckUnit({
              id: deckUnit1.unit.id,
            }),
          ],
          hand: [
            TestUtil.getDbDeckUnit({
              id: deckUnit2.unit.id,
            }),
          ],
          redraws: [
            {
              from: TestUtil.getDbDeckUnit({
                id: deckUnit3.unit.id,
              }),
              to: TestUtil.getDbDeckUnit({
                id: deckUnit4.unit.id,
              }),
            },
          ],
          undrawn: [
            TestUtil.getDbDeckUnit({
              id: deckUnit5.unit.id,
            }),
          ],
        })
        await testResolveFromObject({
          gameDeck,
          deckUnitsResponse: [deckUnit1, deckUnit2, deckUnit3, deckUnit4, deckUnit5],
          expected: {
            ...gameDeck,
            discard: [deckUnit1],
            hand: [deckUnit2],
            from: undefined,
            redraws: [
              {
                from: deckUnit3,
                to: deckUnit4,
              },
            ],
            undrawn: [deckUnit5],
          },
        })
      })
      it('calls out to deck resolver if from', async () => {
        const deckUnit1 = TestUtil.getDeckUnit({})
        const deckUnit2 = TestUtil.getDeckUnit({})
        const deckUnit3 = TestUtil.getDeckUnit({})
        const deckUnit4 = TestUtil.getDeckUnit({})
        const deckUnit5 = TestUtil.getDeckUnit({})
        const deck = TestUtil.getDbDeck({})
        const resolvedDeck = TestUtil.getDeckFromDbDeck({
          deck,
        })
        const gameDeck = TestUtil.getDbGameDeck({
          discard: [
            TestUtil.getDbDeckUnit({
              id: deckUnit1.unit.id,
            }),
          ],
          from: deck,
          hand: [
            TestUtil.getDbDeckUnit({
              id: deckUnit2.unit.id,
            }),
          ],
          redraws: [
            {
              from: TestUtil.getDbDeckUnit({
                id: deckUnit3.unit.id,
              }),
              to: TestUtil.getDbDeckUnit({
                id: deckUnit4.unit.id,
              }),
            },
          ],
          undrawn: [
            TestUtil.getDbDeckUnit({
              id: deckUnit5.unit.id,
            }),
          ],
        })
        await testResolveFromObject({
          gameDeck,
          deckUnitsResponse: [deckUnit1, deckUnit2, deckUnit3, deckUnit4, deckUnit5],
          deckResponse: resolvedDeck,
          expected: {
            ...gameDeck,
            discard: [deckUnit1],
            from: resolvedDeck,
            hand: [deckUnit2],
            redraws: [
              {
                from: deckUnit3,
                to: deckUnit4,
              },
            ],
            undrawn: [deckUnit5],
          },
        })
      })
    })
  })
})

async function testResolveFromObject({
  gameDeck,
  deckUnitsResponse = [],
  deckResponse,
  expected,
  errorCalls = [],
}: {
  gameDeck: GameDeckDbObject
  deckUnitsResponse?: DeckUnit[]
  deckResponse?: Deck
  expected: GameDeck | Error
  errorCalls?: string[][]
}) {
  const deckUnitsSpy = jest.spyOn(DeckUnitResolver, 'fromArray').mockResolvedValue(deckUnitsResponse)
  const deckSpy = jest.spyOn(DeckResolver, 'fromObject')
  if (deckResponse) {
    deckSpy.mockResolvedValue(deckResponse)
  }
  const errorSpy = jest.fn().mockImplementation()
  GameDeckResolver['logger'] = {
    error: errorSpy,
  } as any

  const promise = GameDeckResolver.fromObject({
    gameDeck,
  })
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(deckUnitsSpy.mock.calls).toEqual([
    [
      {
        deckUnits: [
          ...gameDeck.discard,
          ...gameDeck.hand,
          ...gameDeck.redraws.map((redraw) => redraw.from),
          ...gameDeck.redraws.map((redraw) => redraw.to),
          ...gameDeck.undrawn,
        ],
      },
    ],
  ])
  expect(deckSpy.mock.calls).toEqual(
    gameDeck.from
      ? [
          [
            {
              deck: gameDeck.from,
            },
          ],
        ]
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
