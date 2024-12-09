import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import {
  DeckDbObject,
  DeckUnitDbObject,
  GameDbObject,
  GamePlayerDbObject,
} from '@gwent/graphql-schema/database-typings'
import DeckStore from '../../src/database/stores/deck-store'
import EventManager from '../../src/graphql/event-manager'
import { Game, GameDeck, MutationSetDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import GameDeckResolver from '../../src/graphql/resolvers/types/game-deck-resolver'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import * as gwentUtils from '@gwent/utils'
import MutationUtil from '../../src/graphql/resolvers/mutations/mutation-util'
import { NOT_AUTHENTICATED_MESSAGE, PubSubEvents, STARTING_HAND_SIZE } from '@gwent/constants'
import SetDeckMutation from '../../src/graphql/resolvers/mutations/set-deck-mutation'
import TestUtil from '../test-util'

describe('set-deck-mutation', () => {
  describe('setDeck', () => {
    const userId = new ObjectId()
    const game = TestUtil.getDbGame({
      creator: userId,
    })
    const deck = TestUtil.getDbDeck({})
    const expected = {
      discard: [],
      hand: [],
      name: deck.name,
      redraws: [],
      undrawn: [],
      from: TestUtil.getDeckFromDbDeck({
        deck,
      }),
    }
    const resolvedGame = TestUtil.getGameFromDbGame({
      game: game,
    })
    const logPrefix = `setDeck by "${userId}"`
    it('returns error if no user on context', async () => {
      await testSetDeck({
        gameId: game._id.toString(),
        deckId: deck._id.toString(),
        expected: Error(NOT_AUTHENTICATED_MESSAGE),
        errorCalls: [[`No user on context for setDeck mutation: "${JSON.stringify({})}".`]],
      })
    })
    it('returns error if invalid game ID', async () => {
      const gameId = 'invalid'
      const error = `Game ID "${gameId}" is not a valid MongoDB ObjectId.`
      await testSetDeck({
        userId,
        gameId,
        deckId: deck._id.toString(),
        expected: Error(error),
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if invalid deck ID', async () => {
      const deckId = 'invalid'
      const error = `Deck ID "${deckId}" is not a valid MongoDB ObjectId.`
      await testSetDeck({
        userId,
        gameId: game._id.toString(),
        deckId,
        expected: Error(error),
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if deck does not exist', async () => {
      const error = `Deck with ID "${deck._id}" does not exist.`
      await testSetDeck({
        userId,
        gameId: game._id.toString(),
        deckId: deck._id.toString(),
        expected: Error(error),
        getDeckCalls: [
          [
            {
              id: deck._id.toString(),
            },
          ],
        ],
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if game does not exist', async () => {
      const error = `Game with ID "${game._id}" does not exist.`
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        expected: Error(error),
        getDeckCalls: [
          [
            {
              id: deck._id.toString(),
            },
          ],
        ],
        getGameCalls: [
          [
            {
              id: game._id.toString(),
            },
          ],
        ],
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if not a player on game', async () => {
      const error = `Not a player on game "${game._id}".`
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGameResponse: {
          ...game,
          players: [],
        },
        expected: Error(error),
        getDeckCalls: [
          [
            {
              id: deck._id.toString(),
            },
          ],
        ],
        getGameCalls: [
          [
            {
              id: game._id.toString(),
            },
          ],
        ],
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if deck is already set', async () => {
      const error = `Deck already set for game "${game._id}".`
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGameResponse: {
          ...game,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
              user: userId,
            }),
          ],
        },
        expected: Error(error),
        getDeckCalls: [
          [
            {
              id: deck._id.toString(),
            },
          ],
        ],
        getGameCalls: [
          [
            {
              id: game._id.toString(),
            },
          ],
        ],
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if updated game is undefined', async () => {
      const error = `Could not set deck "${deck._id}" on game "${game._id}" in probable race condition collision.`
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGameResponse: game,
        setDeckResponse: undefined,
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        expected: Error(error),
        getDeckCalls: [
          [
            {
              id: deck._id.toString(),
            },
          ],
        ],
        getGameCalls: [
          [
            {
              id: game._id.toString(),
            },
          ],
        ],
        getRandomSubsetCalls: [
          [
            {
              items: deck.units,
              size: STARTING_HAND_SIZE,
            },
          ],
        ],
        setDeckCalls: [
          [
            {
              deck,
              gameId: game._id.toString(),
              hand: deck.units.slice(0, STARTING_HAND_SIZE),
              undrawn: deck.units.slice(STARTING_HAND_SIZE + 1, deck.units.length),
              userId,
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if player not on updated game', async () => {
      const error = `Could not get player after setting deck "${deck._id}" on game "${game._id}".`
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGameResponse: game,
        setDeckResponse: TestUtil.getDbGame({}),
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        expected: Error(error),
        getDeckCalls: [
          [
            {
              id: deck._id.toString(),
            },
          ],
        ],
        getGameCalls: [
          [
            {
              id: game._id.toString(),
            },
          ],
        ],
        getRandomSubsetCalls: [
          [
            {
              items: deck.units,
              size: STARTING_HAND_SIZE,
            },
          ],
        ],
        setDeckCalls: [
          [
            {
              deck,
              gameId: game._id.toString(),
              hand: deck.units.slice(0, STARTING_HAND_SIZE),
              undrawn: deck.units.slice(STARTING_HAND_SIZE + 1, deck.units.length),
              userId,
            },
          ],
        ],
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns resolved deck if no errors', async () => {
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGameResponse: game,
        setDeckResponse: game,
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        resolveGameResponse: resolvedGame,
        expected,
        getDeckCalls: [
          [
            {
              id: deck._id.toString(),
            },
          ],
        ],
        getGameCalls: [
          [
            {
              id: game._id.toString(),
            },
          ],
        ],
        getRandomSubsetCalls: [
          [
            {
              items: deck.units,
              size: STARTING_HAND_SIZE,
            },
          ],
        ],
        setDeckCalls: [
          [
            {
              deck,
              gameId: game._id.toString(),
              hand: deck.units.slice(0, STARTING_HAND_SIZE),
              undrawn: deck.units.slice(STARTING_HAND_SIZE + 1, deck.units.length),
              userId,
            },
          ],
        ],
        resolveGameDeckCalls: [
          [
            {
              gameDeck: (
                game.players.find((player) => player.user.toString() === userId?.toString()) as GamePlayerDbObject
              ).deck,
            },
          ],
        ],
        publishCalls: [
          [
            PubSubEvents.DeckSet,
            {
              deckSet: {
                deck: expected,
                game: resolvedGame,
              },
            },
          ],
        ],
      })
    })
    it('sets order if all players have chosen decks', async () => {
      const gameAllDecksChosen: GameDbObject = {
        ...game,
        players: game.players.map((player) => {
          return {
            ...player,
            deck: {
              ...player.deck,
              from: TestUtil.getDbDeck({}),
            },
          }
        }),
      }
      const resolvedGameAllDecksChosen = TestUtil.getGameFromDbGame({
        game: gameAllDecksChosen,
      })
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGameResponse: game,
        setDeckResponse: gameAllDecksChosen,
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        resolveGameResponse: resolvedGameAllDecksChosen,
        expected,
        getDeckCalls: [
          [
            {
              id: deck._id.toString(),
            },
          ],
        ],
        getGameCalls: [
          [
            {
              id: game._id.toString(),
            },
          ],
        ],
        getRandomSubsetCalls: [
          [
            {
              items: deck.units,
              size: STARTING_HAND_SIZE,
            },
          ],
        ],
        setDeckCalls: [
          [
            {
              deck,
              gameId: game._id.toString(),
              hand: deck.units.slice(0, STARTING_HAND_SIZE),
              undrawn: deck.units.slice(STARTING_HAND_SIZE + 1, deck.units.length),
              userId,
            },
          ],
        ],
        resolveGameDeckCalls: [
          [
            {
              gameDeck: (
                gameAllDecksChosen.players.find(
                  (player) => player.user.toString() === userId?.toString()
                ) as GamePlayerDbObject
              ).deck,
            },
          ],
        ],
        publishCalls: [
          [
            PubSubEvents.DeckSet,
            {
              deckSet: {
                deck: expected,
                game: resolvedGameAllDecksChosen,
              },
            },
          ],
          [
            PubSubEvents.GameSet,
            {
              gameSet: resolvedGameAllDecksChosen,
            },
          ],
        ],
        setOrderCalls: [
          [
            {
              userId,
              gameId: game._id.toString(),
              logPrefix: `setOrder via setDeck by "${userId}"`,
              allowImplicit: false,
            },
          ],
        ],
      })
    })
    it('logs to trace if enabled', async () => {
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGameResponse: game,
        setDeckResponse: game,
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        resolveGameResponse: resolvedGame,
        expected,
        getDeckCalls: [
          [
            {
              id: deck._id.toString(),
            },
          ],
        ],
        getGameCalls: [
          [
            {
              id: game._id.toString(),
            },
          ],
        ],
        getRandomSubsetCalls: [
          [
            {
              items: deck.units,
              size: STARTING_HAND_SIZE,
            },
          ],
        ],
        setDeckCalls: [
          [
            {
              deck,
              gameId: game._id.toString(),
              hand: deck.units.slice(0, STARTING_HAND_SIZE),
              undrawn: deck.units.slice(STARTING_HAND_SIZE + 1, deck.units.length),
              userId,
            },
          ],
        ],
        resolveGameDeckCalls: [
          [
            {
              gameDeck: (
                game.players.find((player) => player.user.toString() === userId?.toString()) as GamePlayerDbObject
              ).deck,
            },
          ],
        ],
        publishCalls: [
          [
            PubSubEvents.DeckSet,
            {
              deckSet: {
                deck: expected,
                game: resolvedGame,
              },
            },
          ],
        ],
        logPrefix,
        traceEnabled: true,
      })
    })
  })
})

async function testSetDeck({
  userId,
  gameId,
  deckId,
  getDeckResponse,
  getGameResponse,
  randomSubset = [],
  setDeckResponse,
  resolveGameResponse,
  expected,
  getDeckCalls = [],
  getGameCalls = [],
  getRandomSubsetCalls = [],
  setDeckCalls = [],
  resolveGameDeckCalls = [],
  publishCalls = [],
  setOrderCalls = [],
  logPrefix,
  errorCalls = [],
  warnCalls = [],
  traceEnabled,
}: {
  userId?: ObjectId
  gameId: string
  deckId: string
  getDeckResponse?: DeckDbObject
  getGameResponse?: GameDbObject
  randomSubset?: DeckUnitDbObject[]
  setDeckResponse?: GameDbObject
  resolveGameResponse?: Game
  expected: Error | GameDeck
  getDeckCalls?: any[][]
  getGameCalls?: any[][]
  getRandomSubsetCalls?: any[][]
  setDeckCalls?: any[][]
  resolveGameDeckCalls?: any[][]
  publishCalls?: any[][]
  setOrderCalls?: any[][]
  logPrefix?: string
  errorCalls?: any[][]
  warnCalls?: any[][]
  traceEnabled?: boolean
}) {
  const context: Context = {
    session: {},
  }
  if (userId && context.session) {
    context.session.user = TestUtil.getDbUser({
      id: userId,
    })
  }
  const args: MutationSetDeckArgs = {
    game: gameId,
    deck: deckId,
  }
  const player = getGameResponse?.players.find(
    (player) => player.user.toString() === userId?.toString()
  ) as GamePlayerDbObject
  let handIds: string[] = []
  if (player) {
    handIds = randomSubset.map((deckUnit) => deckUnit.unit.toString())
  }
  const getDeckSpy = jest.spyOn(DeckStore, 'getById').mockResolvedValue(getDeckResponse)
  const getGameSpy = jest.spyOn(GameStore, 'getById').mockResolvedValue(getGameResponse)
  const getRandomSubsetSpy = jest.spyOn(gwentUtils, 'getRandomSubset').mockReturnValue(randomSubset)
  const setDeckSpy = jest.spyOn(GameStore, 'setDeck').mockResolvedValue(setDeckResponse)
  const fromObjectSpy = jest.spyOn(GameDeckResolver, 'fromObject')
  if (!(expected instanceof Error)) {
    fromObjectSpy.mockResolvedValue(expected)
  }
  const resolveGameSpy = jest.spyOn(GameResolver, 'fromObject')
  if (resolveGameResponse) {
    resolveGameSpy.mockResolvedValue(resolveGameResponse)
  }
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const setOrderSpy = jest.spyOn(MutationUtil, 'setGameTurnOrder').mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SetDeckMutation['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(SetDeckMutation.setDeck(args, context, null as any)).resolves.toEqual(expected)

  expect(getDeckSpy.mock.calls).toEqual(getDeckCalls)
  expect(getGameSpy.mock.calls).toEqual(getGameCalls)
  expect(getRandomSubsetSpy.mock.calls).toEqual(getRandomSubsetCalls)
  expect(setDeckSpy.mock.calls).toEqual(setDeckCalls)
  expect(fromObjectSpy.mock.calls).toEqual(resolveGameDeckCalls)
  expect(resolveGameSpy.mock.calls).toEqual(
    resolveGameResponse
      ? [
          [
            {
              game: setDeckResponse,
            },
          ],
        ]
      : []
  )
  expect(publishSpy.mock.calls).toEqual(publishCalls)
  expect(setOrderSpy.mock.calls).toEqual(setOrderCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `${logPrefix} args: "${JSON.stringify({
              game: gameId,
              deck: deckId,
            })}"`,
          ],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} deck: "${JSON.stringify(getDeckResponse)}"`],
          [`${logPrefix} game: "${JSON.stringify(getGameResponse)}"`],
          [
            `${logPrefix} player: "${JSON.stringify(
              (getGameResponse as GameDbObject).players.find((player) => player.user.toString() === userId?.toString())
            )}"`,
          ],
          [`${logPrefix} hand: "${JSON.stringify(randomSubset)}"`],
          [
            `${logPrefix} undrawn: "${JSON.stringify(
              (getDeckResponse as DeckDbObject).units.filter((deckUnit) => !handIds.includes(deckUnit.unit.toString()))
            )}"`,
          ],
          [`${logPrefix} updatedGame: "${JSON.stringify(setDeckResponse)}"`],
          [
            `${logPrefix} updatedPlayer: "${JSON.stringify(
              setDeckResponse?.players.find((player) => player.user.toString() === userId?.toString())
            )}"`,
          ],
          [`${logPrefix} resolvedGame: "${JSON.stringify(resolveGameResponse)}"`],
        ]
      : []
  )
}
