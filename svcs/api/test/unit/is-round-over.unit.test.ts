import { ObjectId } from 'mongodb'

import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import IsRoundOver from '../../src/graphql/resolvers/mutations/util/is-round-over'
import TestUtil from '../util/test-util'

describe('is-round-over', () => {
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
  IsRoundOver['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
  } as any

  expect(
    IsRoundOver.isRoundOver({
      game,
      logPrefix,
    })
  ).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
