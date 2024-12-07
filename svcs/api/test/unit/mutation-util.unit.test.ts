import { ObjectId } from 'mongodb'

import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import { FactionDbObject, GameDbObject } from '@gwent/graphql-schema/database-typings'
import FactionStore from '../../src/database/stores/faction-store'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import * as gwentUtils from '@gwent/utils'
import { PubSubEvents } from '@gwent/constants'
import TestUtil from '../test-util'
import EventManager from '../../src/graphql/event-manager'
import MutationUtil from '../../src/graphql/resolvers/mutations/mutation-util'

describe('mutation-util', () => {
  describe('setGameTurnOrder', () => {
    const gameId = new ObjectId().toString()
    const userId = new ObjectId().toString()
    const opponentId = new ObjectId().toString()
    const logPrefix = 'test-log-prefix'
    const dbGame = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: userId,
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
        }),
        TestUtil.getDbGamePlayer({
          user: opponentId,
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({}),
          }),
        }),
      ],
    })
    const dbFaction = TestUtil.getDbFaction({
      key: FactionKey.ScoiaTael,
    })
    it('returns error if game not found', async () => {
      const message = `Game with ID "${gameId}" does not exist.`
      await testSetGameTurnOrder({
        gameId,
        userId,
        logPrefix,
        error: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error if not a player on game', async () => {
      const message = `Not a player on game "${gameId}".`
      await testSetGameTurnOrder({
        gameId,
        userId,
        logPrefix,
        getGameResponse: TestUtil.getDbGame({}),
        error: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error if not all decks set', async () => {
      const message = `Not all players have chosen decks yet for game "${gameId}".`
      await testSetGameTurnOrder({
        gameId,
        userId,
        logPrefix,
        getGameResponse: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
            }),
            TestUtil.getDbGamePlayer({}),
          ],
        }),
        error: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error if turn order already set', async () => {
      const message = `Game with ID "${gameId}" already has order set.`
      await testSetGameTurnOrder({
        gameId,
        userId,
        logPrefix,
        getGameResponse: {
          ...dbGame,
          turn: new ObjectId(userId),
        },
        error: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error if no factions returned', async () => {
      const message = `Could not find faction with key "${FactionKey.ScoiaTael}".`
      await testSetGameTurnOrder({
        gameId,
        userId,
        logPrefix,
        getGameResponse: dbGame,
        factionsGetResponse: [],
        error: Error(message),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error if more than 1 faction returned', async () => {
      await testSetGameTurnOrder({
        gameId,
        userId,
        logPrefix,
        getGameResponse: dbGame,
        factionsGetResponse: [dbFaction, dbFaction],
        error: Error(`Found more than 1 faction with key "${FactionKey.ScoiaTael}".`),
        errorCalls: [
          [
            `${logPrefix} failed: Found more than 1 faction with key "${FactionKey.ScoiaTael}": "${JSON.stringify([
              dbFaction,
              dbFaction,
            ])}"`,
          ],
        ],
      })
    })
    it('returns error if faction with wrong key returned', async () => {
      const message = `Faction key of "${FactionKey.Neutral}" does not match "${FactionKey.ScoiaTael}".`
      await testSetGameTurnOrder({
        gameId,
        userId,
        logPrefix,
        getGameResponse: dbGame,
        factionsGetResponse: [
          TestUtil.getDbFaction({
            key: FactionKey.Neutral,
          }),
        ],
        error: Error(message),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error if more than 1 scoiatael deck', async () => {
      const message = `Cannot set explicit order as more than 1 player has chosen a deck of faction "${FactionKey.ScoiaTael}" for game "${gameId}".`
      await testSetGameTurnOrder({
        gameId,
        userId,
        logPrefix,
        userIds: [userId, new ObjectId().toString()],
        getGameResponse: {
          ...dbGame,
          players: dbGame.players.map((player) => {
            return {
              ...player,
              deck: {
                ...player.deck,
                from: TestUtil.getDbDeck({
                  faction: dbFaction._id,
                }),
              },
            }
          }),
        },
        factionsGetResponse: [dbFaction],
        error: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error setting explicit order without scoiatael deck', async () => {
      const factionId = new ObjectId()
      const message = `Cannot set explicit order as deck faction ID "${factionId}" does not match "${FactionKey.ScoiaTael}" faction ID of "${dbFaction._id}".`
      await testSetGameTurnOrder({
        gameId,
        userId,
        logPrefix,
        userIds: [userId, new ObjectId().toString()],
        getGameResponse: {
          ...dbGame,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({
                  faction: factionId,
                }),
              }),
              user: new ObjectId(userId),
            }),
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
            }),
          ],
        },
        factionsGetResponse: [dbFaction],
        error: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error setting implicit order when no userIds and opponent has scoiatael deck', async () => {
      const message = `Cannot set order randomly as another player for game "${gameId}" has a deck faction of "${FactionKey.ScoiaTael}" which allows them to set game order.`
      await testSetGameTurnOrder({
        gameId,
        userId,
        logPrefix,
        getGameResponse: {
          ...dbGame,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
              user: new ObjectId(userId),
            }),
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({
                  faction: dbFaction._id,
                }),
              }),
            }),
          ],
        },
        factionsGetResponse: [dbFaction],
        error: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error setting implicit order when empty userIds and opponent has scoiatael deck', async () => {
      const message = `Cannot set order randomly as another player for game "${gameId}" has a deck faction of "${FactionKey.ScoiaTael}" which allows them to set game order.`
      await testSetGameTurnOrder({
        gameId,
        userId,
        logPrefix,
        userIds: [],
        getGameResponse: {
          ...dbGame,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
              user: new ObjectId(userId),
            }),
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({
                  faction: dbFaction._id,
                }),
              }),
            }),
          ],
        },
        factionsGetResponse: [dbFaction],
        error: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error setting explicit order when opponent has scoiatael deck', async () => {
      const message = `Cannot set order as another player for game "${gameId}" has a deck faction of "${FactionKey.ScoiaTael}" which allows them to set game order.`
      await testSetGameTurnOrder({
        gameId,
        userId,
        userIds: [userId, new ObjectId().toString()],
        logPrefix,
        getGameResponse: {
          ...dbGame,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
              user: new ObjectId(userId),
            }),
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({
                  faction: dbFaction._id,
                }),
              }),
            }),
          ],
        },
        factionsGetResponse: [dbFaction],
        error: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error if users are not players on game', async () => {
      const nonPlayerId = new ObjectId().toString()
      const message = `Cannot set order as users(s) ${JSON.stringify([
        nonPlayerId,
      ])} are not players on game "${gameId}".`
      await testSetGameTurnOrder({
        gameId,
        userId,
        userIds: [userId, nonPlayerId],
        logPrefix,
        getGameResponse: {
          ...dbGame,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({
                  faction: dbFaction._id,
                }),
              }),
              user: new ObjectId(userId),
            }),
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
            }),
          ],
        },
        factionsGetResponse: [dbFaction],
        error: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error if too few users', async () => {
      const message = `Cannot set order as users count of "1" does not match player count of "2" for game "${gameId}".`
      await testSetGameTurnOrder({
        gameId,
        userId,
        userIds: [userId],
        logPrefix,
        getGameResponse: {
          ...dbGame,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({
                  faction: dbFaction._id,
                }),
              }),
              user: new ObjectId(userId),
            }),
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
            }),
          ],
        },
        factionsGetResponse: [dbFaction],
        error: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error if duplicate users', async () => {
      const message = `Cannot set order for game "${gameId}" due to duplicate user ID(s) ["${userId}"] specified.`
      await testSetGameTurnOrder({
        gameId,
        userId,
        userIds: [userId, userId],
        logPrefix,
        getGameResponse: {
          ...dbGame,
          players: [
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({
                  faction: dbFaction._id,
                }),
              }),
              user: new ObjectId(userId),
            }),
            TestUtil.getDbGamePlayer({
              deck: TestUtil.getDbGameDeck({
                from: TestUtil.getDbDeck({}),
              }),
            }),
          ],
        },
        factionsGetResponse: [dbFaction],
        error: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error if updated game empty', async () => {
      const message = `Could not set order on game "${gameId}" in probable race condition collision.`
      await testSetGameTurnOrder({
        gameId,
        userId,
        logPrefix,
        getGameResponse: dbGame,
        factionsGetResponse: [dbFaction],
        setOrderResponse: null,
        randomizeOrderCalls: [[[new ObjectId(userId), new ObjectId(opponentId)]]],
        error: Error(message),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns resolved updated game if no errors and implicitly setting users', async () => {
      const updatedGame: GameDbObject = {
        ...dbGame,
        players: dbGame.players.map((player, index) => {
          return {
            ...player,
            order: index,
          }
        }),
        turn: new ObjectId(userId),
      }
      await testSetGameTurnOrder({
        gameId,
        userId,
        logPrefix,
        getGameResponse: dbGame,
        factionsGetResponse: [dbFaction],
        setOrderResponse: updatedGame,
        randomizeOrderCalls: [[[new ObjectId(userId), new ObjectId(opponentId)]]],
      })
    })
    it('returns resolved updated game if no errors and explicitly setting self first', async () => {
      const dbGameScoiatael: GameDbObject = {
        ...dbGame,
        players: [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({
                faction: dbFaction._id,
              }),
            }),
            user: userId,
          }),
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({}),
            }),
            user: opponentId,
          }),
        ],
      }
      const updatedGame: GameDbObject = {
        ...dbGameScoiatael,
        players: dbGame.players.map((player, index) => {
          return {
            ...player,
            order: index,
          }
        }),
        turn: new ObjectId(userId),
      }
      await testSetGameTurnOrder({
        gameId,
        userId,
        logPrefix,
        userIds: [userId, opponentId],
        getGameResponse: dbGameScoiatael,
        factionsGetResponse: [dbFaction],
        setOrderResponse: updatedGame,
      })
    })
    it('returns resolved updated game if no errors and explicitly setting opponent first', async () => {
      const dbGameScoiatael: GameDbObject = {
        ...dbGame,
        players: [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({
                faction: dbFaction._id,
              }),
            }),
            user: userId,
          }),
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({}),
            }),
            user: opponentId,
          }),
        ],
      }
      const updatedGame: GameDbObject = {
        ...dbGameScoiatael,
        players: dbGame.players.map((player, index) => {
          return {
            ...player,
            order: dbGameScoiatael.players.length - index - 1,
          }
        }),
        turn: new ObjectId(userId),
      }
      await testSetGameTurnOrder({
        gameId,
        userId,
        logPrefix,
        userIds: [opponentId, userId],
        getGameResponse: dbGameScoiatael,
        factionsGetResponse: [dbFaction],
        setOrderResponse: updatedGame,
      })
    })
    it('logs to trace if enabled', async () => {
      const updatedGame: GameDbObject = {
        ...dbGame,
        players: dbGame.players.map((player, index) => {
          return {
            ...player,
            order: index,
          }
        }),
        turn: new ObjectId(userId),
      }
      await testSetGameTurnOrder({
        gameId,
        userId,
        logPrefix,
        getGameResponse: dbGame,
        factionsGetResponse: [dbFaction],
        setOrderResponse: updatedGame,
        randomizeOrderCalls: [[[new ObjectId(userId), new ObjectId(opponentId)]]],
        traceEnabled: true,
      })
    })
  })
})

async function testSetGameTurnOrder({
  userId,
  gameId,
  logPrefix,
  allowImplicit = false,
  userIds,
  getGameResponse,
  factionsGetResponse,
  setOrderResponse,
  error,
  randomizeOrderCalls = [],
  errorCalls = [],
  warnCalls = [],
  traceEnabled,
}: {
  userId: string
  gameId: string
  logPrefix: string
  allowImplicit?: boolean
  userIds?: string[]
  getGameResponse?: GameDbObject
  factionsGetResponse?: FactionDbObject[]
  setOrderResponse?: GameDbObject | null
  error?: Error
  randomizeOrderCalls?: any[][]
  errorCalls?: any[][]
  warnCalls?: any[][]
  traceEnabled?: boolean
}) {
  const getGameSpy = jest.spyOn(GameStore, 'getById').mockResolvedValue(getGameResponse)
  const getFactionsSpy = jest.spyOn(FactionStore, 'get')
  if (factionsGetResponse) {
    getFactionsSpy.mockResolvedValue(factionsGetResponse)
  }
  const randomizeOrderSpy = jest.spyOn(gwentUtils, 'randomizeOrder')
  const randomPlayers: ObjectId[] = []
  if (getGameResponse) {
    for (const player of getGameResponse.players) {
      randomPlayers.push(player.user)
    }
    randomizeOrderSpy.mockReturnValue(randomPlayers)
  }
  const setOrderSpy = jest.spyOn(GameStore, 'setOrder')
  if (setOrderResponse !== undefined) {
    setOrderSpy.mockResolvedValue(setOrderResponse || undefined)
  }
  const resolveGameSpy = jest.spyOn(GameResolver, 'fromObject')
  let resolvedGame
  if (setOrderResponse) {
    resolvedGame = TestUtil.getGameFromDbGame({
      game: setOrderResponse,
    })
    resolveGameSpy.mockResolvedValue(resolvedGame)
  }
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  MutationUtil['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(
    MutationUtil.setGameTurnOrder({
      userId,
      gameId,
      userIds,
      logPrefix,
      allowImplicit,
    })
  ).resolves.toEqual(error || resolvedGame)

  expect(getGameSpy.mock.calls).toEqual([
    [
      {
        id: gameId,
      },
    ],
  ])
  expect(getFactionsSpy.mock.calls).toEqual(
    factionsGetResponse
      ? [
          [
            {
              keys: [FactionKey.ScoiaTael],
            },
          ],
        ]
      : []
  )
  expect(randomizeOrderSpy.mock.calls).toEqual(randomizeOrderCalls)
  expect(setOrderSpy.mock.calls).toEqual(
    setOrderResponse !== undefined
      ? [
          [
            {
              gameId,
              userIds: userIds || randomPlayers,
            },
          ],
        ]
      : []
  )
  expect(publishSpy.mock.calls).toEqual(
    error
      ? []
      : [
          [
            PubSubEvents.OrderSet,
            {
              orderSet: resolvedGame,
            },
          ],
        ]
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} game: "${JSON.stringify(getGameResponse)}"`],
          [
            `${logPrefix} player: "${JSON.stringify(
              getGameResponse?.players.find((player) => player.user.toString() === userId)
            )}"`,
          ],
          [`${logPrefix} updatedGame: "${JSON.stringify(setOrderResponse)}"`],
        ]
      : []
  )
}
