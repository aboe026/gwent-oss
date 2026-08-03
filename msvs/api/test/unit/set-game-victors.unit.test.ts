import { ObjectId } from 'mongodb'

import deepClone from '../util/deep-clone'
import { GameDbObject, GameStatus, RoundResult } from '@gwent-oss/graphql-schema/database-typings'
import SetGameVictors from '../../src/graphql/resolvers/mutations/play-pass/set-game-victors'
import TestUtil from '../util/test-util'

describe('set-game-victors', () => {
  const logPrefix = 'test prefix'
  it('returns both if both drew twice', () => {
    const self = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Drew,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Drew,
        }),
      ],
    })
    const opponent = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Drew,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Drew,
        }),
      ],
    })
    const game = TestUtil.getDbGame({
      players: [self, opponent],
    })
    testSetGameVictors({
      game,
      logPrefix,
      expected: [self.user, opponent.user],
      traceCalls: [
        [`${logPrefix} player "${self.user}" playerWins: "0"`],
        [`${logPrefix} player "${opponent.user}" playerWins: "0"`],
        [`${logPrefix} highestWins: "0"`],
      ],
    })
  })
  it('returns both if self won lost then drew', () => {
    const self = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Won,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Lost,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Drew,
        }),
      ],
    })
    const opponent = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Lost,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Won,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Drew,
        }),
      ],
    })
    const game = TestUtil.getDbGame({
      players: [self, opponent],
    })
    testSetGameVictors({
      game,
      logPrefix,
      expected: [self.user, opponent.user],
      traceCalls: [
        [`${logPrefix} player "${self.user}" playerWins: "1"`],
        [
          `${logPrefix} player "${self.user}" wins "1" is greater than previous highestWins of "0", setting high wins to theirs`,
        ],
        [`${logPrefix} player "${opponent.user}" playerWins: "1"`],
        [`${logPrefix} highestWins: "1"`],
      ],
    })
  })
  it('returns self if self won twice', () => {
    const self = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Won,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Won,
        }),
      ],
    })
    const opponent = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Lost,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Lost,
        }),
      ],
    })
    const game = TestUtil.getDbGame({
      players: [self, opponent],
    })
    testSetGameVictors({
      game,
      logPrefix,
      expected: [self.user],
      traceCalls: [
        [`${logPrefix} player "${self.user}" playerWins: "2"`],
        [
          `${logPrefix} player "${self.user}" wins "2" is greater than previous highestWins of "0", setting high wins to theirs`,
        ],
        [`${logPrefix} player "${opponent.user}" playerWins: "0"`],
        [`${logPrefix} highestWins: "2"`],
      ],
    })
  })
  it('returns self if self won once and drew once', () => {
    const self = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Won,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Drew,
        }),
      ],
    })
    const opponent = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Lost,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Drew,
        }),
      ],
    })
    const game = TestUtil.getDbGame({
      players: [self, opponent],
    })
    testSetGameVictors({
      game,
      logPrefix,
      expected: [self.user],
      traceCalls: [
        [`${logPrefix} player "${self.user}" playerWins: "1"`],
        [
          `${logPrefix} player "${self.user}" wins "1" is greater than previous highestWins of "0", setting high wins to theirs`,
        ],
        [`${logPrefix} player "${opponent.user}" playerWins: "0"`],
        [`${logPrefix} highestWins: "1"`],
      ],
    })
  })
  it('returns self if self drew once and won once', () => {
    const self = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Drew,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Won,
        }),
      ],
    })
    const opponent = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Drew,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Lost,
        }),
      ],
    })
    const game = TestUtil.getDbGame({
      players: [self, opponent],
    })
    testSetGameVictors({
      game,
      logPrefix,
      expected: [self.user],
      traceCalls: [
        [`${logPrefix} player "${self.user}" playerWins: "1"`],
        [
          `${logPrefix} player "${self.user}" wins "1" is greater than previous highestWins of "0", setting high wins to theirs`,
        ],
        [`${logPrefix} player "${opponent.user}" playerWins: "0"`],
        [`${logPrefix} highestWins: "1"`],
      ],
    })
  })
  it('returns self if self won once lost once then won last', () => {
    const self = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Won,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Lost,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Won,
        }),
      ],
    })
    const opponent = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Lost,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Won,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Lost,
        }),
      ],
    })
    const game = TestUtil.getDbGame({
      players: [self, opponent],
    })
    testSetGameVictors({
      game,
      logPrefix,
      expected: [self.user],
      traceCalls: [
        [`${logPrefix} player "${self.user}" playerWins: "2"`],
        [
          `${logPrefix} player "${self.user}" wins "2" is greater than previous highestWins of "0", setting high wins to theirs`,
        ],
        [`${logPrefix} player "${opponent.user}" playerWins: "1"`],
        [`${logPrefix} highestWins: "2"`],
      ],
    })
  })
  it('returns opponent if opponent won twice', () => {
    const self = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Lost,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Lost,
        }),
      ],
    })
    const opponent = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Won,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Won,
        }),
      ],
    })
    const game = TestUtil.getDbGame({
      players: [self, opponent],
    })
    testSetGameVictors({
      game,
      logPrefix,
      expected: [opponent.user],
      traceCalls: [
        [`${logPrefix} player "${self.user}" playerWins: "0"`],
        [`${logPrefix} player "${opponent.user}" playerWins: "2"`],
        [
          `${logPrefix} player "${opponent.user}" wins "2" is greater than previous highestWins of "0", setting high wins to theirs`,
        ],
        [`${logPrefix} highestWins: "2"`],
      ],
    })
  })
  it('returns opponent if opponent won once and drew once', () => {
    const self = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Lost,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Drew,
        }),
      ],
    })
    const opponent = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Won,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Drew,
        }),
      ],
    })
    const game = TestUtil.getDbGame({
      players: [self, opponent],
    })
    testSetGameVictors({
      game,
      logPrefix,
      expected: [opponent.user],
      traceCalls: [
        [`${logPrefix} player "${self.user}" playerWins: "0"`],
        [`${logPrefix} player "${opponent.user}" playerWins: "1"`],
        [
          `${logPrefix} player "${opponent.user}" wins "1" is greater than previous highestWins of "0", setting high wins to theirs`,
        ],
        [`${logPrefix} highestWins: "1"`],
      ],
    })
  })
  it('returns opponent if opponent drew once and won once', () => {
    const self = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Drew,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Lost,
        }),
      ],
    })
    const opponent = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Drew,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Won,
        }),
      ],
    })
    const game = TestUtil.getDbGame({
      players: [self, opponent],
    })
    testSetGameVictors({
      game,
      logPrefix,
      expected: [opponent.user],
      traceCalls: [
        [`${logPrefix} player "${self.user}" playerWins: "0"`],
        [`${logPrefix} player "${opponent.user}" playerWins: "1"`],
        [
          `${logPrefix} player "${opponent.user}" wins "1" is greater than previous highestWins of "0", setting high wins to theirs`,
        ],
        [`${logPrefix} highestWins: "1"`],
      ],
    })
  })
  it('returns opponent if opponent won once lost once then won last', () => {
    const self = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Lost,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Won,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Lost,
        }),
      ],
    })
    const opponent = TestUtil.getDbGamePlayer({
      rounds: [
        TestUtil.getDbPlayerRound({
          result: RoundResult.Won,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Lost,
        }),
        TestUtil.getDbPlayerRound({
          result: RoundResult.Won,
        }),
      ],
    })
    const game = TestUtil.getDbGame({
      players: [self, opponent],
    })
    testSetGameVictors({
      game,
      logPrefix,
      expected: [opponent.user],
      traceCalls: [
        [`${logPrefix} player "${self.user}" playerWins: "1"`],
        [
          `${logPrefix} player "${self.user}" wins "1" is greater than previous highestWins of "0", setting high wins to theirs`,
        ],
        [`${logPrefix} player "${opponent.user}" playerWins: "2"`],
        [
          `${logPrefix} player "${opponent.user}" wins "2" is greater than previous highestWins of "1", setting high wins to theirs`,
        ],
        [`${logPrefix} highestWins: "2"`],
      ],
    })
  })
})

function testSetGameVictors({
  game,
  logPrefix,
  expected,
  traceCalls,
}: {
  game: GameDbObject
  logPrefix: string
  expected: ObjectId[]
  traceCalls: string[][]
}) {
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SetGameVictors['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
  } as any
  const origGame = deepClone(game)

  expect(
    SetGameVictors.setGameVictors({
      game,
      logPrefix,
    })
  ).toEqual(undefined)

  expect(game).toEqual({
    ...origGame,
    victors: expected,
    status: GameStatus.Done,
  })
  expect(debugSpy.mock.calls).toEqual([[`${logPrefix} ends game in victory for "${JSON.stringify(expected)}"`]])
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
