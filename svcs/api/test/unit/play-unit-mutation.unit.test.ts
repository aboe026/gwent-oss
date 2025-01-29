import { Context } from '@gwent/graphql-schema/context'
import { Combat, DeckUnit, Game, GameDeck, MutationPlayUnitArgs } from '@gwent/graphql-schema/resolver-typings'
import { ObjectId } from 'mongodb'
import TestUtil from '../test-util'
import PlayUnitMutation from '../../src/graphql/resolvers/mutations/play-unit-mutation'
import { NOT_AUTHENTICATED_MESSAGE, PubSubEvents } from '@gwent/constants'
import MutationUtil, { GamePlayerResponse } from '../../src/graphql/resolvers/mutations/mutation-util'
import {
  DeckUnitDbObject,
  GameDbObject,
  GameDeckDbObject,
  GameStatus,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import UnitStore from '../../src/database/stores/unit-store'
import { MoveType } from '@gwent/graphql-schema'
import GameStore from '../../src/database/stores/game-store'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import GameDeckResolver from '../../src/graphql/resolvers/types/game-deck-resolver'
import EventManager from '../../src/graphql/event-manager'

describe('play-unit-mutation', () => {
  describe('playUnit', () => {
    const userId = new ObjectId()
    const gameId = new ObjectId().toString()
    const unitId = new ObjectId().toString()
    const logPrefix = `playUnit by "${userId}" for unit "${unitId}" on game "${gameId}"`
    it('returns error if no user on context', async () => {
      await testPlayUnit({
        expected: Error(NOT_AUTHENTICATED_MESSAGE),
        errorCalls: [['No user on context for playUnit mutation: "{}".']],
      })
    })
    it('returns error if invalid unitId', async () => {
      const invalidUnitId = 'invalid'
      const message = `Unit ID "${invalidUnitId}" is not a valid MongoDB ObjectId.`
      await testPlayUnit({
        userId,
        gameId,
        unitId: invalidUnitId,
        expected: Error(message),
        warnCalls: [[`playUnit by "${userId}" for unit "${invalidUnitId}" on game "${gameId}" failed: ${message}`]],
      })
    })
    it('returns error if error getting game player', async () => {
      const message = `Game ID "invalid" is not a valid MongoDB ObjectId.`
      await testPlayUnit({
        userId,
        gameId,
        unitId,
        resolvedGameResponse: Error(message),
        expected: Error(message),
      })
    })
    it('returns error if unit not in hand', async () => {
      const message = 'Unit not in hand.'
      const game = getTestGame(gameId, userId, unitId)
      game.players = [
        {
          ...game.players[0],
          deck: TestUtil.getDbGameDeck({}),
        },
        game.players[1],
      ]
      await testPlayUnit({
        userId,
        gameId,
        unitId,
        resolvedGameResponse: {
          game,
          player: game.players[0],
        },
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error if more than 1 unit with ID in hand', async () => {
      const message = `Found more than 1 unit with ID "${unitId}"`
      const deckUnits = [
        TestUtil.getDbDeckUnit({
          id: unitId,
        }),
        TestUtil.getDbDeckUnit({
          id: unitId,
        }),
      ]
      const game = getTestGame(gameId, userId, unitId)
      game.players = [
        {
          ...game.players[0],
          deck: {
            ...game.players[0].deck,
            hand: deckUnits,
          },
        },
        game.players[1],
      ]
      await testPlayUnit({
        userId,
        gameId,
        unitId,
        resolvedGameResponse: {
          game,
          player: game.players[0],
        },
        expected: Error(`${message}.`),
        errorCalls: [[`${logPrefix} failed: ${message}: "${JSON.stringify(deckUnits)}"`]],
      })
    })
    it('returns error if unit does not exist', async () => {
      const message = 'Unit does not exist.'
      const game = getTestGame(gameId, userId, unitId)
      await testPlayUnit({
        userId,
        gameId,
        unitId,
        resolvedGameResponse: {
          game,
          player: game.players[0],
        },
        resolvedUnitsResponse: [],
        expected: Error(message),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error if more than 1 unit found', async () => {
      const message = `Found multiple units with ID "${unitId}"`
      const deckUnits = [
        TestUtil.getDbUnit({
          id: unitId,
        }),
        TestUtil.getDbUnit({
          id: unitId,
        }),
      ]
      const game = getTestGame(gameId, userId, unitId)
      await testPlayUnit({
        userId,
        gameId,
        unitId,
        resolvedGameResponse: {
          game,
          player: game.players[0],
        },
        resolvedUnitsResponse: deckUnits,
        expected: Error(`${message}.`),
        errorCalls: [[`${logPrefix} failed: ${message}: "${JSON.stringify(deckUnits)}"`]],
      })
    })
    it('returns error if combat not specified for multi combat unit', async () => {
      const deckUnit = TestUtil.getDbUnit({
        id: unitId,
        combats: [Combat.Close, Combat.Ranged],
      })
      const message = `Must specify combat: One of "${JSON.stringify(deckUnit.combats)}".`
      const game = getTestGame(gameId, userId, unitId)
      await testPlayUnit({
        userId,
        gameId,
        unitId,
        resolvedGameResponse: {
          game,
          player: game.players[0],
        },
        resolvedUnitsResponse: [deckUnit],
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error if combat does not match unit combats', async () => {
      const combat = Combat.Close
      const deckUnit = TestUtil.getDbUnit({
        id: unitId,
        combats: [Combat.Siege],
      })
      const message = `Combat "${combat}" does match unit combats of "${JSON.stringify(deckUnit.combats)}".`
      const game = getTestGame(gameId, userId, unitId)
      await testPlayUnit({
        userId,
        gameId,
        unitId,
        combat,
        resolvedGameResponse: {
          game,
          player: game.players[0],
        },
        resolvedUnitsResponse: [deckUnit],
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error if combat not specified on unit without combat', async () => {
      const deckUnit = TestUtil.getDbUnit({
        id: unitId,
      })
      const message = 'Must specify combat.'
      const game = getTestGame(gameId, userId, unitId)
      await testPlayUnit({
        userId,
        gameId,
        unitId,
        resolvedGameResponse: {
          game,
          player: game.players[0],
        },
        resolvedUnitsResponse: [deckUnit],
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error if getNextPlayerIdForCurrentRound returns error', async () => {
      const message = 'Could not determine next player for round "1".'
      const artStyle = 1
      const strength = 2
      const deckUnit = TestUtil.getDbUnit({
        id: unitId,
        combats: [Combat.Close],
        strength,
      })
      const moveDate = new Date()
      const game = getTestGame(gameId, userId, unitId)
      game.players = game.players.map((gamePlayer) => {
        return {
          ...gamePlayer,
          rounds: gamePlayer.rounds.map((round) => {
            round.passed = true
            return round
          }),
        }
      })
      const modifiedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...game.players[0],
            deck: {
              ...game.players[0].deck,
              hand: [],
            },
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: strength,
                  units: [
                    {
                      artStyle,
                      unit: deckUnit._id,
                      effectiveStrength: strength,
                    },
                  ],
                },
                score: strength,
                moves: [
                  {
                    created: moveDate,
                    row: Combat.Close,
                    unit: {
                      artStyle,
                      unit: deckUnit._id,
                    },
                    type: MoveType.Unit,
                  },
                ],
              }),
            ],
          },
          game.players[1],
        ],
        turn: game.players[1].user,
      }
      await testPlayUnit({
        userId,
        gameId,
        unitId,
        resolvedGameResponse: {
          game,
          player: game.players[0],
        },
        resolvedUnitsResponse: [deckUnit],
        modifiedGame,
        moveDate,
        expected: Error(message),
      })
    })
    it('returns error if makeMove returns undefined', async () => {
      const message = `Could not play unit "${unitId}" for game "${gameId}" in probable race condition collision.`
      const artStyle = 1
      const strength = 2
      const deckUnit = TestUtil.getDbUnit({
        id: unitId,
        combats: [Combat.Close],
        strength,
      })
      const moveDate = new Date()
      const game = getTestGame(gameId, userId, unitId)
      const modifiedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...game.players[0],
            deck: {
              ...game.players[0].deck,
              hand: [],
            },
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: strength,
                  units: [
                    {
                      artStyle,
                      unit: deckUnit._id,
                      effectiveStrength: strength,
                    },
                  ],
                },
                score: strength,
                moves: [
                  {
                    created: moveDate,
                    row: Combat.Close,
                    unit: {
                      artStyle,
                      unit: deckUnit._id,
                    },
                    type: MoveType.Unit,
                  },
                ],
              }),
            ],
          },
          game.players[1],
        ],
        turn: game.players[1].user,
      }
      await testPlayUnit({
        userId,
        gameId,
        unitId,
        resolvedGameResponse: {
          game,
          player: game.players[0],
        },
        resolvedUnitsResponse: [deckUnit],
        modifiedGame,
        moveDate,
        makeMoveCalled: true,
        makeMoveResponseEmpty: true,
        expected: Error(message),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns updated game if no errors and close combat', async () => {
      const artStyle = 1
      const strength = 2
      const deckUnit = TestUtil.getDbUnit({
        id: unitId,
        combats: [Combat.Close],
        strength,
      })
      const moveDate = new Date()
      const game = getTestGame(gameId, userId, unitId)
      const modifiedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...game.players[0],
            deck: {
              ...game.players[0].deck,
              hand: [],
            },
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: strength,
                  units: [
                    {
                      artStyle,
                      unit: deckUnit._id,
                      effectiveStrength: strength,
                    },
                  ],
                },
                score: strength,
                moves: [
                  {
                    created: moveDate,
                    row: Combat.Close,
                    unit: {
                      artStyle,
                      unit: deckUnit._id,
                    },
                    type: MoveType.Unit,
                  },
                ],
              }),
            ],
          },
          game.players[1],
        ],
        turn: game.players[1].user,
      }
      await testPlayUnit({
        userId,
        gameId,
        unitId,
        resolvedGameResponse: {
          game,
          player: game.players[0],
        },
        resolvedUnitsResponse: [deckUnit],
        modifiedGame,
        moveDate,
        makeMoveCalled: true,
        expected: TestUtil.getGameFromDbGame({
          game: modifiedGame,
        }),
      })
    })
    it('returns updated game if no errors and ranged combat', async () => {
      const artStyle = 1
      const strength = 2
      const deckUnit = TestUtil.getDbUnit({
        id: unitId,
        combats: [Combat.Ranged],
        strength,
      })
      const moveDate = new Date()
      const game = getTestGame(gameId, userId, unitId)
      const modifiedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...game.players[0],
            deck: {
              ...game.players[0].deck,
              hand: [],
            },
            rounds: [
              TestUtil.getDbPlayerRound({
                ranged: {
                  score: strength,
                  units: [
                    {
                      artStyle,
                      unit: deckUnit._id,
                      effectiveStrength: strength,
                    },
                  ],
                },
                score: strength,
                moves: [
                  {
                    created: moveDate,
                    row: Combat.Ranged,
                    unit: {
                      artStyle,
                      unit: deckUnit._id,
                    },
                    type: MoveType.Unit,
                  },
                ],
              }),
            ],
          },
          game.players[1],
        ],
        turn: game.players[1].user,
      }
      await testPlayUnit({
        userId,
        gameId,
        unitId,
        combat: Combat.Ranged,
        resolvedGameResponse: {
          game,
          player: game.players[0],
        },
        resolvedUnitsResponse: [deckUnit],
        modifiedGame,
        moveDate,
        makeMoveCalled: true,
        expected: TestUtil.getGameFromDbGame({
          game: modifiedGame,
        }),
      })
    })
    it('returns updated game if no errors and siege combat', async () => {
      const artStyle = 1
      const strength = 2
      const deckUnit = TestUtil.getDbUnit({
        id: unitId,
        combats: [Combat.Siege],
        strength,
      })
      const moveDate = new Date()
      const game = getTestGame(gameId, userId, unitId)
      const modifiedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...game.players[0],
            deck: {
              ...game.players[0].deck,
              hand: [],
            },
            rounds: [
              TestUtil.getDbPlayerRound({
                siege: {
                  score: strength,
                  units: [
                    {
                      artStyle,
                      unit: deckUnit._id,
                      effectiveStrength: strength,
                    },
                  ],
                },
                score: strength,
                moves: [
                  {
                    created: moveDate,
                    row: Combat.Siege,
                    unit: {
                      artStyle,
                      unit: deckUnit._id,
                    },
                    type: MoveType.Unit,
                  },
                ],
              }),
            ],
          },
          game.players[1],
        ],
        turn: game.players[1].user,
      }
      await testPlayUnit({
        userId,
        gameId,
        unitId,
        combat: Combat.Siege,
        resolvedGameResponse: {
          game,
          player: game.players[0],
        },
        resolvedUnitsResponse: [deckUnit],
        modifiedGame,
        moveDate,
        makeMoveCalled: true,
        expected: TestUtil.getGameFromDbGame({
          game: modifiedGame,
        }),
      })
    })
    it('returns updated game if no errors and no strength', async () => {
      const artStyle = 1
      const deckUnit = TestUtil.getDbUnit({
        id: unitId,
        combats: [Combat.Close],
      })
      const moveDate = new Date()
      const game = getTestGame(gameId, userId, unitId)
      const modifiedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...game.players[0],
            deck: {
              ...game.players[0].deck,
              hand: [],
            },
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [
                    {
                      artStyle,
                      unit: deckUnit._id,
                      effectiveStrength: undefined,
                    },
                  ],
                },
                moves: [
                  {
                    created: moveDate,
                    row: Combat.Close,
                    unit: {
                      artStyle,
                      unit: deckUnit._id,
                    },
                    type: MoveType.Unit,
                  },
                ],
              }),
            ],
          },
          game.players[1],
        ],
        turn: game.players[1].user,
      }
      await testPlayUnit({
        userId,
        gameId,
        unitId,
        resolvedGameResponse: {
          game,
          player: game.players[0],
        },
        resolvedUnitsResponse: [deckUnit],
        modifiedGame,
        moveDate,
        makeMoveCalled: true,
        expected: TestUtil.getGameFromDbGame({
          game: modifiedGame,
        }),
      })
    })
    it('returns updated game if no errors and second game player', async () => {
      const artStyle = 1
      const strength = 2
      const deckUnit = TestUtil.getDbUnit({
        id: unitId,
        combats: [Combat.Close],
        strength,
      })
      const moveDate = new Date()
      const game = getTestGame(gameId, userId, unitId)
      game.players = game.players = [
        {
          ...game.players[1],
          order: 0,
        },
        {
          ...game.players[0],
          order: 1,
        },
      ]
      const modifiedGame: GameDbObject = {
        ...game,
        players: [
          game.players[0],
          {
            ...game.players[1],
            deck: {
              ...game.players[1].deck,
              hand: [],
            },
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: strength,
                  units: [
                    {
                      artStyle,
                      unit: deckUnit._id,
                      effectiveStrength: strength,
                    },
                  ],
                },
                score: strength,
                moves: [
                  {
                    created: moveDate,
                    row: Combat.Close,
                    unit: {
                      artStyle,
                      unit: deckUnit._id,
                    },
                    type: MoveType.Unit,
                  },
                ],
              }),
            ],
          },
        ],
        turn: game.players[0].user,
      }
      await testPlayUnit({
        userId,
        gameId,
        unitId,
        resolvedGameResponse: {
          game,
          player: game.players[1],
        },
        resolvedUnitsResponse: [deckUnit],
        modifiedGame,
        moveDate,
        makeMoveCalled: true,
        expected: TestUtil.getGameFromDbGame({
          game: modifiedGame,
        }),
      })
    })
    it('returns updated game if no errors and second round', async () => {
      const artStyle = 1
      const strength = 2
      const deckUnit = TestUtil.getDbUnit({
        id: unitId,
        combats: [Combat.Close],
        strength,
      })
      const moveDate = new Date()
      const game = getTestGame(gameId, userId, unitId)
      game.players = game.players.map((gamePlayer) => {
        return {
          ...gamePlayer,
          rounds: [...gamePlayer.rounds, TestUtil.getDbPlayerRound({})],
        }
      })
      game.round = 2
      const modifiedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...game.players[0],
            deck: {
              ...game.players[0].deck,
              hand: [],
            },
            rounds: [
              TestUtil.getDbPlayerRound({}),
              TestUtil.getDbPlayerRound({
                close: {
                  score: strength,
                  units: [
                    {
                      artStyle,
                      unit: deckUnit._id,
                      effectiveStrength: strength,
                    },
                  ],
                },
                score: strength,
                moves: [
                  {
                    created: moveDate,
                    row: Combat.Close,
                    unit: {
                      artStyle,
                      unit: deckUnit._id,
                    },
                    type: MoveType.Unit,
                  },
                ],
              }),
            ],
          },
          game.players[1],
        ],
        turn: game.players[1].user,
      }
      await testPlayUnit({
        userId,
        gameId,
        unitId,
        resolvedGameResponse: {
          game,
          player: game.players[0],
        },
        resolvedUnitsResponse: [deckUnit],
        modifiedGame,
        moveDate,
        makeMoveCalled: true,
        expected: TestUtil.getGameFromDbGame({
          game: modifiedGame,
        }),
      })
    })
    it('logs to trace if enabled', async () => {
      const artStyle = 1
      const strength = 2
      const deckUnit = TestUtil.getDbUnit({
        id: unitId,
        combats: [Combat.Close],
        strength,
      })
      const moveDate = new Date()
      const game = getTestGame(gameId, userId, unitId)
      const modifiedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...game.players[0],
            deck: {
              ...game.players[0].deck,
              hand: [],
            },
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: strength,
                  units: [
                    {
                      artStyle,
                      unit: deckUnit._id,
                      effectiveStrength: strength,
                    },
                  ],
                },
                score: strength,
                moves: [
                  {
                    created: moveDate,
                    row: Combat.Close,
                    unit: {
                      artStyle,
                      unit: deckUnit._id,
                    },
                    type: MoveType.Unit,
                  },
                ],
              }),
            ],
          },
          game.players[1],
        ],
        turn: game.players[1].user,
      }
      await testPlayUnit({
        userId,
        gameId,
        unitId,
        resolvedGameResponse: {
          game,
          player: game.players[0],
        },
        resolvedUnitsResponse: [deckUnit],
        modifiedGame,
        moveDate,
        makeMoveCalled: true,
        expected: TestUtil.getGameFromDbGame({
          game: modifiedGame,
        }),
        traceEnabled: true,
      })
    })
  })
})

async function testPlayUnit({
  userId,
  gameId = '',
  unitId = '',
  combat,
  resolvedGameResponse,
  resolvedUnitsResponse,
  modifiedGame,
  moveDate,
  makeMoveCalled,
  makeMoveResponseEmpty,
  expected,
  errorCalls = [],
  warnCalls = [],
  traceEnabled,
}: {
  userId?: ObjectId
  gameId?: string
  unitId?: string
  combat?: Combat
  resolvedGameResponse?: GamePlayerResponse | Error
  resolvedUnitsResponse?: UnitDbObject[]
  modifiedGame?: GameDbObject
  moveDate?: Date
  makeMoveCalled?: boolean
  makeMoveResponseEmpty?: boolean
  expected: Game | Error
  errorCalls?: string[][]
  warnCalls?: string[][]
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
  const args: MutationPlayUnitArgs = {
    game: gameId,
    unit: unitId,
    combat,
  }
  const logPrefix = `playUnit by "${userId}" for unit "${unitId}" on game "${gameId}"`
  const getGamePlayerSpy = jest.spyOn(MutationUtil, 'getGamePlayer')
  if (resolvedGameResponse) {
    getGamePlayerSpy.mockResolvedValue(resolvedGameResponse)
  }
  const getUnitsSpy = jest.spyOn(UnitStore, 'get')
  if (resolvedUnitsResponse) {
    getUnitsSpy.mockResolvedValue(resolvedUnitsResponse)
  }
  const updated = new Date()

  const updatedGame: GameDbObject = {
    ...(modifiedGame as GameDbObject),
    updated,
    turn: userId,
  }
  const makeMoveSpy = jest
    .spyOn(GameStore, 'makeMove')
    .mockResolvedValue(makeMoveResponseEmpty ? undefined : updatedGame)
  const resolveGameSpy = jest.spyOn(GameResolver, 'fromObject')
  if (expected && !(expected instanceof Error)) {
    resolveGameSpy.mockResolvedValue(expected)
  }
  let dbDeckUnit: DeckUnitDbObject | undefined = undefined
  let resolvedDeckUnit: DeckUnit | undefined = undefined
  let gameDeck: GameDeckDbObject | undefined = undefined
  let resolvedGameDeck: GameDeck | undefined = undefined
  if (resolvedGameResponse && !(resolvedGameResponse instanceof Error)) {
    dbDeckUnit = resolvedGameResponse.player.deck.hand[0]
    if (dbDeckUnit) {
      resolvedDeckUnit = TestUtil.getDeckUnitFromDbDeckUnit(dbDeckUnit)
    }
    gameDeck = resolvedGameResponse.player.deck
    resolvedGameDeck = TestUtil.getGameDeckFromDbGameDeck(gameDeck)
  }
  const resolveUnitSpy = jest.spyOn(DeckUnitResolver, 'fromObject')
  if (resolvedDeckUnit) {
    resolveUnitSpy.mockResolvedValue(resolvedDeckUnit)
  }
  const resolveGameDeckSpy = jest.spyOn(GameDeckResolver, 'fromObject')
  if (resolvedGameDeck) {
    resolveGameDeckSpy.mockResolvedValue(resolvedGameDeck)
  }
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const dateSpy = jest.spyOn(global, 'Date')
  if (moveDate) {
    dateSpy.mockImplementation(() => moveDate)
  }
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  PlayUnitMutation['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(PlayUnitMutation.playUnit(args, context, null as any)).resolves.toEqual(expected)

  expect(getGamePlayerSpy.mock.calls).toEqual(
    resolvedGameResponse
      ? [
          [
            {
              gameId,
              logPrefix,
              userId,
              status: GameStatus.Playing,
              turn: true,
              label: 'play units',
            },
          ],
        ]
      : []
  )
  expect(getUnitsSpy.mock.calls).toEqual(
    resolvedUnitsResponse
      ? [
          [
            {
              ids: [unitId],
            },
          ],
        ]
      : []
  )
  expect(dateSpy.mock.calls).toEqual(moveDate ? [[]] : [])
  const gameReturned = makeMoveCalled && !makeMoveResponseEmpty
  expect(makeMoveSpy.mock.calls).toEqual(
    makeMoveCalled
      ? [
          [
            {
              game: modifiedGame,
              userId,
            },
          ],
        ]
      : []
  )
  expect(resolveGameSpy.mock.calls).toEqual(
    gameReturned
      ? [
          [
            {
              game: updatedGame,
            },
          ],
        ]
      : []
  )
  expect(resolveUnitSpy.mock.calls).toEqual(
    gameReturned
      ? [
          [
            {
              deckUnit: dbDeckUnit,
            },
          ],
        ]
      : []
  )
  expect(resolveGameDeckSpy.mock.calls).toEqual(
    gameReturned
      ? [
          [
            {
              gameDeck,
            },
          ],
        ]
      : []
  )
  expect(publishSpy.mock.calls).toEqual(
    gameReturned
      ? [
          [
            PubSubEvents.UnitPlayedOnGame,
            {
              unitPlayedOnGame: {
                game: expected,
                unit: resolvedDeckUnit,
              },
            },
          ],
          [
            PubSubEvents.UnitPlayedFromDeck,
            {
              unitPlayedFromDeck: {
                deck: resolvedGameDeck,
                game: expected,
                unit: resolvedDeckUnit,
              },
            },
          ],
        ]
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `playUnit by "${userId}" args: "${JSON.stringify({
              game: gameId,
              unit: unitId,
              combat,
            })}"`,
          ],
          [`playUnit by "${userId}" requested fields: "[]"`],
          [`playUnit by "${userId}" requested arguments: "[]"`],
        ]
      : []
  )
}

function getTestGame(gameId: string, userId: ObjectId, unitId: string): GameDbObject {
  return TestUtil.getDbGame({
    id: gameId,
    players: [
      TestUtil.getDbGamePlayer({
        user: userId,
        deck: TestUtil.getDbGameDeck({
          hand: [
            TestUtil.getDbDeckUnit({
              id: unitId,
            }),
          ],
        }),
        rounds: [TestUtil.getDbPlayerRound({})],
        order: 0,
      }),
      TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
        order: 1,
      }),
    ],
    turn: userId,
    round: 1,
  })
}
