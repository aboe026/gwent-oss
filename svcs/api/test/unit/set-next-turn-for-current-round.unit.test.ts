import { ObjectId } from 'mongodb'

import deepClone from '../util/deep-clone'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import SetNextTurnForCurrentRound from '../../src/graphql/resolvers/mutations/util/set-next-turn-for-current-round'
import TestUtil from '../util/test-util'

describe('set-next-turn-for-current-round', () => {
  const userId = new ObjectId()
  const logPrefix = `playUnit by "${userId}"`
  it('throws error if current player does not have order', () => {
    const player = TestUtil.getDbGamePlayer({
      user: userId,
    })
    const message = `Could not determine order of current player "${userId}": "undefined".`
    testSetNextTurnForCurrentRound({
      game: TestUtil.getDbGame({
        players: [player],
        turn: player.user,
      }),
      logPrefix,
      expected: Error(message),
      errorCalls: [[`${logPrefix} failed: ${message}`]],
      traceCalls: [[`${logPrefix} currentPlayerOrder: "undefined"`]],
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
    testSetNextTurnForCurrentRound({
      game: TestUtil.getDbGame({
        players: [player1, player2],
        round: 1,
        turn: player1.user,
      }),
      logPrefix,
      expected: Error(message),
      errorCalls: [[`${logPrefix} failed: ${message}`]],
      traceCalls: [
        [`${logPrefix} currentPlayerOrder: "0"`],
        [`${logPrefix} i: "0"`],
        [`${logPrefix} player "${player2.user}" has already passed, ignoring for next player.`],
        [`${logPrefix} i: "1"`],
        [`${logPrefix} player "${player1.user}" has already passed, ignoring for next player.`],
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
      testSetNextTurnForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 1,
          turn: player1.user,
        }),
        logPrefix,
        expected: player2.user,
        debugCalls: [[`${logPrefix} player "${player2.user}" has not yet passed, setting as next player.`]],
        traceCalls: [[`${logPrefix} currentPlayerOrder: "0"`], [`${logPrefix} i: "0"`]],
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
      testSetNextTurnForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 1,
          turn: player2.user,
        }),
        logPrefix,
        expected: player1.user,
        debugCalls: [[`${logPrefix} player "${player1.user}" has not yet passed, setting as next player.`]],
        traceCalls: [[`${logPrefix} currentPlayerOrder: "1"`], [`${logPrefix} i: "0"`]],
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
      testSetNextTurnForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 1,
          turn: player1.user,
        }),
        logPrefix,
        expected: player1.user,
        debugCalls: [[`${logPrefix} player "${player1.user}" has not yet passed, setting as next player.`]],
        traceCalls: [
          [`${logPrefix} currentPlayerOrder: "0"`],
          [`${logPrefix} i: "0"`],
          [`${logPrefix} player "${player2.user}" has already passed, ignoring for next player.`],
          [`${logPrefix} i: "1"`],
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
      testSetNextTurnForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 1,
          turn: player2.user,
        }),
        logPrefix,
        expected: player2.user,
        debugCalls: [[`${logPrefix} player "${player2.user}" has not yet passed, setting as next player.`]],
        traceCalls: [
          [`${logPrefix} currentPlayerOrder: "1"`],
          [`${logPrefix} i: "0"`],
          [`${logPrefix} player "${player1.user}" has already passed, ignoring for next player.`],
          [`${logPrefix} i: "1"`],
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
      testSetNextTurnForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 2,
          turn: player1.user,
        }),
        logPrefix,
        expected: player2.user,
        debugCalls: [[`${logPrefix} player "${player2.user}" has not yet passed, setting as next player.`]],
        traceCalls: [[`${logPrefix} currentPlayerOrder: "0"`], [`${logPrefix} i: "0"`]],
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
      testSetNextTurnForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 2,
          turn: player2.user,
        }),
        logPrefix,
        expected: player1.user,
        debugCalls: [[`${logPrefix} player "${player1.user}" has not yet passed, setting as next player.`]],
        traceCalls: [[`${logPrefix} currentPlayerOrder: "1"`], [`${logPrefix} i: "0"`]],
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
      testSetNextTurnForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 2,
          turn: player1.user,
        }),
        logPrefix,
        expected: player1.user,
        debugCalls: [[`${logPrefix} player "${player1.user}" has not yet passed, setting as next player.`]],
        traceCalls: [
          [`${logPrefix} currentPlayerOrder: "0"`],
          [`${logPrefix} i: "0"`],
          [`${logPrefix} player "${player2.user}" has already passed, ignoring for next player.`],
          [`${logPrefix} i: "1"`],
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
      testSetNextTurnForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 2,
          turn: player2.user,
        }),
        logPrefix,
        expected: player2.user,
        debugCalls: [[`${logPrefix} player "${player2.user}" has not yet passed, setting as next player.`]],
        traceCalls: [
          [`${logPrefix} currentPlayerOrder: "1"`],
          [`${logPrefix} i: "0"`],
          [`${logPrefix} player "${player1.user}" has already passed, ignoring for next player.`],
          [`${logPrefix} i: "1"`],
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
      testSetNextTurnForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 3,
          turn: player1.user,
        }),
        logPrefix,
        expected: player2.user,
        debugCalls: [[`${logPrefix} player "${player2.user}" has not yet passed, setting as next player.`]],
        traceCalls: [[`${logPrefix} currentPlayerOrder: "0"`], [`${logPrefix} i: "0"`]],
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
      testSetNextTurnForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 3,
          turn: player2.user,
        }),
        logPrefix,
        expected: player1.user,
        debugCalls: [[`${logPrefix} player "${player1.user}" has not yet passed, setting as next player.`]],
        traceCalls: [[`${logPrefix} currentPlayerOrder: "1"`], [`${logPrefix} i: "0"`]],
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
      testSetNextTurnForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 3,
          turn: player1.user,
        }),
        logPrefix,
        expected: player1.user,
        debugCalls: [[`${logPrefix} player "${player1.user}" has not yet passed, setting as next player.`]],
        traceCalls: [
          [`${logPrefix} currentPlayerOrder: "0"`],
          [`${logPrefix} i: "0"`],
          [`${logPrefix} player "${player2.user}" has already passed, ignoring for next player.`],
          [`${logPrefix} i: "1"`],
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
      testSetNextTurnForCurrentRound({
        game: TestUtil.getDbGame({
          players: [player1, player2],
          round: 3,
          turn: player2.user,
        }),
        logPrefix,
        expected: player2.user,
        debugCalls: [[`${logPrefix} player "${player2.user}" has not yet passed, setting as next player.`]],
        traceCalls: [
          [`${logPrefix} currentPlayerOrder: "1"`],
          [`${logPrefix} i: "0"`],
          [`${logPrefix} player "${player1.user}" has already passed, ignoring for next player.`],
          [`${logPrefix} i: "1"`],
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
    testSetNextTurnForCurrentRound({
      game: TestUtil.getDbGame({
        players: [player1, player2],
        round: 1,
        turn: player1.user,
      }),
      logPrefix,
      expected: player2.user,
      traceEnabled: true,
      debugCalls: [[`${logPrefix} player "${player2.user}" has not yet passed, setting as next player.`]],
      traceCalls: [
        [`${logPrefix} usersByOrder: "${JSON.stringify([player1, player2])}"`],
        [`${logPrefix} currentPlayerOrder: "0"`],
        [`${logPrefix} i: "0"`],
        [`${logPrefix} potentialNextPlayer: "${JSON.stringify(player2)}"`],
      ],
    })
  })
})

function testSetNextTurnForCurrentRound({
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
  const origGame = deepClone(game)
  const errorSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SetNextTurnForCurrentRound['logger'] = {
    error: errorSpy,
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  if (expected instanceof Error) {
    expect(() =>
      SetNextTurnForCurrentRound.setNextTurnForCurrentRound({
        game,
        logPrefix,
      })
    ).toThrow(expected)
  } else {
    expect(
      SetNextTurnForCurrentRound.setNextTurnForCurrentRound({
        game,
        logPrefix,
      })
    ).toEqual(undefined)
  }
  expect(game.turn).toEqual(expected instanceof Error ? origGame.turn : expected)

  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
