import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import {
  DeckDbObject,
  DeckUnitDbObject,
  FactionKey,
  GameDbObject,
  GamePlayerDbObject,
  GameStatus,
} from '@gwent/graphql-schema/database-typings'
import DeckStore from '../../src/database/stores/deck-store'
import EventManager from '../../src/graphql/event-manager'
import { Game, GameDeck, MutationSetDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import GameDeckResolver from '../../src/graphql/resolvers/types/game-deck-resolver'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import * as gwentUtils from '@gwent/utils'
import MutationUtil from '../../src/graphql/resolvers/mutations/mutation-util'
import PresentableError from '../../src/util/presentable-error'
import { PubSubEvents, STARTING_HAND_SIZE } from '@gwent/constants'
import ResolverUtil, { GamePlayerResponse } from '../../src/graphql/resolvers/resolver-util'
import SetDeckMutation from '../../src/graphql/resolvers/mutations/set-deck-mutation'
import TestUtil from '../test-util'

describe('set-deck-mutation', () => {
  describe('setDeck', () => {
    const userId = new ObjectId()
    const gamePlayer = TestUtil.getDbGamePlayer({
      user: userId,
    })
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
    const getDeckCalls = [
      [
        {
          id: deck._id.toString(),
        },
      ],
    ]
    const getGamePlayerCalls = [
      [
        {
          gameId: game._id.toString(),
          userId,
          status: GameStatus.Decking,
          label: 'set deck',
        },
      ],
    ]
    const setDeckCalls = [
      [
        {
          deck,
          gameId: game._id.toString(),
          hand: deck.units.slice(0, STARTING_HAND_SIZE),
          undrawn: deck.units.slice(STARTING_HAND_SIZE + 1, deck.units.length),
          userId,
        },
      ],
    ]
    it('throws error if deck does not exist', async () => {
      const error = `Deck with ID "${deck._id}" does not exist.`
      await testSetDeck({
        userId,
        gameId: game._id.toString(),
        deckId: deck._id.toString(),
        expected: Error(error),
        getDeckCalls,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if deck is already set', async () => {
      const error = `Deck already set for game "${game._id}".`
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGamePlayerResponse: {
          game,
          player: {
            ...gamePlayer,
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({}),
            }),
          },
        },
        expected: Error(error),
        getDeckCalls,
        getGamePlayerCalls,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if updated game is undefined', async () => {
      const error = `Could not set deck "${deck._id}" on game "${game._id}" in probable race condition collision.`
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGamePlayerResponse: {
          game,
          player: gamePlayer,
        },
        setDeckResponse: undefined,
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        expected: Error(error),
        getDeckCalls,
        getGamePlayerCalls,
        getRandomSubsetCalls: [
          [
            {
              items: deck.units,
              size: STARTING_HAND_SIZE,
            },
          ],
        ],
        setDeckCalls,
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if player not on updated game', async () => {
      const error = `Could not get player after setting deck "${deck._id}" on game "${game._id}".`
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGamePlayerResponse: {
          game,
          player: gamePlayer,
        },
        setDeckResponse: TestUtil.getDbGame({}),
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        expected: Error(error),
        getDeckCalls,
        getGamePlayerCalls,
        getRandomSubsetCalls: [
          [
            {
              items: deck.units,
              size: STARTING_HAND_SIZE,
            },
          ],
        ],
        setDeckCalls,
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if setGameTurnOder throws unexpected error', async () => {
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
      const error = Error('bad')
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGamePlayerResponse: {
          game,
          player: gamePlayer,
        },
        setDeckResponse: gameAllDecksChosen,
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        resolveGameResponse: resolvedGameAllDecksChosen,
        setGameTurnOderError: error,
        expected: error,
        getDeckCalls,
        getGamePlayerCalls,
        getRandomSubsetCalls: [
          [
            {
              items: deck.units,
              size: STARTING_HAND_SIZE,
            },
          ],
        ],
        setDeckCalls,
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
                deck: undefined,
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
    it('returns resolved deck if no errors', async () => {
      await testSetDeck({
        userId,
        deckId: deck._id.toString(),
        gameId: game._id.toString(),
        getDeckResponse: deck,
        getGamePlayerResponse: {
          game,
          player: gamePlayer,
        },
        setDeckResponse: game,
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        resolveGameResponse: resolvedGame,
        expected,
        getDeckCalls,
        getGamePlayerCalls,
        getRandomSubsetCalls: [
          [
            {
              items: deck.units,
              size: STARTING_HAND_SIZE,
            },
          ],
        ],
        setDeckCalls,
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
        getGamePlayerResponse: {
          game,
          player: gamePlayer,
        },
        setDeckResponse: gameAllDecksChosen,
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        resolveGameResponse: resolvedGameAllDecksChosen,
        expected,
        getDeckCalls,
        getGamePlayerCalls,
        getRandomSubsetCalls: [
          [
            {
              items: deck.units,
              size: STARTING_HAND_SIZE,
            },
          ],
        ],
        setDeckCalls,
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
    it('does not throw error if attempt to set turn order when another player has ScoiaTael', async () => {
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
        getGamePlayerResponse: {
          game,
          player: gamePlayer,
        },
        setDeckResponse: gameAllDecksChosen,
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        resolveGameResponse: resolvedGameAllDecksChosen,
        setGameTurnOderError: new PresentableError(
          `Cannot set order randomly as another player for game "${game._id}" has a deck faction of "${FactionKey.ScoiaTael}" which allows them to set game order.`
        ),
        expected,
        getDeckCalls,
        getGamePlayerCalls,
        getRandomSubsetCalls: [
          [
            {
              items: deck.units,
              size: STARTING_HAND_SIZE,
            },
          ],
        ],
        setDeckCalls,
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
        getGamePlayerResponse: {
          game,
          player: gamePlayer,
        },
        setDeckResponse: game,
        randomSubset: deck.units.slice(0, STARTING_HAND_SIZE),
        resolveGameResponse: resolvedGame,
        expected,
        getDeckCalls,
        getGamePlayerCalls,
        getRandomSubsetCalls: [
          [
            {
              items: deck.units,
              size: STARTING_HAND_SIZE,
            },
          ],
        ],
        setDeckCalls,
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
  getGamePlayerResponse,
  randomSubset = [],
  setDeckResponse,
  resolveGameResponse,
  setGameTurnOderError,
  expected,
  getDeckCalls = [],
  getGamePlayerCalls = [],
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
  getGamePlayerResponse?: GamePlayerResponse | Error
  randomSubset?: DeckUnitDbObject[]
  setDeckResponse?: GameDbObject
  resolveGameResponse?: Game
  setGameTurnOderError?: Error
  expected: Error | GameDeck
  getDeckCalls?: any[][]
  getGamePlayerCalls?: any[][]
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
  let player: GamePlayerDbObject | undefined = undefined
  if (!(getGamePlayerResponse instanceof Error)) {
    player = getGamePlayerResponse?.player
  }
  let handIds: string[] = []
  if (player) {
    handIds = randomSubset.map((deckUnit) => deckUnit.unit.toString())
  }
  const getDeckSpy = jest.spyOn(DeckStore, 'getById').mockResolvedValue(getDeckResponse)
  const getGamePlayerSpy = jest.spyOn(ResolverUtil.prototype, 'getGamePlayer')
  if (getGamePlayerResponse) {
    if (getGamePlayerResponse instanceof Error) {
      getGamePlayerSpy.mockRejectedValue(getGamePlayerResponse)
    } else {
      getGamePlayerSpy.mockResolvedValue(getGamePlayerResponse)
    }
  }
  const getRandomSubsetSpy = jest.spyOn(gwentUtils, 'getRandomSubset').mockReturnValue(randomSubset)
  const setDeckSpy = jest.spyOn(GameStore, 'save').mockResolvedValue(setDeckResponse)
  const fromObjectSpy = jest.spyOn(GameDeckResolver, 'fromObject')
  if (!(expected instanceof Error)) {
    fromObjectSpy.mockResolvedValue(expected)
  } else if (setGameTurnOderError) {
    fromObjectSpy.mockImplementation()
  }
  const resolveGameSpy = jest.spyOn(GameResolver, 'fromObject')
  if (resolveGameResponse) {
    resolveGameSpy.mockResolvedValue(resolveGameResponse)
  }
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const setOrderSpy = jest.spyOn(MutationUtil.prototype, 'setGameTurnOrder')
  if (setGameTurnOderError) {
    setOrderSpy.mockRejectedValue(setGameTurnOderError)
  } else {
    setOrderSpy.mockImplementation()
  }
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SetDeckMutation['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  const promise = SetDeckMutation.setDeck(args, context, null as any)
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(getDeckSpy.mock.calls).toEqual(getDeckCalls)
  expect(getGamePlayerSpy.mock.calls).toEqual(getGamePlayerCalls)
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
