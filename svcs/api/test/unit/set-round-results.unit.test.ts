import deepClone from '../util/deep-clone'
import { GameDbObject, RoundResult } from '@gwent/graphql-schema/database-typings'
import SetRoundResults from '../../src/graphql/resolvers/mutations/util/set-round-results'
import TestUtil from '../util/test-util'

describe('set-round-results', () => {
  describe('setRoundResults', () => {
    const logPrefix = 'unit-test-log-prefix'
    describe('first round', () => {
      const round = 1
      it('sets round result to WON and LOST if first player has higher score', () => {
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  score: 2,
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  score: 1,
                }),
              ],
            }),
          ],
          round,
        })
        const origGame = deepClone(game)
        testSetRoundWinners({
          game,
          logPrefix,
          round,
          firstPlayerResult: RoundResult.Won,
          secondPlayerResult: RoundResult.Lost,
          debugCalls: [[`${logPrefix} ends round "${round}" in win for "["${origGame.players[0].user}"]"`]],
          traceCalls: [
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" score: "2"`],
            [
              `${logPrefix} player "${origGame.players[0].user}" round "${round}" score "2" is greater than previous highestScore of "0", setting it to theirs`,
            ],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" score: "1"`],
            [`${logPrefix} round "1" highestScore: "2"`],
            [`${logPrefix} round "1" usersWithHighestScore: "1"`],
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" result: "${RoundResult.Won}"`],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" result: "${RoundResult.Lost}"`],
          ],
        })
      })
      it('sets round result to LOST and WON if second player has higher score', () => {
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  score: 1,
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  score: 2,
                }),
              ],
            }),
          ],
          round,
        })
        const origGame = deepClone(game)
        testSetRoundWinners({
          game,
          logPrefix,
          round,
          firstPlayerResult: RoundResult.Lost,
          secondPlayerResult: RoundResult.Won,
          debugCalls: [[`${logPrefix} ends round "${round}" in win for "["${origGame.players[1].user}"]"`]],
          traceCalls: [
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" score: "1"`],
            [
              `${logPrefix} player "${origGame.players[0].user}" round "${round}" score "1" is greater than previous highestScore of "0", setting it to theirs`,
            ],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" score: "2"`],
            [
              `${logPrefix} player "${origGame.players[1].user}" round "${round}" score "2" is greater than previous highestScore of "1", setting it to theirs`,
            ],
            [`${logPrefix} round "${round}" highestScore: "2"`],
            [`${logPrefix} round "${round}" usersWithHighestScore: "1"`],
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" result: "${RoundResult.Lost}"`],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" result: "${RoundResult.Won}"`],
          ],
        })
      })
      it('sets round result to DREW if both players have same score', () => {
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  score: 1,
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  score: 1,
                }),
              ],
            }),
          ],
          round,
        })
        const origGame = deepClone(game)
        testSetRoundWinners({
          game,
          logPrefix,
          round,
          firstPlayerResult: RoundResult.Drew,
          secondPlayerResult: RoundResult.Drew,
          debugCalls: [
            [
              `${logPrefix} ends round "${round}" in draw for "["${origGame.players[0].user}","${origGame.players[1].user}"]"`,
            ],
          ],
          traceCalls: [
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" score: "1"`],
            [
              `${logPrefix} player "${origGame.players[0].user}" round "${round}" score "1" is greater than previous highestScore of "0", setting it to theirs`,
            ],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" score: "1"`],
            [`${logPrefix} round "${round}" highestScore: "1"`],
            [`${logPrefix} round "${round}" usersWithHighestScore: "2"`],
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" result: "${RoundResult.Drew}"`],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" result: "${RoundResult.Drew}"`],
          ],
        })
      })
    })
    describe('second round', () => {
      const round = 2
      it('sets round result to WON and LOST if first player has higher score', () => {
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  score: 2,
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  score: 1,
                }),
              ],
            }),
          ],
          round,
        })
        const origGame = deepClone(game)
        testSetRoundWinners({
          game,
          logPrefix,
          round,
          firstPlayerResult: RoundResult.Won,
          secondPlayerResult: RoundResult.Lost,
          debugCalls: [[`${logPrefix} ends round "${round}" in win for "["${origGame.players[0].user}"]"`]],
          traceCalls: [
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" score: "2"`],
            [
              `${logPrefix} player "${origGame.players[0].user}" round "${round}" score "2" is greater than previous highestScore of "0", setting it to theirs`,
            ],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" score: "1"`],
            [`${logPrefix} round "${round}" highestScore: "2"`],
            [`${logPrefix} round "${round}" usersWithHighestScore: "1"`],
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" result: "${RoundResult.Won}"`],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" result: "${RoundResult.Lost}"`],
          ],
        })
      })
      it('sets round result to LOST and WON if second player has higher score', () => {
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  score: 1,
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  score: 2,
                }),
              ],
            }),
          ],
          round,
        })
        const origGame = deepClone(game)
        testSetRoundWinners({
          game,
          logPrefix,
          round,
          firstPlayerResult: RoundResult.Lost,
          secondPlayerResult: RoundResult.Won,
          debugCalls: [[`${logPrefix} ends round "${round}" in win for "["${origGame.players[1].user}"]"`]],
          traceCalls: [
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" score: "1"`],
            [
              `${logPrefix} player "${origGame.players[0].user}" round "${round}" score "1" is greater than previous highestScore of "0", setting it to theirs`,
            ],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" score: "2"`],
            [
              `${logPrefix} player "${origGame.players[1].user}" round "${round}" score "2" is greater than previous highestScore of "1", setting it to theirs`,
            ],
            [`${logPrefix} round "${round}" highestScore: "2"`],
            [`${logPrefix} round "${round}" usersWithHighestScore: "1"`],
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" result: "${RoundResult.Lost}"`],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" result: "${RoundResult.Won}"`],
          ],
        })
      })
      it('sets round result to DREW if both players have same score', () => {
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  score: 1,
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  score: 1,
                }),
              ],
            }),
          ],
          round,
        })
        const origGame = deepClone(game)
        testSetRoundWinners({
          game,
          logPrefix,
          round,
          firstPlayerResult: RoundResult.Drew,
          secondPlayerResult: RoundResult.Drew,
          debugCalls: [
            [
              `${logPrefix} ends round "${round}" in draw for "["${origGame.players[0].user}","${origGame.players[1].user}"]"`,
            ],
          ],
          traceCalls: [
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" score: "1"`],
            [
              `${logPrefix} player "${origGame.players[0].user}" round "${round}" score "1" is greater than previous highestScore of "0", setting it to theirs`,
            ],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" score: "1"`],
            [`${logPrefix} round "${round}" highestScore: "1"`],
            [`${logPrefix} round "${round}" usersWithHighestScore: "2"`],
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" result: "${RoundResult.Drew}"`],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" result: "${RoundResult.Drew}"`],
          ],
        })
      })
    })
    describe('third round', () => {
      const round = 3
      it('sets round result to WON and LOST if first player has higher score', () => {
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  score: 2,
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  score: 1,
                }),
              ],
            }),
          ],
          round,
        })
        const origGame = deepClone(game)
        testSetRoundWinners({
          game,
          logPrefix,
          round,
          firstPlayerResult: RoundResult.Won,
          secondPlayerResult: RoundResult.Lost,
          debugCalls: [[`${logPrefix} ends round "${round}" in win for "["${origGame.players[0].user}"]"`]],
          traceCalls: [
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" score: "2"`],
            [
              `${logPrefix} player "${origGame.players[0].user}" round "${round}" score "2" is greater than previous highestScore of "0", setting it to theirs`,
            ],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" score: "1"`],
            [`${logPrefix} round "${round}" highestScore: "2"`],
            [`${logPrefix} round "${round}" usersWithHighestScore: "1"`],
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" result: "${RoundResult.Won}"`],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" result: "${RoundResult.Lost}"`],
          ],
        })
      })
      it('sets round result to LOST and WON if second player has higher score', () => {
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  score: 1,
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  score: 2,
                }),
              ],
            }),
          ],
          round,
        })
        const origGame = deepClone(game)
        testSetRoundWinners({
          game,
          logPrefix,
          round,
          firstPlayerResult: RoundResult.Lost,
          secondPlayerResult: RoundResult.Won,
          debugCalls: [[`${logPrefix} ends round "${round}" in win for "["${origGame.players[1].user}"]"`]],
          traceCalls: [
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" score: "1"`],
            [
              `${logPrefix} player "${origGame.players[0].user}" round "${round}" score "1" is greater than previous highestScore of "0", setting it to theirs`,
            ],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" score: "2"`],
            [
              `${logPrefix} player "${origGame.players[1].user}" round "${round}" score "2" is greater than previous highestScore of "1", setting it to theirs`,
            ],
            [`${logPrefix} round "${round}" highestScore: "2"`],
            [`${logPrefix} round "${round}" usersWithHighestScore: "1"`],
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" result: "${RoundResult.Lost}"`],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" result: "${RoundResult.Won}"`],
          ],
        })
      })
      it('sets round result to DREW if both players have same score', () => {
        const game = TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  score: 1,
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({}),
                TestUtil.getDbPlayerRound({
                  score: 1,
                }),
              ],
            }),
          ],
          round,
        })
        const origGame = deepClone(game)
        testSetRoundWinners({
          game,
          logPrefix,
          round,
          firstPlayerResult: RoundResult.Drew,
          secondPlayerResult: RoundResult.Drew,
          debugCalls: [
            [
              `${logPrefix} ends round "${round}" in draw for "["${origGame.players[0].user}","${origGame.players[1].user}"]"`,
            ],
          ],
          traceCalls: [
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" score: "1"`],
            [
              `${logPrefix} player "${origGame.players[0].user}" round "${round}" score "1" is greater than previous highestScore of "0", setting it to theirs`,
            ],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" score: "1"`],
            [`${logPrefix} round "${round}" highestScore: "1"`],
            [`${logPrefix} round "${round}" usersWithHighestScore: "2"`],
            [`${logPrefix} player "${origGame.players[0].user}" round "${round}" result: "${RoundResult.Drew}"`],
            [`${logPrefix} player "${origGame.players[1].user}" round "${round}" result: "${RoundResult.Drew}"`],
          ],
        })
      })
    })
  })
})

function testSetRoundWinners({
  game,
  logPrefix,
  round,
  firstPlayerResult,
  secondPlayerResult,
  debugCalls,
  traceCalls,
}: {
  game: GameDbObject
  logPrefix: string
  round: number
  firstPlayerResult: RoundResult
  secondPlayerResult: RoundResult
  debugCalls: string[][]
  traceCalls: string[][]
}) {
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SetRoundResults['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
  } as any
  const origGame = deepClone(game)

  expect(
    SetRoundResults.setRoundResults({
      game,
      logPrefix,
    })
  ).toEqual(undefined)

  expect(game).toEqual({
    ...origGame,
    players: [
      {
        ...origGame.players[0],
        rounds: origGame.players[0].rounds.map((gameRound, index) => {
          let result = gameRound.result
          if (index === round - 1) {
            result = firstPlayerResult
          }
          return {
            ...gameRound,
            result,
          }
        }),
      },
      {
        ...origGame.players[1],
        rounds: origGame.players[1].rounds.map((gameRound, index) => {
          let result = gameRound.result
          if (index === round - 1) {
            result = secondPlayerResult
          }
          return {
            ...gameRound,
            result,
          }
        }),
      },
    ],
  })
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
