import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import EventManager from '../../src/graphql/event-manager'
import {
  FactionDbObject,
  GameDbObject,
  GamePlayerDbObject,
  GameStatus,
  RoundResult,
} from '@gwent/graphql-schema/database-typings'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import FactionStore from '../../src/database/stores/faction-store'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import * as gwentUtils from '@gwent/utils'
import MutationUtil from '../../src/graphql/resolvers/mutations/mutation-util'
import { PubSubEvents } from '@gwent/constants'
import TestUtil from '../test-util'

describe('mutation-util', () => {
  describe('constructor', () => {
    const logger = getLogger('test')
    it('sets logPrefix to empty string if none provided', () => {
      expect(
        new MutationUtil({
          logger,
        })
      ).toEqual({
        logger,
        logPrefix: '',
      })
    })
    it('sets logPrefix if  provided', () => {
      const logPrefix = 'prefix'
      expect(
        new MutationUtil({
          logger,
          logPrefix,
        })
      ).toEqual({
        logger,
        logPrefix,
      })
    })
  })
  describe('getNextPlayerIdForCurrentRound', () => {
    const userId = new ObjectId()
    const logPrefix = `playUnit by "${userId}"`
    it('throws error if current player does not have order', () => {
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
    it('throws error if both players have passed in the current round', () => {
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
      const message = 'Could not determine next player for round "1".'
      testGetNextPlayerIdForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 1,
          turn: player1.user,
        }),
        logPrefix,
        expected: Error(message),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
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
    describe('round 1', () => {
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
    })
    describe('round 2', () => {
      it('returns second player in turn order when first players turn and second player has not passed', () => {
        const player1 = TestUtil.getDbGamePlayer({
          user: userId,
          order: 0,
          rounds: [
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({}),
          ],
        })
        const player2 = TestUtil.getDbGamePlayer({
          order: 1,
          rounds: [
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({}),
          ],
        })
        testGetNextPlayerIdForCurrentRound({
          game: TestUtil.getDbGame({
            players: [player1, player2],
            round: 2,
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
          rounds: [
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({}),
          ],
        })
        const player2 = TestUtil.getDbGamePlayer({
          order: 1,
          rounds: [
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({}),
          ],
        })
        testGetNextPlayerIdForCurrentRound({
          game: TestUtil.getDbGame({
            players: [player1, player2],
            round: 2,
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
          rounds: [
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({}),
          ],
        })
        const player2 = TestUtil.getDbGamePlayer({
          order: 1,
          rounds: [
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
          ],
        })
        testGetNextPlayerIdForCurrentRound({
          game: TestUtil.getDbGame({
            players: [player1, player2],
            round: 2,
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
            TestUtil.getDbPlayerRound({}),
          ],
        })
        testGetNextPlayerIdForCurrentRound({
          game: TestUtil.getDbGame({
            players: [player1, player2],
            round: 2,
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
    })
    describe('round 3', () => {
      it('returns second player in turn order when first players turn and second player has not passed', () => {
        const player1 = TestUtil.getDbGamePlayer({
          user: userId,
          order: 0,
          rounds: [
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({}),
          ],
        })
        const player2 = TestUtil.getDbGamePlayer({
          order: 1,
          rounds: [
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({}),
          ],
        })
        testGetNextPlayerIdForCurrentRound({
          game: TestUtil.getDbGame({
            players: [player1, player2],
            round: 3,
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
          rounds: [
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({}),
          ],
        })
        const player2 = TestUtil.getDbGamePlayer({
          order: 1,
          rounds: [
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({}),
          ],
        })
        testGetNextPlayerIdForCurrentRound({
          game: TestUtil.getDbGame({
            players: [player1, player2],
            round: 3,
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
          rounds: [
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({}),
          ],
        })
        const player2 = TestUtil.getDbGamePlayer({
          order: 1,
          rounds: [
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
          ],
        })
        testGetNextPlayerIdForCurrentRound({
          game: TestUtil.getDbGame({
            players: [player1, player2],
            round: 3,
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
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
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
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({}),
          ],
        })
        testGetNextPlayerIdForCurrentRound({
          game: TestUtil.getDbGame({
            players: [player1, player2],
            round: 3,
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
        debugCalls: [[`${logPrefix} isGameOver game is not yet over because there are "2" player(s) with lives left.`]],
        traceCalls: [
          [`${logPrefix} isGameOver currentRound: "0"`],
          [`${logPrefix} isGameOver lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" losses: "0"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" livesLeft: "2"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" losses: "0"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" livesLeft: "2"`],
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
        debugCalls: [[`${logPrefix} isGameOver game is not yet over because there are "2" player(s) with lives left.`]],
        traceCalls: [
          [`${logPrefix} isGameOver currentRound: "1"`],
          [`${logPrefix} isGameOver lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" losses: "1"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" livesLeft: "1"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" losses: "0"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" livesLeft: "2"`],
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
        debugCalls: [[`${logPrefix} isGameOver game is not yet over because there are "2" player(s) with lives left.`]],
        traceCalls: [
          [`${logPrefix} isGameOver currentRound: "1"`],
          [`${logPrefix} isGameOver lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" losses: "0"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" livesLeft: "2"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" losses: "1"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" livesLeft: "1"`],
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
        debugCalls: [[`${logPrefix} isGameOver game is not yet over because there are "2" player(s) with lives left.`]],
        traceCalls: [
          [`${logPrefix} isGameOver currentRound: "1"`],
          [`${logPrefix} isGameOver lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" losses: "1"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" livesLeft: "1"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" losses: "1"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" livesLeft: "1"`],
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
        debugCalls: [[`${logPrefix} isGameOver game is now complete because there are "1" player(s) with lives left.`]],
        traceCalls: [
          [`${logPrefix} isGameOver currentRound: "2"`],
          [`${logPrefix} isGameOver lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" losses: "2"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" livesLeft: "0"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" losses: "0"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" livesLeft: "2"`],
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
        debugCalls: [[`${logPrefix} isGameOver game is now complete because there are "1" player(s) with lives left.`]],
        traceCalls: [
          [`${logPrefix} isGameOver currentRound: "2"`],
          [`${logPrefix} isGameOver lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" losses: "0"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" livesLeft: "2"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" losses: "2"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" livesLeft: "0"`],
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
        debugCalls: [[`${logPrefix} isGameOver game is not yet over because there are "2" player(s) with lives left.`]],
        traceCalls: [
          [`${logPrefix} isGameOver currentRound: "2"`],
          [`${logPrefix} isGameOver lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" losses: "1"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" livesLeft: "1"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" losses: "1"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" livesLeft: "1"`],
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
        debugCalls: [[`${logPrefix} isGameOver game is now complete because there are "1" player(s) with lives left.`]],
        traceCalls: [
          [`${logPrefix} isGameOver currentRound: "3"`],
          [`${logPrefix} isGameOver lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" losses: "2"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" livesLeft: "0"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" losses: "1"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" livesLeft: "1"`],
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
        debugCalls: [[`${logPrefix} isGameOver game is now complete because there are "1" player(s) with lives left.`]],
        traceCalls: [
          [`${logPrefix} isGameOver currentRound: "3"`],
          [`${logPrefix} isGameOver lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" losses: "1"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" livesLeft: "1"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" losses: "2"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" livesLeft: "0"`],
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
        debugCalls: [[`${logPrefix} isGameOver game is now complete because there are "0" player(s) with lives left.`]],
        traceCalls: [
          [`${logPrefix} isGameOver currentRound: "3"`],
          [`${logPrefix} isGameOver lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" losses: "2"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" livesLeft: "0"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" losses: "2"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" livesLeft: "0"`],
        ],
      })
    })
    it('logs to trace if enabled', () => {
      testIsGameOver({
        game,
        logPrefix,
        expected: false,
        debugCalls: [[`${logPrefix} isGameOver game is not yet over because there are "2" player(s) with lives left.`]],
        traceEnabled: true,
        traceCalls: [
          [`${logPrefix} isGameOver currentRound: "0"`],
          [`${logPrefix} isGameOver lives: "${game.config.lives}"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" losses: "0"`],
          [`${logPrefix} isGameOver player "${game.players[0].user}" livesLeft: "2"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" losses: "0"`],
          [`${logPrefix} isGameOver player "${game.players[1].user}" livesLeft: "2"`],
          [
            `${logPrefix} isGameOver playersWithLivesLeft: "${JSON.stringify(
              game.players.map((player) => player.user)
            )}"`,
          ],
        ],
      })
    })
  })
  describe('initializeNewRound', () => {
    it('returns player with round added in new state', () => {
      const player: GamePlayerDbObject = TestUtil.getDbGamePlayer({})
      expect(
        new MutationUtil({
          logger: getLogger('test'),
        }).initializeNewRound({
          players: [player],
        })
      ).toEqual([
        {
          ...player,
          rounds: [
            {
              close: {
                score: 0,
                units: [],
              },
              moves: [],
              passed: false,
              ranged: {
                score: 0,
                units: [],
              },
              score: 0,
              siege: {
                score: 0,
                units: [],
              },
            },
          ],
        },
      ])
    })
  })
  describe('setGameTurnOrder', () => {
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
    it('override class logPrefix if provided as parameter', async () => {
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
      const logPrefixOverride = 'overridden'
      await testSetGameTurnOrder({
        game: game,
        player: game.players[0],
        logPrefix,
        logPrefixOverride,
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
        traceCalls: [[`${logPrefixOverride} setGameTurnOrder no userIds provided, randomizing order`]],
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
})

function testGetNextPlayerIdForCurrentRound({
  game,
  logPrefix,
  expected,
  errorCalls = [],
  debugCalls = [],
  traceEnabled = false,
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
  const logger = getLogger('test')
  const errorSpy = jest.spyOn(logger, 'error').mockImplementation()
  const debugSpy = jest.spyOn(logger, 'debug').mockImplementation()
  const traceSpy = jest.spyOn(logger, 'trace').mockImplementation()
  jest.spyOn(logger, 'isTraceEnabled').mockReturnValue(traceEnabled)

  const mutationUtil = new MutationUtil({
    logger,
    logPrefix,
  })
  if (expected instanceof Error) {
    expect(() =>
      mutationUtil.getNextPlayerIdForCurrentRound({
        currentRound: game.round,
        currentTurn: game.turn,
        players: game.players,
      })
    ).toThrow(expected)
  } else {
    expect(
      mutationUtil.getNextPlayerIdForCurrentRound({
        currentRound: game.round,
        currentTurn: game.turn,
        players: game.players,
      })
    ).toEqual(expected)
  }

  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}

function testGetPlayerIdForNextRound({
  game,
  logPrefix,
  expected,
  debugCalls = [],
  traceEnabled = false,
  traceCalls = [],
}: {
  game: GameDbObject
  logPrefix: string
  expected: ObjectId
  debugCalls?: string[][]
  traceEnabled?: boolean
  traceCalls?: string[][]
}) {
  const logger = getLogger('test')
  const debugSpy = jest.spyOn(logger, 'debug').mockImplementation()
  const traceSpy = jest.spyOn(logger, 'trace').mockImplementation()
  jest.spyOn(logger, 'isTraceEnabled').mockReturnValue(traceEnabled)

  expect(
    new MutationUtil({
      logger,
      logPrefix,
    }).getPlayerIdForNextRound({
      game,
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
  const logger = getLogger('test')
  const debugSpy = jest.spyOn(logger, 'debug').mockImplementation()
  const traceSpy = jest.spyOn(logger, 'trace').mockImplementation()

  expect(
    new MutationUtil({
      logger,
      logPrefix,
    }).isRoundOver({
      game,
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
  traceEnabled = false,
  traceCalls = [],
}: {
  game: GameDbObject
  logPrefix: string
  expected: boolean
  debugCalls?: string[][]
  traceEnabled?: boolean
  traceCalls?: string[][]
}) {
  const logger = getLogger('test')
  const debugSpy = jest.spyOn(logger, 'debug').mockImplementation()
  const traceSpy = jest.spyOn(logger, 'trace').mockImplementation()
  jest.spyOn(logger, 'isTraceEnabled').mockReturnValue(traceEnabled)

  expect(
    new MutationUtil({
      logger,
      logPrefix,
    }).isGameOver({
      game,
    })
  ).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}

async function testSetGameTurnOrder({
  game,
  player,
  logPrefix,
  logPrefixOverride,
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
  logPrefixOverride?: string
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
  const randomPlayers: string[] = []
  for (const player of game.players) {
    randomPlayers.push(player.user.toString())
  }
  randomizeOrderSpy.mockReturnValue(randomPlayers)
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
  const logger = getLogger('test')
  const errorSpy = jest.spyOn(logger, 'error').mockImplementation()
  const warnSpy = jest.spyOn(logger, 'warn').mockImplementation()
  const debugSpy = jest.spyOn(logger, 'debug').mockImplementation()
  const traceSpy = jest.spyOn(logger, 'trace').mockImplementation()
  jest.spyOn(logger, 'isTraceEnabled').mockReturnValue(traceEnabled)

  const promise = new MutationUtil({
    logger,
    logPrefix,
  }).setGameTurnOrder({
    game,
    player,
    userIds,
    logPrefix: logPrefixOverride,
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
        logPrefix: logPrefixOverride || logPrefix,
      },
    ],
  ])
  expect(randomizeOrderSpy.mock.calls).toEqual(randomizeOrderCalls)
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
