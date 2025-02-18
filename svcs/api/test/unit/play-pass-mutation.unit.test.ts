import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import EventManager from '../../src/graphql/event-manager'
import { Game, GameDeck, MutationPlayPassArgs, RoundResult } from '@gwent/graphql-schema/resolver-typings'
import { GameDbObject, GameDeckDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import GameDeckResolver from '../../src/graphql/resolvers/types/game-deck-resolver'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import { MoveType } from '@gwent/graphql-schema'
import MutationUtil from '../../src/graphql/resolvers/mutations/mutation-util'
import { PubSubEvents } from '@gwent/constants'
import PlayPassMutation from '../../src/graphql/resolvers/mutations/play-pass-mutation'
import ResolverUtil, { GamePlayerResponse } from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../test-util'

describe('play-pass-mutation', () => {
  describe('playPass', () => {
    const userId = new ObjectId()
    const gameId = new ObjectId().toString()
    const logPrefix = `playPass by "${userId}" on game "${gameId}"`
    it('throws error if current round does not exist on player', async () => {
      const message = `Could not get round "1" for player "${userId}"`
      const player = TestUtil.getDbGamePlayer({
        user: userId,
      })
      const game = TestUtil.getDbGame({
        players: [player],
        round: 1,
      })
      await testPlayPass({
        userId,
        gameId,
        getGamePlayerResponse: {
          game,
          player,
        },
        expected: Error(message),
        errorCalls: [[`${logPrefix} failed: ${message}: "${JSON.stringify(player.rounds)}"`]],
      })
    })
    it('throws error if user already passed the current round', async () => {
      const message = 'Already passed round "1"'
      const player = TestUtil.getDbGamePlayer({
        user: userId,
        rounds: [
          TestUtil.getDbPlayerRound({
            passed: true,
          }),
        ],
      })
      const game = TestUtil.getDbGame({
        players: [player],
        round: 1,
      })
      await testPlayPass({
        userId,
        gameId,
        getGamePlayerResponse: {
          game,
          player,
        },
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if save returns undefined', async () => {
      const message = 'Could not play pass in probable race condition collision.'
      const firstPlayer = TestUtil.getDbGamePlayer({
        user: userId,
        rounds: [TestUtil.getDbPlayerRound({})],
        order: 0,
      })
      const secondPlayer = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
        order: 1,
      })
      const moveDate = new Date()
      const game = TestUtil.getDbGame({
        players: [firstPlayer, secondPlayer],
        round: 1,
        turn: firstPlayer.user,
      })
      const modifiedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...firstPlayer,
            rounds: [
              {
                ...firstPlayer.rounds[0],
                passed: true,
                moves: [
                  {
                    created: moveDate,
                    type: MoveType.Pass,
                  },
                ],
              },
            ],
          },
          secondPlayer,
        ],
        turn: secondPlayer.user,
      }
      await testPlayPass({
        userId,
        gameId,
        getGamePlayerResponse: {
          game,
          player: firstPlayer,
        },
        saveResponse: true,
        modifiedGame,
        moveDate,
        nextPlayerId: secondPlayer.user,
        expected: Error(message),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns resolved game if no errors', async () => {
      const firstPlayer = TestUtil.getDbGamePlayer({
        user: userId,
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        rounds: [TestUtil.getDbPlayerRound({})],
        order: 0,
      })
      const secondPlayer = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        rounds: [TestUtil.getDbPlayerRound({})],
        order: 1,
      })
      const moveDate = new Date()
      const game = TestUtil.getDbGame({
        players: [firstPlayer, secondPlayer],
        round: 1,
        turn: firstPlayer.user,
      })
      const modifiedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...firstPlayer,
            rounds: [
              {
                ...firstPlayer.rounds[0],
                passed: true,
                moves: [
                  {
                    created: moveDate,
                    type: MoveType.Pass,
                  },
                ],
              },
            ],
          },
          secondPlayer,
        ],
        turn: secondPlayer.user,
      }
      await testPlayPass({
        userId,
        gameId,
        getGamePlayerResponse: {
          game,
          player: firstPlayer,
        },
        modifiedGame,
        moveDate,
        nextPlayerId: secondPlayer.user,
        expected: TestUtil.getGameFromDbGame({
          game: modifiedGame,
        }),
      })
    })
    it('returns resolved game if round over in draw', async () => {
      const firstPlayer = TestUtil.getDbGamePlayer({
        user: userId,
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        rounds: [TestUtil.getDbPlayerRound({})],
        order: 0,
      })
      const secondPlayer = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        rounds: [
          TestUtil.getDbPlayerRound({
            passed: true,
          }),
        ],
        order: 1,
      })
      const moveDate = new Date()
      const game = TestUtil.getDbGame({
        players: [firstPlayer, secondPlayer],
        round: 1,
        turn: firstPlayer.user,
      })
      const modifiedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...firstPlayer,
            rounds: [
              {
                ...firstPlayer.rounds[0],
                passed: true,
                result: RoundResult.Drew,
                moves: [
                  {
                    created: moveDate,
                    type: MoveType.Pass,
                  },
                ],
              },
              TestUtil.getDbPlayerRound({}),
            ],
          },
          {
            ...secondPlayer,
            rounds: [
              {
                ...secondPlayer.rounds[0],
                result: RoundResult.Drew,
              },
              TestUtil.getDbPlayerRound({}),
            ],
          },
        ],
        turn: secondPlayer.user,
        round: 2,
      }
      await testPlayPass({
        userId,
        gameId,
        getGamePlayerResponse: {
          game,
          player: firstPlayer,
        },
        modifiedGame,
        moveDate,
        nextPlayerId: secondPlayer.user,
        roundOver: true,
        expected: TestUtil.getGameFromDbGame({
          game: modifiedGame,
        }),
        debugCalls: [
          [`${logPrefix} ends round "1" in draw for "${JSON.stringify([firstPlayer.user, secondPlayer.user])}"`],
        ],
        traceCalls: [
          [`${logPrefix} player "${firstPlayer.user}" round "1" score: "0"`],
          [`${logPrefix} player "${secondPlayer.user}" round "1" score: "0"`],
          [`${logPrefix} round "1" highestScore: "0"`],
          [`${logPrefix} round "1" usersWithHighestScore: "2"`],
          [`${logPrefix} player "${firstPlayer.user}" round "1" result: "${RoundResult.Drew}"`],
          [`${logPrefix} player "${secondPlayer.user}" round "1" result: "${RoundResult.Drew}"`],
        ],
      })
    })
    it('returns resolved game if round over in win', async () => {
      const firstPlayer = TestUtil.getDbGamePlayer({
        user: userId,
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        rounds: [
          TestUtil.getDbPlayerRound({
            score: 1,
          }),
        ],
        order: 0,
      })
      const secondPlayer = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        rounds: [
          TestUtil.getDbPlayerRound({
            passed: true,
          }),
        ],
        order: 1,
      })
      const moveDate = new Date()
      const game = TestUtil.getDbGame({
        players: [firstPlayer, secondPlayer],
        round: 1,
        turn: firstPlayer.user,
      })
      const modifiedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...firstPlayer,
            rounds: [
              {
                ...firstPlayer.rounds[0],
                passed: true,
                result: RoundResult.Won,
                moves: [
                  {
                    created: moveDate,
                    type: MoveType.Pass,
                  },
                ],
              },
              TestUtil.getDbPlayerRound({}),
            ],
          },
          {
            ...secondPlayer,
            rounds: [
              {
                ...secondPlayer.rounds[0],
                result: RoundResult.Lost,
              },
              TestUtil.getDbPlayerRound({}),
            ],
          },
        ],
        round: 2,
      }
      await testPlayPass({
        userId,
        gameId,
        getGamePlayerResponse: {
          game,
          player: firstPlayer,
        },
        modifiedGame,
        moveDate,
        nextPlayerId: firstPlayer.user,
        roundOver: true,
        expected: TestUtil.getGameFromDbGame({
          game: modifiedGame,
        }),
        debugCalls: [[`${logPrefix} ends round "1" in win for "${JSON.stringify([firstPlayer.user])}"`]],
        traceCalls: [
          [`${logPrefix} player "${firstPlayer.user}" round "1" score: "1"`],
          [
            `${logPrefix} player "${firstPlayer.user}" round "1" score "1" is greater than previous highestScore of "0", setting it to theirs`,
          ],
          [`${logPrefix} player "${secondPlayer.user}" round "1" score: "0"`],
          [`${logPrefix} round "1" highestScore: "1"`],
          [`${logPrefix} round "1" usersWithHighestScore: "1"`],
          [`${logPrefix} player "${firstPlayer.user}" round "1" result: "${RoundResult.Won}"`],
          [`${logPrefix} player "${secondPlayer.user}" round "1" result: "${RoundResult.Lost}"`],
        ],
      })
    })
    it('returns resolved game if game over', async () => {
      const firstPlayer = TestUtil.getDbGamePlayer({
        user: userId,
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        rounds: [
          TestUtil.getDbPlayerRound({
            result: RoundResult.Won,
          }),
          TestUtil.getDbPlayerRound({}),
        ],
        order: 0,
      })
      const secondPlayer = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        rounds: [
          TestUtil.getDbPlayerRound({
            result: RoundResult.Lost,
          }),
          TestUtil.getDbPlayerRound({
            passed: true,
          }),
        ],
        order: 1,
      })
      const moveDate = new Date()
      const game = TestUtil.getDbGame({
        players: [firstPlayer, secondPlayer],
        round: 2,
        turn: firstPlayer.user,
      })
      const modifiedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...firstPlayer,
            rounds: [
              firstPlayer.rounds[0],
              {
                ...firstPlayer.rounds[1],
                passed: true,
                result: RoundResult.Drew,
                moves: [
                  {
                    created: moveDate,
                    type: MoveType.Pass,
                  },
                ],
              },
            ],
          },
          {
            ...secondPlayer,
            rounds: [
              secondPlayer.rounds[0],
              {
                ...secondPlayer.rounds[1],
                result: RoundResult.Drew,
              },
            ],
          },
        ],
        turn: firstPlayer.user,
        round: 2,
        victors: [firstPlayer.user],
        status: GameStatus.Done,
      }
      await testPlayPass({
        userId,
        gameId,
        getGamePlayerResponse: {
          game,
          player: firstPlayer,
        },
        modifiedGame,
        moveDate,
        roundOver: true,
        gameOver: true,
        expected: TestUtil.getGameFromDbGame({
          game: modifiedGame,
        }),
        debugCalls: [
          [`${logPrefix} ends round "2" in draw for "${JSON.stringify([firstPlayer.user, secondPlayer.user])}"`],
          [`${logPrefix} ends game in victory for "${JSON.stringify([firstPlayer.user])}"`],
        ],
        traceCalls: [
          [`${logPrefix} player "${firstPlayer.user}" round "2" score: "0"`],
          [`${logPrefix} player "${secondPlayer.user}" round "2" score: "0"`],
          [`${logPrefix} round "2" highestScore: "0"`],
          [`${logPrefix} round "2" usersWithHighestScore: "2"`],
          [`${logPrefix} player "${firstPlayer.user}" round "2" result: "${RoundResult.Drew}"`],
          [`${logPrefix} player "${secondPlayer.user}" round "2" result: "${RoundResult.Drew}"`],
          [`${logPrefix} player "${firstPlayer.user}" playerWins: "1"`],
          [
            `${logPrefix} player "${firstPlayer.user}" wins "1" is greater than previous highestWins of "0", setting high wins to theirs`,
          ],
          [`${logPrefix} player "${secondPlayer.user}" playerWins: "0"`],
          [`${logPrefix} highestWins: "1"`],
        ],
      })
    })
    it('logs to trace if enabled', async () => {
      const firstPlayer = TestUtil.getDbGamePlayer({
        user: userId,
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        rounds: [TestUtil.getDbPlayerRound({})],
        order: 0,
      })
      const secondPlayer = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({}),
        }),
        rounds: [TestUtil.getDbPlayerRound({})],
        order: 1,
      })
      const moveDate = new Date()
      const game = TestUtil.getDbGame({
        players: [firstPlayer, secondPlayer],
        round: 1,
        turn: firstPlayer.user,
      })
      const modifiedGame: GameDbObject = {
        ...game,
        players: [
          {
            ...firstPlayer,
            rounds: [
              {
                ...firstPlayer.rounds[0],
                passed: true,
                moves: [
                  {
                    created: moveDate,
                    type: MoveType.Pass,
                  },
                ],
              },
            ],
          },
          secondPlayer,
        ],
        turn: secondPlayer.user,
      }
      await testPlayPass({
        userId,
        gameId,
        getGamePlayerResponse: {
          game,
          player: firstPlayer,
        },
        modifiedGame,
        moveDate,
        nextPlayerId: secondPlayer.user,
        expected: TestUtil.getGameFromDbGame({
          game: modifiedGame,
        }),
        traceEnabled: true,
        traceCalls: [
          [`playPass by "${userId}" on game "${gameId}" args: "${JSON.stringify({ game: gameId })}"`],
          [`playPass by "${userId}" on game "${gameId}" requested fields: "[]"`],
          [`playPass by "${userId}" on game "${gameId}" requested arguments: "[]"`],
        ],
      })
    })
  })
})

async function testPlayPass({
  userId,
  gameId = '',
  getGamePlayerResponse,
  nextPlayerId,
  modifiedGame,
  saveResponse,
  moveDate,
  roundOver = false,
  gameOver = false,
  expected,
  traceEnabled,
  errorCalls = [],
  warnCalls = [],
  debugCalls = [],
  traceCalls = [],
}: {
  userId?: ObjectId
  gameId?: string
  getGamePlayerResponse: GamePlayerResponse
  nextPlayerId?: ObjectId
  modifiedGame?: GameDbObject
  saveResponse?: boolean
  moveDate?: Date
  roundOver?: boolean
  gameOver?: boolean
  expected: Game | Error
  errorCalls?: string[][]
  warnCalls?: string[][]
  debugCalls?: string[][]
  traceEnabled?: boolean
  traceCalls?: string[][]
}) {
  const context: Context = {
    session: {},
  }
  if (userId && context.session) {
    context.session.user = TestUtil.getDbUser({
      id: userId,
    })
  }
  const args: MutationPlayPassArgs = {
    game: gameId,
  }
  const getGamePlayerSpy = jest.spyOn(ResolverUtil.prototype, 'getGamePlayer').mockResolvedValue(getGamePlayerResponse)
  const isRoundOverSpy = jest.spyOn(MutationUtil.prototype, 'isRoundOver').mockReturnValue(roundOver)
  const isGameOverSpy = jest.spyOn(MutationUtil.prototype, 'isGameOver').mockReturnValue(gameOver)
  const getPlayerIdForNextRoundSpy = jest.spyOn(MutationUtil.prototype, 'getPlayerIdForNextRound')
  if (nextPlayerId) {
    getPlayerIdForNextRoundSpy.mockReturnValue(nextPlayerId)
  }
  const getNextPlayerIdForCurrentRoundSpy = jest.spyOn(MutationUtil.prototype, 'getNextPlayerIdForCurrentRound')
  if (nextPlayerId) {
    getNextPlayerIdForCurrentRoundSpy.mockReturnValue(nextPlayerId)
  }

  const updatedGame: GameDbObject = {
    ...(modifiedGame as GameDbObject),
    updated: new Date(),
    turn: nextPlayerId,
  }
  const saveSpy = jest.spyOn(GameStore, 'save').mockResolvedValue(saveResponse ? undefined : updatedGame)
  let resolvedGame: Game | undefined = undefined
  if (expected && !(expected instanceof Error)) {
    resolvedGame = expected
  }
  const gameResolverSpy = jest.spyOn(GameResolver, 'fromObject')
  if (resolvedGame) {
    gameResolverSpy.mockResolvedValue(resolvedGame)
  }
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const gameDecks: GameDeckDbObject[] = []
  const resolvedGameDecks: GameDeck[] = []
  if (updatedGame && updatedGame.players) {
    for (const player of updatedGame.players) {
      gameDecks.push(player.deck)
      resolvedGameDecks.push(TestUtil.getGameDeckFromDbGameDeck(player.deck))
    }
  }
  const gameDeckResolverSpy = jest.spyOn(GameDeckResolver, 'fromObject')
  if (resolvedGameDecks) {
    for (const resolvedGameDeck of resolvedGameDecks) {
      gameDeckResolverSpy.mockResolvedValueOnce(resolvedGameDeck)
    }
  }
  const dateSpy = jest.spyOn(global, 'Date')
  if (moveDate) {
    dateSpy.mockImplementation(() => moveDate)
  }
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  PlayPassMutation['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  const promise = PlayPassMutation.playPass(args, context, null as any)
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(getGamePlayerSpy.mock.calls).toEqual(
    getGamePlayerResponse
      ? [
          [
            {
              gameId,
              userId,
              status: GameStatus.Playing,
              turn: true,
              label: 'pass round',
            },
          ],
        ]
      : []
  )
  expect(isRoundOverSpy).toHaveBeenCalledTimes(nextPlayerId || gameOver ? 1 : 0)
  expect(isGameOverSpy).toHaveBeenCalledTimes(roundOver ? 1 : 0)
  expect(getPlayerIdForNextRoundSpy.mock.calls).toEqual(
    nextPlayerId && roundOver
      ? [
          [
            {
              game: modifiedGame,
            },
          ],
        ]
      : []
  )
  expect(getNextPlayerIdForCurrentRoundSpy.mock.calls).toEqual(
    nextPlayerId && !roundOver
      ? [
          [
            {
              currentRound: modifiedGame?.round,
              currentTurn: userId,
              players: modifiedGame?.players,
            },
          ],
        ]
      : []
  )
  const gameReturned = (nextPlayerId || gameOver) && !saveResponse
  expect(saveSpy.mock.calls).toEqual(
    nextPlayerId || gameOver
      ? [
          [
            {
              ...updatedGame,
              updated: modifiedGame?.updated,
            },
          ],
        ]
      : []
  )
  expect(gameResolverSpy.mock.calls).toEqual(
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
  expect(gameDeckResolverSpy.mock.calls).toEqual(
    gameReturned && roundOver
      ? gameDecks.map((gameDeck) => {
          return [
            {
              gameDeck,
            },
          ]
        })
      : []
  )
  const publishCalls: any[][] = []
  if (gameReturned) {
    publishCalls.push([
      PubSubEvents.PassPlayed,
      {
        passPlayed: resolvedGame,
      },
    ])
    if (roundOver) {
      for (const resolvedGameDeck of resolvedGameDecks) {
        publishCalls.push([
          PubSubEvents.RoundEndedForDeck,
          {
            roundEndedForDeck: {
              deck: resolvedGameDeck,
              game: resolvedGame,
            },
          },
        ])
      }
    }
  }
  expect(publishSpy.mock.calls).toEqual(publishCalls)
  expect(dateSpy.mock.calls).toEqual(moveDate ? [[]] : [])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
