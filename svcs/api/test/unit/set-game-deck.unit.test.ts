import { ObjectId } from 'mongodb'

import { DeckDbObject, DeckUnitDbObject, GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import deepClone from '../util/deep-clone'
import SetGameDeck from '../../src/graphql/resolvers/mutations/util/set-game-deck'
import { STARTING_HAND_SIZE } from '@gwent/constants'
import TestUtil from '../util/test-util'
import * as utils from '@gwent/utils'

describe('set-game-deck', () => {
  describe('setGameDeck', () => {
    const logPrefix = 'unit-test-log-prefix'
    it('throws error if player not found', () => {
      const self = TestUtil.getDbGamePlayer({})
      const deck = TestUtil.getDbDeck({})
      const game = TestUtil.getDbGame({
        players: [self, TestUtil.getDbGamePlayer({})],
        status: GameStatus.Decking,
      })
      const invalidUser = new ObjectId()
      const message = `Could not find player "${invalidUser}" on game "${game._id}" to set deck to "${deck._id}".`
      testSetGameDeck({
        game,
        deck,
        userId: invalidUser,
        logPrefix,
        expected: Error(message),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    describe('first player', () => {
      it('sets deck and random hand for first user', () => {
        const self = TestUtil.getDbGamePlayer({})
        const handUnit = TestUtil.getDbDeckUnit({})
        const undrawnUnit = TestUtil.getDbDeckUnit({})
        const deck = TestUtil.getDbDeck({
          units: [handUnit, undrawnUnit],
        })
        const game = TestUtil.getDbGame({
          players: [self, TestUtil.getDbGamePlayer({})],
          status: GameStatus.Decking,
        })
        const origDeck = deepClone(deck)
        const origGame = deepClone(game)
        const hand = [deepClone(handUnit)]

        testSetGameDeck({
          game,
          deck,
          userId: self.user,
          logPrefix,
          getRandomSubsetResponse: [deepClone(handUnit)],
          expected: {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  from: origDeck,
                  hand,
                  undrawn: [deepClone(undrawnUnit)],
                },
              },
              origGame.players[1],
            ],
          },
        })
      })
      it('sets deck and random hand for last user then sets game status to ORDERING', () => {
        const self = TestUtil.getDbGamePlayer({})
        const handUnit = TestUtil.getDbDeckUnit({})
        const undrawnUnit = TestUtil.getDbDeckUnit({})
        const deck = TestUtil.getDbDeck({
          units: [handUnit, undrawnUnit],
        })
        const game = TestUtil.getDbGame({
          players: [
            self,
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
            }),
          ],
          status: GameStatus.Decking,
        })
        const origDeck = deepClone(deck)
        const origGame = deepClone(game)
        const hand = [deepClone(handUnit)]

        testSetGameDeck({
          game,
          deck,
          userId: self.user,
          logPrefix,
          getRandomSubsetResponse: [deepClone(handUnit)],
          expected: {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  from: origDeck,
                  hand,
                  undrawn: [deepClone(undrawnUnit)],
                },
              },
              origGame.players[1],
            ],
            status: GameStatus.Ordering,
          },
          debugCalls: [[`${logPrefix} all decks set, changing game status to "${GameStatus.Ordering}"`]],
        })
      })
    })
    describe('second player', () => {
      it('sets deck and random hand for first user', () => {
        const self = TestUtil.getDbGamePlayer({})
        const handUnit = TestUtil.getDbDeckUnit({})
        const undrawnUnit = TestUtil.getDbDeckUnit({})
        const deck = TestUtil.getDbDeck({
          units: [handUnit, undrawnUnit],
        })
        const game = TestUtil.getDbGame({
          players: [TestUtil.getDbGamePlayer({}), self],
        })
        const origDeck = deepClone(deck)
        const origGame = deepClone(game)
        const hand = [deepClone(handUnit)]

        testSetGameDeck({
          game,
          deck,
          userId: self.user,
          logPrefix,
          getRandomSubsetResponse: [deepClone(handUnit)],
          expected: {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  from: origDeck,
                  hand,
                  undrawn: [deepClone(undrawnUnit)],
                },
              },
            ],
          },
        })
      })
      it('sets deck and random hand for last user then sets game status to ORDERING', () => {
        const self = TestUtil.getDbGamePlayer({})
        const handUnit = TestUtil.getDbDeckUnit({})
        const undrawnUnit = TestUtil.getDbDeckUnit({})
        const deck = TestUtil.getDbDeck({
          units: [handUnit, undrawnUnit],
        })
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
            }),
            self,
          ],
        })
        const origDeck = deepClone(deck)
        const origGame = deepClone(game)
        const hand = [deepClone(handUnit)]

        testSetGameDeck({
          game,
          deck,
          userId: self.user,
          logPrefix,
          getRandomSubsetResponse: hand,
          expected: {
            ...origGame,
            players: [
              origGame.players[0],
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  from: origDeck,
                  hand,
                  undrawn: [deepClone(undrawnUnit)],
                },
              },
            ],
            status: GameStatus.Ordering,
          },
          debugCalls: [[`${logPrefix} all decks set, changing game status to "${GameStatus.Ordering}"`]],
        })
      })
    })
  })
})

function testSetGameDeck({
  game,
  deck,
  userId,
  logPrefix,
  getRandomSubsetResponse,
  expected,
  errorCalls = [],
  debugCalls = [],
}: {
  game: GameDbObject
  deck: DeckDbObject
  userId: ObjectId
  logPrefix: string
  getRandomSubsetResponse?: DeckUnitDbObject[]
  expected?: Error | GameDbObject
  errorCalls?: string[][]
  debugCalls?: string[][]
}) {
  const getRandomSubsetSpy = jest.spyOn(utils, 'getRandomSubset')
  if (getRandomSubsetResponse) {
    getRandomSubsetSpy.mockReturnValue(getRandomSubsetResponse)
  }
  const errorSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  SetGameDeck['logger'] = {
    error: errorSpy,
    debug: debugSpy,
  } as any
  const origGame = deepClone(game)
  const origDeck = deepClone(deck)

  if (expected instanceof Error) {
    expect(() =>
      SetGameDeck.setGameDeck({
        game,
        deck,
        userId,
        logPrefix,
      })
    ).toThrow(expected)
  } else {
    expect(
      SetGameDeck.setGameDeck({
        game,
        deck,
        userId,
        logPrefix,
      })
    ).toEqual(undefined)
  }

  expect(game).toEqual(expected instanceof Error ? origGame : expected)
  expect(getRandomSubsetSpy.mock.calls).toEqual(
    expected instanceof Error
      ? []
      : [
          [
            {
              items: origDeck.units,
              size: STARTING_HAND_SIZE,
            },
          ],
        ]
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
}
