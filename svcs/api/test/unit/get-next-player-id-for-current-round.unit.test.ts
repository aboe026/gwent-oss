import { ObjectId } from 'mongodb'

import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import TestUtil from '../util/test-util'
import SetNextTurnForCurrentRound from '../../src/graphql/resolvers/mutations/util/set-next-turn-for-current-round'

describe('set-next-turn-for-current-round', () => {
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
    ).toEqual(expected)
  }

  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
