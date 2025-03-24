import { ObjectId } from 'mongodb'

import { GameDbObject, RoundResult } from '@gwent/graphql-schema/database-typings'
import GetPlayerIdForNextRound from '../../src/graphql/resolvers/mutations/play-pass/get-player-id-for-next-round'
import TestUtil from '../util/test-util'

describe('get-player-id-for-next-round', () => {
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
        [`${logPrefix} getPlayerIdForNextRound usersByOrder: "${JSON.stringify([game.players[0], game.players[1]])}"`],
        [`${logPrefix} getPlayerIdForNextRound roundWinners: "${JSON.stringify([userId])}"`],
      ],
    })
  })
})

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
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GetPlayerIdForNextRound['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  expect(
    GetPlayerIdForNextRound.getPlayerIdForNextRound({
      game,
      logPrefix,
    })
  ).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
