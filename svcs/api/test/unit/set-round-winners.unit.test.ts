import { GameDbObject, RoundResult } from '@gwent/graphql-schema/database-typings'
import SetRoundWinners from '../../src/graphql/resolvers/mutations/util/set-round-winners'
import TestUtil from '../util/test-util'
import deepClone from '../util/deep-clone'

describe('set-round-winners', () => {
  describe('setRoundWinners', () => {
    const logPrefix = 'unit-test-log-prefix'
    describe('first round', () => {
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
          round: 1,
        })
        const origGame = deepClone(game)
        testSetRoundWinners({
          game,
          logPrefix,
          debugCalls: [[`${logPrefix} ends round "1" in win for "["${origGame.players[0].user}"]"`]],
          traceCalls: [
            [`${logPrefix} player "${origGame.players[0].user}" round "1" score: "2"`],
            [
              `${logPrefix} player "${origGame.players[0].user}" round "1" score "2" is greater than previous highestScore of "0", setting it to theirs`,
            ],
            [`${logPrefix} player "${origGame.players[1].user}" round "1" score: "1"`],
            [`${logPrefix} round "1" highestScore: "2"`],
            [`${logPrefix} round "1" usersWithHighestScore: "1"`],
            [`${logPrefix} player "${origGame.players[0].user}" round "1" result: "${RoundResult.Won}"`],
            [`${logPrefix} player "${origGame.players[1].user}" round "1" result: "${RoundResult.Lost}"`],
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
          round: 1,
        })
        const origGame = deepClone(game)
        testSetRoundWinners({
          game,
          logPrefix,
          debugCalls: [[`${logPrefix} ends round "1" in win for "["${origGame.players[1].user}"]"`]],
          traceCalls: [
            [`${logPrefix} player "${origGame.players[0].user}" round "1" score: "1"`],
            [
              `${logPrefix} player "${origGame.players[0].user}" round "1" score "1" is greater than previous highestScore of "0", setting it to theirs`,
            ],
            [`${logPrefix} player "${origGame.players[1].user}" round "1" score: "2"`],
            [
              `${logPrefix} player "${origGame.players[1].user}" round "1" score "2" is greater than previous highestScore of "1", setting it to theirs`,
            ],
            [`${logPrefix} round "1" highestScore: "2"`],
            [`${logPrefix} round "1" usersWithHighestScore: "1"`],
            [`${logPrefix} player "${origGame.players[0].user}" round "1" result: "${RoundResult.Lost}"`],
            [`${logPrefix} player "${origGame.players[1].user}" round "1" result: "${RoundResult.Won}"`],
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
          round: 1,
        })
        const origGame = deepClone(game)
        testSetRoundWinners({
          game,
          logPrefix,
          debugCalls: [
            [`${logPrefix} ends round "1" in draw for "["${origGame.players[0].user}","${origGame.players[1].user}"]"`],
          ],
          traceCalls: [
            [`${logPrefix} player "${origGame.players[0].user}" round "1" score: "1"`],
            [
              `${logPrefix} player "${origGame.players[0].user}" round "1" score "1" is greater than previous highestScore of "0", setting it to theirs`,
            ],
            [`${logPrefix} player "${origGame.players[1].user}" round "1" score: "1"`],
            [`${logPrefix} round "1" highestScore: "1"`],
            [`${logPrefix} round "1" usersWithHighestScore: "2"`],
            [`${logPrefix} player "${origGame.players[0].user}" round "1" result: "${RoundResult.Drew}"`],
            [`${logPrefix} player "${origGame.players[1].user}" round "1" result: "${RoundResult.Drew}"`],
          ],
        })
      })
    })
    // TODO: rounds 2 & 3
  })
})

function testSetRoundWinners({
  game,
  logPrefix,
  debugCalls,
  traceCalls,
}: {
  game: GameDbObject
  logPrefix: string
  debugCalls: string[][]
  traceCalls: string[][]
}) {
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SetRoundWinners['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
  } as any

  expect(
    SetRoundWinners.setRoundWinners({
      game,
      logPrefix,
    })
  ).toEqual(undefined)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
