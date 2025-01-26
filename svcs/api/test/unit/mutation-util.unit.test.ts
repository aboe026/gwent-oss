import { ObjectId } from 'mongodb'

import EventManager from '../../src/graphql/event-manager'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import { FactionDbObject, GameDbObject, GameStatus, RoundResult } from '@gwent/graphql-schema/database-typings'
import FactionStore from '../../src/database/stores/faction-store'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import * as gwentUtils from '@gwent/utils'
import MutationUtil, { GamePlayerResponse } from '../../src/graphql/resolvers/mutations/mutation-util'
import { PubSubEvents } from '@gwent/constants'
import TestUtil from '../test-util'

describe('mutation-util', () => {
  describe('getGamePlayer', () => {
    const userId = new ObjectId()
    const logPrefix = `playUnit by "${userId}"`
    it('returns error if gameId invalid', async () => {
      const gameId = 'invalid'
      const message = `Game ID "${gameId}" is not a valid MongoDB ObjectId.`
      await testGetGamePlayer({
        gameId,
        userId,
        logPrefix,
        expected: Error(message),
        warnCalls: [[`${logPrefix} getGamePlayer failed: ${message}`]],
      })
    })
    it('returns error if no game found', async () => {
      const gameId = new ObjectId().toString()
      const message = `Game with ID "${gameId}" does not exist.`
      await testGetGamePlayer({
        gameId,
        userId,
        logPrefix,
        expected: Error(message),
        warnCalls: [[`${logPrefix} getGamePlayer failed: ${message}`]],
      })
    })
    it('returns error if player not on game', async () => {
      const gameId = new ObjectId().toString()
      const message = `Not a player on game "${gameId}".`
      await testGetGamePlayer({
        gameId,
        userId,
        logPrefix,
        getGameResponse: TestUtil.getDbGame({
          id: gameId,
        }),
        expected: Error(message),
        warnCalls: [[`${logPrefix} getGamePlayer failed: ${message}`]],
      })
    })
    it('returns error if more than 1 player with userId found', async () => {
      const gameId = new ObjectId().toString()
      const message = `Found more than 1 player with ID "${userId}" on game "${gameId}"`
      const game = TestUtil.getDbGame({
        id: gameId,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
        ],
      })
      await testGetGamePlayer({
        gameId,
        userId,
        logPrefix,
        getGameResponse: game,
        expected: Error(`${message}.`),
        errorCalls: [[`${logPrefix} getGamePlayer failed: ${message}: "${JSON.stringify(game.players)}"`]],
      })
    })
    it('returns error if game is wrong status', async () => {
      const gameId = new ObjectId().toString()
      const label = 'do something'
      const requiredStatus = GameStatus.Playing
      const actualStatus = GameStatus.Decking
      const message = `Invalid game status "${actualStatus}": Can only ${label} for game with status "${requiredStatus}".`
      const game = TestUtil.getDbGame({
        id: gameId,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
        ],
      })
      await testGetGamePlayer({
        gameId,
        userId,
        logPrefix,
        label,
        status: requiredStatus,
        getGameResponse: game,
        expected: Error(message),
        statusCalls: [[game]],
        warnCalls: [[`${logPrefix} getGamePlayer failed: ${message}`]],
      })
    })
    it('returns error if it is not users turn when required', async () => {
      const gameId = new ObjectId().toString()
      const label = 'do something'
      const message = `Cannot ${label} when it is not your turn.`
      await testGetGamePlayer({
        gameId,
        userId,
        logPrefix,
        label,
        turn: true,
        getGameResponse: TestUtil.getDbGame({
          id: gameId,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
            }),
          ],
        }),
        expected: Error(message),
        warnCalls: [[`${logPrefix} getGamePlayer failed: ${message}`]],
      })
    })
    it('returns game and player if no errors', async () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
        ],
      })
      await testGetGamePlayer({
        gameId: game._id.toString(),
        userId,
        logPrefix,
        getGameResponse: game,
        expected: {
          game,
          player: game.players[0],
        },
      })
    })
    it('logs to trace if enabled', async () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
        ],
      })
      await testGetGamePlayer({
        gameId: game._id.toString(),
        userId,
        logPrefix,
        getGameResponse: game,
        expected: {
          game,
          player: game.players[0],
        },
        traceEnabled: true,
      })
    })
  })
  describe('getNextPlayerIdForCurrentRound', () => {
    const userId = new ObjectId()
    const logPrefix = `playUnit by "${userId}"`
    it('returns error if current player does not have order', () => {
      const player = TestUtil.getDbGamePlayer({
        user: userId,
      })
      const message = `Could not determine order of current player "${userId}": "undefined".`
      testGetNextPlayerIdForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player],
          turn: player.user,
        }),
        logPrefix,
        expected: Error(message),
        errorCalls: [[`${logPrefix} getNextPlayerIdForCurrentRound failed: ${message}`]],
        traceCalls: [[`${logPrefix} getNextPlayerIdForCurrentRound currentPlayerOrder: "undefined"`]],
      })
    })
    it('returns second player in turn order when first players turn and second player has not passed', () => {
      const player1 = TestUtil.getDbGamePlayer({
        user: userId,
        order: 0,
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const player2 = TestUtil.getDbGamePlayer({
        order: 1,
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      testGetNextPlayerIdForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 1,
          turn: player1.user,
        }),
        logPrefix,
        expected: player2.user,
        debugCalls: [
          [
            `${logPrefix} getNextPlayerIdForCurrentRound player "${player2.user}" has not yet passed, setting as next player.`,
          ],
        ],
        traceCalls: [
          [`${logPrefix} getNextPlayerIdForCurrentRound currentPlayerOrder: "0"`],
          [`${logPrefix} getNextPlayerIdForCurrentRound i: "0"`],
        ],
      })
    })
    it('returns first player in turn order when second players turn and first player has not passed', () => {
      const player1 = TestUtil.getDbGamePlayer({
        user: userId,
        order: 0,
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const player2 = TestUtil.getDbGamePlayer({
        order: 1,
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      testGetNextPlayerIdForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 1,
          turn: player2.user,
        }),
        logPrefix,
        expected: player1.user,
        debugCalls: [
          [
            `${logPrefix} getNextPlayerIdForCurrentRound player "${player1.user}" has not yet passed, setting as next player.`,
          ],
        ],
        traceCalls: [
          [`${logPrefix} getNextPlayerIdForCurrentRound currentPlayerOrder: "1"`],
          [`${logPrefix} getNextPlayerIdForCurrentRound i: "0"`],
        ],
      })
    })
    it('returns first player in turn order when first players turn and second player has passed', () => {
      const player1 = TestUtil.getDbGamePlayer({
        user: userId,
        order: 0,
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const player2 = TestUtil.getDbGamePlayer({
        order: 1,
        rounds: [
          TestUtil.getDbPlayerRound({
            passed: true,
          }),
        ],
      })
      testGetNextPlayerIdForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 1,
          turn: player1.user,
        }),
        logPrefix,
        expected: player1.user,
        debugCalls: [
          [
            `${logPrefix} getNextPlayerIdForCurrentRound player "${player1.user}" has not yet passed, setting as next player.`,
          ],
        ],
        traceCalls: [
          [`${logPrefix} getNextPlayerIdForCurrentRound currentPlayerOrder: "0"`],
          [`${logPrefix} getNextPlayerIdForCurrentRound i: "0"`],
          [
            `${logPrefix} getNextPlayerIdForCurrentRound player "${player2.user}" has already passed, ignoring for next player.`,
          ],
          [`${logPrefix} getNextPlayerIdForCurrentRound i: "1"`],
        ],
      })
    })
    it('returns second player in turn order when second players turn and first player has passed', () => {
      const player1 = TestUtil.getDbGamePlayer({
        user: userId,
        order: 0,
        rounds: [
          TestUtil.getDbPlayerRound({
            passed: true,
          }),
        ],
      })
      const player2 = TestUtil.getDbGamePlayer({
        order: 1,
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      testGetNextPlayerIdForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 1,
          turn: player2.user,
        }),
        logPrefix,
        expected: player2.user,
        debugCalls: [
          [
            `${logPrefix} getNextPlayerIdForCurrentRound player "${player2.user}" has not yet passed, setting as next player.`,
          ],
        ],
        traceCalls: [
          [`${logPrefix} getNextPlayerIdForCurrentRound currentPlayerOrder: "1"`],
          [`${logPrefix} getNextPlayerIdForCurrentRound i: "0"`],
          [
            `${logPrefix} getNextPlayerIdForCurrentRound player "${player1.user}" has already passed, ignoring for next player.`,
          ],
          [`${logPrefix} getNextPlayerIdForCurrentRound i: "1"`],
        ],
      })
    })
    it('returns second player in turn order when first players turn and both have passed', () => {
      const player1 = TestUtil.getDbGamePlayer({
        user: userId,
        order: 0,
        rounds: [
          TestUtil.getDbPlayerRound({
            passed: true,
          }),
        ],
      })
      const player2 = TestUtil.getDbGamePlayer({
        order: 1,
        rounds: [
          TestUtil.getDbPlayerRound({
            passed: true,
          }),
        ],
      })
      testGetNextPlayerIdForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 1,
          turn: player1.user,
        }),
        logPrefix,
        expected: player2.user,
        errorCalls: [
          [
            `${logPrefix} getNextPlayerIdForCurrentRound No user eligible to be next player for round "1", getting player to start round "2" based off game turn order`,
          ],
        ],
        traceCalls: [
          [`${logPrefix} getNextPlayerIdForCurrentRound currentPlayerOrder: "0"`],
          [`${logPrefix} getNextPlayerIdForCurrentRound i: "0"`],
          [
            `${logPrefix} getNextPlayerIdForCurrentRound player "${player2.user}" has already passed, ignoring for next player.`,
          ],
          [`${logPrefix} getNextPlayerIdForCurrentRound i: "1"`],
          [
            `${logPrefix} getNextPlayerIdForCurrentRound player "${player1.user}" has already passed, ignoring for next player.`,
          ],
        ],
      })
    })
    it('returns second player in turn order when second players turn and both have passed', () => {
      const player1 = TestUtil.getDbGamePlayer({
        user: userId,
        order: 0,
        rounds: [
          TestUtil.getDbPlayerRound({
            passed: true,
          }),
        ],
      })
      const player2 = TestUtil.getDbGamePlayer({
        order: 1,
        rounds: [
          TestUtil.getDbPlayerRound({
            passed: true,
          }),
        ],
      })
      testGetNextPlayerIdForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 1,
          turn: player2.user,
        }),
        logPrefix,
        expected: player2.user,
        errorCalls: [
          [
            `${logPrefix} getNextPlayerIdForCurrentRound No user eligible to be next player for round "1", getting player to start round "2" based off game turn order`,
          ],
        ],
        traceCalls: [
          [`${logPrefix} getNextPlayerIdForCurrentRound currentPlayerOrder: "1"`],
          [`${logPrefix} getNextPlayerIdForCurrentRound i: "0"`],
          [
            `${logPrefix} getNextPlayerIdForCurrentRound player "${player1.user}" has already passed, ignoring for next player.`,
          ],
          [`${logPrefix} getNextPlayerIdForCurrentRound i: "1"`],
          [
            `${logPrefix} getNextPlayerIdForCurrentRound player "${player2.user}" has already passed, ignoring for next player.`,
          ],
        ],
      })
    })
    it('logs to trace if enabled', () => {
      const player1 = TestUtil.getDbGamePlayer({
        user: userId,
        order: 0,
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const player2 = TestUtil.getDbGamePlayer({
        order: 1,
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      testGetNextPlayerIdForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 1,
          turn: player1.user,
        }),
        logPrefix,
        expected: player2.user,
        traceEnabled: true,
        debugCalls: [
          [
            `${logPrefix} getNextPlayerIdForCurrentRound player "${player2.user}" has not yet passed, setting as next player.`,
          ],
        ],
        traceCalls: [
          [`${logPrefix} getNextPlayerIdForCurrentRound usersByOrder: "${JSON.stringify([player1, player2])}"`],
          [`${logPrefix} getNextPlayerIdForCurrentRound currentPlayerOrder: "0"`],
          [`${logPrefix} getNextPlayerIdForCurrentRound i: "0"`],
          [`${logPrefix} getNextPlayerIdForCurrentRound potentialNextPlayer: "${JSON.stringify(player2)}"`],
        ],
      })
    })
    // TODO: test for other rounds (2, 3)
  })
  describe('getPlayerIdForNextRound', () => {
    const userId = new ObjectId()
    const gameId = new ObjectId()
    const logPrefix = `playPass by "${userId}" on game "${gameId}"`
    it('returns last round winner if first player won', () => {
      const game = TestUtil.getDbGame({
        id: gameId,
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
            rounds: [
              TestUtil.getDbPlayerRound({
                result: RoundResult.Won,
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                result: RoundResult.Lost,
              }),
            ],
          }),
        ],
      })
      testGetPlayerIdForNextRound({
        game,
        logPrefix,
        expected: userId,
        debugCalls: [
          [
            `${logPrefix} getPlayerIdForNextRound single user "${userId}" won round "1", setting them as player for round "2"`,
          ],
        ],
        traceCalls: [[`${logPrefix} getPlayerIdForNextRound nextRound: "2"`]],
      })
    })
    it('returns last round winner if last player won', () => {
      const game = TestUtil.getDbGame({
        id: gameId,
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                result: RoundResult.Lost,
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            user: userId,
            rounds: [
              TestUtil.getDbPlayerRound({
                result: RoundResult.Won,
              }),
            ],
          }),
        ],
      })
      testGetPlayerIdForNextRound({
        game,
        logPrefix,
        expected: userId,
        debugCalls: [
          [
            `${logPrefix} getPlayerIdForNextRound single user "${userId}" won round "1", setting them as player for round "2"`,
          ],
        ],
        traceCalls: [[`${logPrefix} getPlayerIdForNextRound nextRound: "2"`]],
      })
    })
    it('returns first game order player if both drew last round', () => {
      const game = TestUtil.getDbGame({
        id: gameId,
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            order: 0,
            rounds: [
              TestUtil.getDbPlayerRound({
                result: RoundResult.Drew,
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            user: userId,
            order: 1,
            rounds: [
              TestUtil.getDbPlayerRound({
                result: RoundResult.Drew,
              }),
            ],
          }),
        ],
      })
      testGetPlayerIdForNextRound({
        game,
        logPrefix,
        expected: userId,
        debugCalls: [
          [
            `${logPrefix} getPlayerIdForNextRound no single user won round "1", setting next player as "${userId}" for round "2" based on game order`,
          ],
        ],
        traceCalls: [[`${logPrefix} getPlayerIdForNextRound nextRound: "2"`]],
      })
    })
    it('returns second game order player if both drew last round', () => {
      const game = TestUtil.getDbGame({
        id: gameId,
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            order: 1,
            user: userId,
            rounds: [
              TestUtil.getDbPlayerRound({
                result: RoundResult.Drew,
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            order: 0,
            rounds: [
              TestUtil.getDbPlayerRound({
                result: RoundResult.Drew,
              }),
            ],
          }),
        ],
      })
      testGetPlayerIdForNextRound({
        game,
        logPrefix,
        expected: userId,
        debugCalls: [
          [
            `${logPrefix} getPlayerIdForNextRound no single user won round "1", setting next player as "${userId}" for round "2" based on game order`,
          ],
        ],
        traceCalls: [[`${logPrefix} getPlayerIdForNextRound nextRound: "2"`]],
      })
    })
    it('returns last round winner if first player won', () => {
      const game = TestUtil.getDbGame({
        id: gameId,
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
            rounds: [
              TestUtil.getDbPlayerRound({
                result: RoundResult.Won,
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                result: RoundResult.Lost,
              }),
            ],
          }),
        ],
      })
      testGetPlayerIdForNextRound({
        game,
        logPrefix,
        expected: userId,
        debugCalls: [
          [
            `${logPrefix} getPlayerIdForNextRound single user "${userId}" won round "1", setting them as player for round "2"`,
          ],
        ],
        traceEnabled: true,
        traceCalls: [
          [`${logPrefix} getPlayerIdForNextRound nextRound: "2"`],
          [
            `${logPrefix} getPlayerIdForNextRound usersByOrder: "${JSON.stringify([
              game.players[0],
              game.players[1],
            ])}"`,
          ],
          [`${logPrefix} getPlayerIdForNextRound roundWinners: "${JSON.stringify([userId])}"`],
        ],
      })
    })
  })
  describe('isRoundOver', () => {
    const userId = new ObjectId()
    const opponentId = new ObjectId()
    const gameId = new ObjectId()
    const logPrefix = `playPass by "${userId}" on game "${gameId}"`
    it('returns false if neither player has passed', () => {
      testIsRoundOver({
        game: TestUtil.getDbGame({
          id: gameId,
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [TestUtil.getDbPlayerRound({})],
            }),
            TestUtil.getDbGamePlayer({
              user: opponentId,
              rounds: [TestUtil.getDbPlayerRound({})],
            }),
          ],
        }),
        logPrefix,
        expected: false,
        debugCalls: [[`${logPrefix} isRoundOver player "${userId}" has not passed, so round "1" is not over`]],
        traceCalls: [
          [`${logPrefix} isRoundOver currentRound: "1"`],
          [`${logPrefix} isRoundOver player "${userId}" round "1" passed: "false"`],
        ],
      })
    })
    it('returns false if only first player has passed', () => {
      testIsRoundOver({
        game: TestUtil.getDbGame({
          id: gameId,
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  passed: true,
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              user: opponentId,
              rounds: [TestUtil.getDbPlayerRound({})],
            }),
          ],
        }),
        logPrefix,
        expected: false,
        debugCalls: [[`${logPrefix} isRoundOver player "${opponentId}" has not passed, so round "1" is not over`]],
        traceCalls: [
          [`${logPrefix} isRoundOver currentRound: "1"`],
          [`${logPrefix} isRoundOver player "${userId}" round "1" passed: "true"`],
          [`${logPrefix} isRoundOver player "${opponentId}" round "1" passed: "false"`],
        ],
      })
    })
    it('returns false if only second player has passed', () => {
      testIsRoundOver({
        game: TestUtil.getDbGame({
          id: gameId,
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [TestUtil.getDbPlayerRound({})],
            }),
            TestUtil.getDbGamePlayer({
              user: opponentId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  passed: true,
                }),
              ],
            }),
          ],
        }),
        logPrefix,
        expected: false,
        debugCalls: [[`${logPrefix} isRoundOver player "${userId}" has not passed, so round "1" is not over`]],
        traceCalls: [
          [`${logPrefix} isRoundOver currentRound: "1"`],
          [`${logPrefix} isRoundOver player "${userId}" round "1" passed: "false"`],
        ],
      })
    })
    it('returns false if both players have passed', () => {
      testIsRoundOver({
        game: TestUtil.getDbGame({
          id: gameId,
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  passed: true,
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              user: opponentId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  passed: true,
                }),
              ],
            }),
          ],
        }),
        logPrefix,
        expected: true,
        debugCalls: [[`${logPrefix} isRoundOver all players have passed, so round "1" is over`]],
        traceCalls: [
          [`${logPrefix} isRoundOver currentRound: "1"`],
          [`${logPrefix} isRoundOver player "${userId}" round "1" passed: "true"`],
          [`${logPrefix} isRoundOver player "${opponentId}" round "1" passed: "true"`],
        ],
      })
    })
  })
  describe('isGameOver', () => {
    const game = TestUtil.getDbGame({})
    const logPrefix = `playPass by "${game.creator}"`
    it('returns false if no rounds have been played', () => {
      testIsGameOver({
        game,
        logPrefix,
        expected: false,
        debugCalls: [
          [
            `${logPrefix} isGameOver game "${game._id}" is not yet over because there are "2" player(s) with lives left.`,
          ],
        ],
        traceCalls: [
          [`${logPrefix} isGameOver game "${game._id}" currentRound: "0"`],
          [`${logPrefix} isGameOver game "${game._id}" lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" losses: "0"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" livesLeft: "2"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" losses: "0"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" livesLeft: "2"`],
        ],
      })
    })
    it('returns false if 1 rounds played with 1 loss for first player', () => {
      testIsGameOver({
        game: {
          ...game,
          round: 1,
          players: [
            {
              ...game.players[0],
              rounds: [
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Lost,
                }),
              ],
            },
            game.players[1],
          ],
        },
        logPrefix,
        expected: false,
        debugCalls: [
          [
            `${logPrefix} isGameOver game "${game._id}" is not yet over because there are "2" player(s) with lives left.`,
          ],
        ],
        traceCalls: [
          [`${logPrefix} isGameOver game "${game._id}" currentRound: "1"`],
          [`${logPrefix} isGameOver game "${game._id}" lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" losses: "1"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" livesLeft: "1"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" losses: "0"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" livesLeft: "2"`],
        ],
      })
    })
    it('returns false if 1 rounds played with 1 loss for second player', () => {
      testIsGameOver({
        game: {
          ...game,
          round: 1,
          players: [
            game.players[0],
            {
              ...game.players[1],
              rounds: [
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Lost,
                }),
              ],
            },
          ],
        },
        logPrefix,
        expected: false,
        debugCalls: [
          [
            `${logPrefix} isGameOver game "${game._id}" is not yet over because there are "2" player(s) with lives left.`,
          ],
        ],
        traceCalls: [
          [`${logPrefix} isGameOver game "${game._id}" currentRound: "1"`],
          [`${logPrefix} isGameOver game "${game._id}" lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" losses: "0"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" livesLeft: "2"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" losses: "1"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" livesLeft: "1"`],
        ],
      })
    })
    it('returns false if 1 rounds played with 1 draw for each player', () => {
      testIsGameOver({
        game: {
          ...game,
          round: 1,
          players: [
            {
              ...game.players[0],
              rounds: [
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Drew,
                }),
              ],
            },
            {
              ...game.players[1],
              rounds: [
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Drew,
                }),
              ],
            },
          ],
        },
        logPrefix,
        expected: false,
        debugCalls: [
          [
            `${logPrefix} isGameOver game "${game._id}" is not yet over because there are "2" player(s) with lives left.`,
          ],
        ],
        traceCalls: [
          [`${logPrefix} isGameOver game "${game._id}" currentRound: "1"`],
          [`${logPrefix} isGameOver game "${game._id}" lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" losses: "1"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" livesLeft: "1"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" losses: "1"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" livesLeft: "1"`],
        ],
      })
    })
    it('returns true if 2 rounds played with 2 losses for first player', () => {
      testIsGameOver({
        game: {
          ...game,
          round: 2,
          players: [
            {
              ...game.players[0],
              rounds: [
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Lost,
                }),
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Lost,
                }),
              ],
            },
            game.players[1],
          ],
        },
        logPrefix,
        expected: true,
        debugCalls: [
          [
            `${logPrefix} isGameOver game "${game._id}" is now complete because there are "1" player(s) with lives left.`,
          ],
        ],
        traceCalls: [
          [`${logPrefix} isGameOver game "${game._id}" currentRound: "2"`],
          [`${logPrefix} isGameOver game "${game._id}" lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" losses: "2"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" livesLeft: "0"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" losses: "0"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" livesLeft: "2"`],
        ],
      })
    })
    it('returns true if 2 rounds played with 2 losses for second player', () => {
      testIsGameOver({
        game: {
          ...game,
          round: 2,
          players: [
            game.players[0],
            {
              ...game.players[1],
              rounds: [
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Lost,
                }),
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Lost,
                }),
              ],
            },
          ],
        },
        logPrefix,
        expected: true,
        debugCalls: [
          [
            `${logPrefix} isGameOver game "${game._id}" is now complete because there are "1" player(s) with lives left.`,
          ],
        ],
        traceCalls: [
          [`${logPrefix} isGameOver game "${game._id}" currentRound: "2"`],
          [`${logPrefix} isGameOver game "${game._id}" lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" losses: "0"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" livesLeft: "2"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" losses: "2"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" livesLeft: "0"`],
        ],
      })
    })
    it('returns false if 2 rounds played with 1 loss for each player', () => {
      testIsGameOver({
        game: {
          ...game,
          round: 2,
          players: [
            {
              ...game.players[0],
              rounds: [
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Lost,
                }),
                TestUtil.getDbPlayerRound({}),
              ],
            },
            {
              ...game.players[1],
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Lost,
                }),
              ],
            },
          ],
        },
        logPrefix,
        expected: false,
        debugCalls: [
          [
            `${logPrefix} isGameOver game "${game._id}" is not yet over because there are "2" player(s) with lives left.`,
          ],
        ],
        traceCalls: [
          [`${logPrefix} isGameOver game "${game._id}" currentRound: "2"`],
          [`${logPrefix} isGameOver game "${game._id}" lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" losses: "1"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" livesLeft: "1"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" losses: "1"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" livesLeft: "1"`],
        ],
      })
    })
    it('returns true if 3 rounds played with 2 losses for first player', () => {
      testIsGameOver({
        game: {
          ...game,
          round: 3,
          players: [
            {
              ...game.players[0],
              rounds: [
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Lost,
                }),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Lost,
                }),
              ],
            },
            {
              ...game.players[1],
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Lost,
                }),
              ],
            },
          ],
        },
        logPrefix,
        expected: true,
        debugCalls: [
          [
            `${logPrefix} isGameOver game "${game._id}" is now complete because there are "1" player(s) with lives left.`,
          ],
        ],
        traceCalls: [
          [`${logPrefix} isGameOver game "${game._id}" currentRound: "3"`],
          [`${logPrefix} isGameOver game "${game._id}" lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" losses: "2"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" livesLeft: "0"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" losses: "1"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" livesLeft: "1"`],
        ],
      })
    })
    it('returns true if 3 rounds played with 2 losses for second player', () => {
      testIsGameOver({
        game: {
          ...game,
          round: 3,
          players: [
            {
              ...game.players[0],
              rounds: [
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Lost,
                }),
                TestUtil.getDbPlayerRound({}),
              ],
            },
            {
              ...game.players[1],
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Lost,
                }),
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Lost,
                }),
              ],
            },
          ],
        },
        logPrefix,
        expected: true,
        debugCalls: [
          [
            `${logPrefix} isGameOver game "${game._id}" is now complete because there are "1" player(s) with lives left.`,
          ],
        ],
        traceCalls: [
          [`${logPrefix} isGameOver game "${game._id}" currentRound: "3"`],
          [`${logPrefix} isGameOver game "${game._id}" lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" losses: "1"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" livesLeft: "1"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" losses: "2"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" livesLeft: "0"`],
        ],
      })
    })
    it('returns true if 3 rounds played with 2 losses for each player', () => {
      testIsGameOver({
        game: {
          ...game,
          round: 3,
          players: [
            {
              ...game.players[0],
              rounds: [
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Lost,
                }),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Drew,
                }),
              ],
            },
            {
              ...game.players[1],
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Lost,
                }),
                TestUtil.getDbPlayerRound({
                  result: RoundResult.Drew,
                }),
              ],
            },
          ],
        },
        logPrefix,
        expected: true,
        debugCalls: [
          [
            `${logPrefix} isGameOver game "${game._id}" is now complete because there are "0" player(s) with lives left.`,
          ],
        ],
        traceCalls: [
          [`${logPrefix} isGameOver game "${game._id}" currentRound: "3"`],
          [`${logPrefix} isGameOver game "${game._id}" lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" losses: "2"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" livesLeft: "0"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" losses: "2"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" livesLeft: "0"`],
        ],
      })
    })
    it('logs to trace if enabled', () => {
      testIsGameOver({
        game,
        logPrefix,
        expected: false,
        debugCalls: [
          [
            `${logPrefix} isGameOver game "${game._id}" is not yet over because there are "2" player(s) with lives left.`,
          ],
        ],
        traceEnabled: true,
        traceCalls: [
          [`${logPrefix} isGameOver game "${game._id}" currentRound: "0"`],
          [`${logPrefix} isGameOver game "${game._id}" lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" losses: "0"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[0].user}" livesLeft: "2"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" losses: "0"`],
          [`${logPrefix} isGameOver game "${game._id}" player "${game.players[1].user}" livesLeft: "2"`],
          [
            `${logPrefix} isGameOver game "${game._id}" playersWithLivesLeft: "${JSON.stringify(
              game.players.map((player) => player.user)
            )}"`,
          ],
        ],
      })
    })
  })
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
        debugCalls: [[`${logPrefix} failed: ${message}`]],
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
        debugCalls: [[`${logPrefix} failed: ${message}`]],
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

async function testGetGamePlayer({
  gameId,
  userId,
  status,
  logPrefix,
  label,
  turn,
  getGameResponse,
  getStatusResponse,
  expected,
  statusCalls = [],
  errorCalls = [],
  warnCalls = [],
  traceEnabled,
}: {
  gameId: string
  userId: ObjectId
  logPrefix: string
  status?: GameStatus
  label?: string
  turn?: boolean
  getGameResponse?: GameDbObject | undefined
  getStatusResponse?: GameStatus
  expected: GamePlayerResponse | Error
  statusCalls?: GameDbObject[][]
  errorCalls?: string[][]
  warnCalls?: string[][]
  traceEnabled?: boolean
}) {
  const getGameSpy = jest.spyOn(GameStore, 'getById').mockResolvedValue(getGameResponse)
  const getStatusSpy = jest.spyOn(GameResolver, 'getStatus')
  if (getStatusResponse) {
    getStatusSpy.mockReturnValue(getStatusResponse)
  }
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  MutationUtil['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(
    MutationUtil.getGamePlayer({
      gameId,
      userId,
      logPrefix,
      status,
      label,
      turn,
    })
  ).resolves.toEqual(expected)

  expect(getGameSpy.mock.calls).toEqual(
    ObjectId.isValid(gameId)
      ? [
          [
            {
              id: gameId,
            },
          ],
        ]
      : []
  )
  expect(getStatusSpy.mock.calls).toEqual(statusCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} getGamePlayer game: "${JSON.stringify(getGameResponse)}"`],
          [`${logPrefix} getGamePlayer game "${gameId}" players: "${JSON.stringify(getGameResponse?.players)}"`],
        ]
      : []
  )
}

function testGetNextPlayerIdForCurrentRound({
  game,
  logPrefix,
  expected,
  errorCalls = [],
  debugCalls = [],
  traceEnabled,
  traceCalls = [],
}: {
  game: GameDbObject
  logPrefix: string
  expected: ObjectId | Error
  errorCalls?: string[][]
  debugCalls?: string[][]
  traceEnabled?: boolean
  traceCalls?: string[][]
}) {
  const errorSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  MutationUtil['logger'] = {
    error: errorSpy,
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  expect(
    MutationUtil.getNextPlayerIdForCurrentRound({
      game,
      logPrefix,
    })
  ).toEqual(expected)

  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}

function testGetPlayerIdForNextRound({
  game,
  logPrefix,
  expected,
  debugCalls = [],
  traceEnabled,
  traceCalls = [],
}: {
  game: GameDbObject
  logPrefix: string
  expected: ObjectId
  debugCalls?: string[][]
  traceEnabled?: boolean
  traceCalls?: string[][]
}) {
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  MutationUtil['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  expect(
    MutationUtil.getPlayerIdForNextRound({
      game,
      logPrefix,
    })
  ).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}

function testIsRoundOver({
  game,
  logPrefix,
  expected,
  debugCalls = [],
  traceCalls = [],
}: {
  game: GameDbObject
  logPrefix: string
  expected: boolean
  debugCalls?: string[][]
  traceCalls?: string[][]
}) {
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  MutationUtil['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
  } as any

  expect(
    MutationUtil.isRoundOver({
      game,
      logPrefix,
    })
  ).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}

function testIsGameOver({
  game,
  logPrefix,
  expected,
  debugCalls = [],
  traceEnabled,
  traceCalls = [],
}: {
  game: GameDbObject
  logPrefix: string
  expected: boolean
  debugCalls?: string[][]
  traceEnabled?: boolean
  traceCalls?: string[][]
}) {
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  MutationUtil['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  expect(
    MutationUtil.isGameOver({
      game,
      logPrefix,
    })
  ).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}

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
  debugCalls = [],
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
  debugCalls?: any[][]
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
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  MutationUtil['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    debug: debugSpy,
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
  expect(debugSpy.mock.calls).toEqual(debugCalls)
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
