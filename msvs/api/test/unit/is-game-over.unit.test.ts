import { GameDbObject, RoundResult } from '@gwent-oss/graphql-schema/database-typings'
import IsGameOver from '../../src/graphql/resolvers/mutations/play-pass/is-game-over'
import TestUtil from '../util/test-util'

describe('is-game-over', () => {
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
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  IsGameOver['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  expect(
    IsGameOver.isGameOver({
      game,
      logPrefix,
    })
  ).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
