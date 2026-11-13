import { ObjectId } from 'mongodb'

import EventManager from '../../src/graphql/event-manager'
import {
  FactionDbObject,
  GameDbObject,
  GamePlayerDbObject,
  GameStatus,
} from '@gwent-oss/graphql-schema/database-typings'
import { FactionKey } from '@gwent-oss/graphql-schema/resolver-typings'
import FactionScoiaTaelAbility from '../../src/graphql/resolvers/mutations/set-order/faction-scoiatael-ability'
import FactionStore from '../../src/database/stores/faction-store'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import * as gwentUtils from '@gwent-oss/utils'
import * as initializeNewRound from '../../src/graphql/resolvers/mutations/util/initialize-new-round'
import { PubSubEvents } from '@gwent-oss/constants'
import SetGameTurnOrder from '../../src/graphql/resolvers/mutations/util/set-game-turn-order'
import TestUtil from '../util/test-util'

describe('set-game-turn-order', () => {
  const userId = new ObjectId().toString()
  const opponentId = new ObjectId().toString()
  const logPrefix = 'test-log-prefix'
  const dbFaction = TestUtil.getDbFaction({
    key: FactionKey.ScoiaTael,
  })
  let game: GameDbObject
  beforeEach(() => {
    game = TestUtil.getDbGame({
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
  })
  it('throws error setting explicit order with more than 1 ScoiaTael player', async () => {
    const message = `Explicit order not allowed when more than 1 player has deck of faction "${FactionKey.ScoiaTael}".`
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({
        from: TestUtil.getDbDeck({
          faction: dbFaction._id,
        }),
      }),
      user: new ObjectId(userId),
    })
    await testSetGameTurnOrder({
      game: {
        ...game,
        players: [
          player,
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({
                faction: dbFaction._id,
              }),
            }),
          }),
        ],
      },
      player,
      logPrefix,
      userIds: [userId, new ObjectId().toString()],
      factionByKeyResponse: dbFaction,
      error: Error(message),
      warnCalls: [[`${logPrefix} setGameTurnOrder failed: ${message}`]],
    })
  })
  it('throws error setting explicit order without scoiatael deck', async () => {
    const factionId = new ObjectId()
    const message = `Explicit order not allowed when deck faction not "${FactionKey.ScoiaTael}".`
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({
        from: TestUtil.getDbDeck({
          faction: factionId,
        }),
      }),
      user: new ObjectId(userId),
    })
    await testSetGameTurnOrder({
      game: {
        ...game,
        players: [
          player,
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({}),
            }),
          }),
        ],
      },
      player,
      logPrefix,
      userIds: [userId, new ObjectId().toString()],
      factionByKeyResponse: dbFaction,
      error: Error(message),
      warnCalls: [[`${logPrefix} setGameTurnOrder failed: ${message}`]],
    })
  })
  it('throws error setting implicit order when no userIds and opponent has scoiatael deck', async () => {
    const message = `Random order not allowed when another player has deck faction of "${FactionKey.ScoiaTael}".`
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({
        from: TestUtil.getDbDeck({}),
      }),
      user: new ObjectId(userId),
    })
    await testSetGameTurnOrder({
      game: {
        ...game,
        players: [
          player,
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({
                faction: dbFaction._id,
              }),
            }),
          }),
        ],
      },
      player,
      logPrefix,
      factionByKeyResponse: dbFaction,
      error: Error(message),
      debugCalls: [[`${logPrefix} setGameTurnOrder failed: ${message}`]],
    })
  })
  it('throws error setting implicit order when empty userIds and opponent has scoiatael deck', async () => {
    const message = `Random order not allowed when another player has deck faction of "${FactionKey.ScoiaTael}".`
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({
        from: TestUtil.getDbDeck({}),
      }),
      user: new ObjectId(userId),
    })
    await testSetGameTurnOrder({
      game: {
        ...game,
        players: [
          player,
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({
                faction: dbFaction._id,
              }),
            }),
          }),
        ],
      },
      player,
      logPrefix,
      userIds: [],
      factionByKeyResponse: dbFaction,
      error: Error(message),
      debugCalls: [[`${logPrefix} setGameTurnOrder failed: ${message}`]],
    })
  })
  it('throws error setting explicit order when opponent has scoiatael deck', async () => {
    const message = `Setting order not allowed when another player has deck faction of "${FactionKey.ScoiaTael}".`
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({
        from: TestUtil.getDbDeck({}),
      }),
      user: new ObjectId(userId),
    })
    await testSetGameTurnOrder({
      game: {
        ...game,
        players: [
          player,
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({
                faction: dbFaction._id,
              }),
            }),
          }),
        ],
      },
      player,
      userIds: [userId, new ObjectId().toString()],
      logPrefix,
      factionByKeyResponse: dbFaction,
      error: Error(message),
      warnCalls: [[`${logPrefix} setGameTurnOrder failed: ${message}`]],
    })
  })
  it('throws error if users are not players on game', async () => {
    const nonPlayerId = new ObjectId().toString()
    const message = `User(s) ${JSON.stringify([nonPlayerId])} are not players on game.`
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({
        from: TestUtil.getDbDeck({
          faction: dbFaction._id,
        }),
      }),
      user: new ObjectId(userId),
    })
    await testSetGameTurnOrder({
      game: {
        ...game,
        players: [
          player,
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({}),
            }),
          }),
        ],
      },
      player,
      userIds: [userId, nonPlayerId],
      logPrefix,
      factionByKeyResponse: dbFaction,
      error: Error(message),
      warnCalls: [[`${logPrefix} setGameTurnOrder failed: ${message}`]],
    })
  })
  it('throws error if too few users', async () => {
    const message = `Users count of "1" does not match required count of "2".`
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({
        from: TestUtil.getDbDeck({
          faction: dbFaction._id,
        }),
      }),
      user: new ObjectId(userId),
    })
    await testSetGameTurnOrder({
      game: {
        ...game,
        players: [
          player,
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({}),
            }),
          }),
        ],
      },
      player,
      userIds: [userId],
      logPrefix,
      factionByKeyResponse: dbFaction,
      error: Error(message),
      warnCalls: [[`${logPrefix} setGameTurnOrder failed: ${message}`]],
    })
  })
  it('throws error if duplicate users', async () => {
    const message = `Duplicate user(s) ["${userId}"] not allowed.`
    const player = TestUtil.getDbGamePlayer({
      deck: TestUtil.getDbGameDeck({
        from: TestUtil.getDbDeck({
          faction: dbFaction._id,
        }),
      }),
      user: new ObjectId(userId),
    })
    await testSetGameTurnOrder({
      game: {
        ...game,
        players: [
          player,
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({}),
            }),
          }),
        ],
      },
      player,
      userIds: [userId, userId],
      logPrefix,
      factionByKeyResponse: dbFaction,
      error: Error(message),
      warnCalls: [[`${logPrefix} setGameTurnOrder failed: ${message}`]],
    })
  })
  it('throws error if updated game empty', async () => {
    const message = 'Could not set order in probable race condition collision.'
    await testSetGameTurnOrder({
      game: game,
      player: game.players[0],
      logPrefix,
      factionByKeyResponse: dbFaction,
      randomizeOrderCalls: [[[userId, opponentId]]],
      saveResponse: null,
      error: Error(message),
      saveCalls: [
        [
          {
            ...game,
            players: [
              {
                ...game.players[0],
                order: 0,
              },
              {
                ...game.players[1],
                order: 1,
              },
            ],
            turn: new ObjectId(userId),
            status: GameStatus.Redrawing,
          },
        ],
      ],
      errorCalls: [[`${logPrefix} setGameTurnOrder failed: ${message}`]],
      traceCalls: [[`${logPrefix} setGameTurnOrder no userIds provided, randomizing order`]],
    })
  })
  it('returns resolved updated game if no errors and implicitly setting users', async () => {
    const updatedGame: GameDbObject = {
      ...game,
      players: game.players.map((player, index) => {
        return {
          ...player,
          order: index,
        }
      }),
      turn: new ObjectId(userId),
      status: GameStatus.Redrawing,
      updated: new Date(),
    }
    await testSetGameTurnOrder({
      game: game,
      player: game.players[0],
      logPrefix,
      factionByKeyResponse: dbFaction,
      saveResponse: updatedGame,
      randomizeOrderCalls: [[[userId, opponentId]]],
      saveCalls: [
        [
          {
            ...updatedGame,
            updated: game.updated,
          },
        ],
      ],
      traceCalls: [[`${logPrefix} setGameTurnOrder no userIds provided, randomizing order`]],
    })
  })
  it('returns resolved updated game if no errors and explicitly setting self first', async () => {
    const dbGameScoiatael: GameDbObject = {
      ...game,
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
      players: dbGameScoiatael.players.map((player, index) => {
        return {
          ...player,
          order: index,
        }
      }),
      turn: new ObjectId(userId),
      status: GameStatus.Redrawing,
      updated: new Date(),
    }
    await testSetGameTurnOrder({
      game: dbGameScoiatael,
      player: dbGameScoiatael.players[0],
      logPrefix,
      userIds: [userId, opponentId],
      factionByKeyResponse: dbFaction,
      saveResponse: updatedGame,
      saveCalls: [
        [
          {
            ...updatedGame,
            updated: game.updated,
          },
        ],
      ],
    })
  })
  it('returns resolved updated game if no errors and explicitly setting opponent first', async () => {
    const dbGameScoiatael: GameDbObject = {
      ...game,
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
      players: dbGameScoiatael.players.map((player, index) => {
        return {
          ...player,
          order: dbGameScoiatael.players.length - index - 1,
        }
      }),
      turn: new ObjectId(opponentId),
      status: GameStatus.Redrawing,
      updated: new Date(),
    }
    await testSetGameTurnOrder({
      game: dbGameScoiatael,
      player: dbGameScoiatael.players[0],
      logPrefix,
      userIds: [opponentId, userId],
      factionByKeyResponse: dbFaction,
      saveResponse: updatedGame,
      saveCalls: [
        [
          {
            ...updatedGame,
            updated: game.updated,
          },
        ],
      ],
    })
  })
  it('logs to trace if enabled', async () => {
    const dbGameScoiatael: GameDbObject = {
      ...game,
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
      players: dbGameScoiatael.players.map((player, index) => {
        return {
          ...player,
          order: index,
        }
      }),
      turn: new ObjectId(userId),
      status: GameStatus.Redrawing,
      updated: new Date(),
    }
    await testSetGameTurnOrder({
      game: dbGameScoiatael,
      player: dbGameScoiatael.players[0],
      logPrefix,
      userIds: [userId, opponentId],
      factionByKeyResponse: dbFaction,
      saveResponse: updatedGame,
      saveCalls: [
        [
          {
            ...updatedGame,
            updated: game.updated,
          },
        ],
      ],
      traceEnabled: true,
      traceCalls: [
        [`${logPrefix} setGameTurnOrder userIds provided, not randomizing order`],
        [`${logPrefix} setGameTurnOrder updatedGame: "${JSON.stringify(updatedGame)}"`],
      ],
    })
  })
})

async function testSetGameTurnOrder({
  game,
  player,
  logPrefix,
  allowImplicit = false,
  userIds,
  factionByKeyResponse,
  saveResponse,
  error,
  randomizeOrderCalls = [],
  saveCalls = [],
  errorCalls = [],
  warnCalls = [],
  debugCalls = [],
  traceCalls = [],
  traceEnabled = false,
}: {
  game: GameDbObject
  player: GamePlayerDbObject
  logPrefix: string
  allowImplicit?: boolean
  userIds?: string[]
  factionByKeyResponse: FactionDbObject
  saveResponse?: GameDbObject | null
  error?: Error
  randomizeOrderCalls?: any[][]
  saveCalls?: any[][]
  errorCalls?: any[][]
  warnCalls?: any[][]
  debugCalls?: any[][]
  traceCalls?: string[][]
  traceEnabled?: boolean
}) {
  const getFactionByKeySpy = jest.spyOn(FactionStore, 'getByKey').mockResolvedValue(factionByKeyResponse)
  const randomizeOrderSpy = jest.spyOn(gwentUtils, 'randomizeOrder')
  const randomPlayerIds: string[] = []
  for (const player of game.players) {
    randomPlayerIds.push(player.user.toString())
  }
  randomizeOrderSpy.mockReturnValue(randomPlayerIds)
  const initializeNewRoundSpy = jest.spyOn(initializeNewRound, 'default').mockImplementation()
  const scoiataelAbilitySpy = jest.spyOn(FactionScoiaTaelAbility, 'attemptAbility').mockImplementation()
  const saveSpy = jest.spyOn(GameStore, 'save').mockResolvedValue(saveResponse || undefined)
  const resolveGameSpy = jest.spyOn(GameResolver, 'fromObject')
  let resolvedGame
  if (saveResponse) {
    resolvedGame = TestUtil.getGameFromDbGame({
      game: saveResponse,
    })
    resolveGameSpy.mockResolvedValue(resolvedGame)
  }
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SetGameTurnOrder['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = SetGameTurnOrder.setGameTurnOrder({
    game,
    gameDeck: player.deck,
    userIds,
    logPrefix,
    allowImplicit,
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(resolvedGame)
  }

  expect(getFactionByKeySpy.mock.calls).toEqual([
    [
      {
        key: FactionKey.ScoiaTael,
        logPrefix: logPrefix,
      },
    ],
  ])
  expect(randomizeOrderSpy.mock.calls).toEqual(randomizeOrderCalls)
  expect(initializeNewRoundSpy.mock.calls).toEqual(
    saveCalls.length === 0
      ? []
      : [
          [
            {
              game,
            },
          ],
        ]
  )
  expect(scoiataelAbilitySpy.mock.calls).toEqual(
    saveCalls.length === 0
      ? []
      : [
          [
            {
              game,
              logPrefix,
              scoiaTaelFactionId: factionByKeyResponse._id.toString(),
              scoiaTaelPlayers: game.players.filter(
                (gamePlayer) => gamePlayer.deck.from?.faction.toString() === factionByKeyResponse._id.toString()
              ),
              userIdsForOrder: saveResponse
                ? gwentUtils
                    .sortObjectArray({
                      array: saveResponse?.players,
                      sortProperties: ['order'],
                    })
                    .map((player) => player.user.toString())
                : game.players.map((player) => player.user.toString()),
            },
          ],
        ]
  )
  expect(saveSpy.mock.calls).toEqual(saveCalls)
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
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
