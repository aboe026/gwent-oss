import { Context } from '@gwent/graphql-schema/context'
import { GameDbObject, GamePlayerDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import { MutationPlayPassArgs } from '@gwent/graphql-schema/resolver-typings'
import PlayPassValidation from '../../src/graphql/resolvers/mutations/play-pass/play-pass-validation'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('play-pass-validation', () => {
  it('throws error if getContextUser throws error', async () => {
    const error = Error('getContextUser error')
    await testPlayPassValidation({
      game: TestUtil.getDbGame({}),
      getUserContextError: error,
      error: error,
    })
  })
  it('throws error if getGamePlayer throws error', async () => {
    const error = Error('getGamePlayer error')
    await testPlayPassValidation({
      game: TestUtil.getDbGame({}),
      getGamePlayerError: error,
      error: error,
    })
  })
  it('throws error if round does not exist on game player', async () => {
    const game = TestUtil.getDbGame({
      players: [TestUtil.getDbGamePlayer({})],
      round: 2,
    })
    const message = `Could not get round "2" for player "${game.players[0].user}"`
    const logPrefix = `playPass by "${game.players[0].user}" on game "${game._id}"`
    await testPlayPassValidation({
      game,
      gamePlayer: game.players[0],
      error: Error(message),
      errorCalls: [[`${logPrefix} failed: ${message}: "${JSON.stringify(game.players[0].rounds)}"`]],
    })
  })
  it('throws error if player already passed round 1', async () => {
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
          ],
        }),
      ],
      round: 1,
    })
    const message = `Already passed round "1"`
    const logPrefix = `playPass by "${game.players[0].user}" on game "${game._id}"`
    await testPlayPassValidation({
      game,
      gamePlayer: game.players[0],
      error: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if player already passed round 2', async () => {
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
            TestUtil.getDbPlayerRound({
              passed: true,
            }),
          ],
        }),
      ],
      round: 2,
    })
    const message = `Already passed round "2"`
    const logPrefix = `playPass by "${game.players[0].user}" on game "${game._id}"`
    await testPlayPassValidation({
      game,
      gamePlayer: game.players[0],
      error: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if player already passed round 3', async () => {
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
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
        }),
      ],
      round: 3,
    })
    const message = `Already passed round "3"`
    const logPrefix = `playPass by "${game.players[0].user}" on game "${game._id}"`
    await testPlayPassValidation({
      game,
      gamePlayer: game.players[0],
      error: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('returns objects if no errors for round 1', async () => {
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        }),
      ],
      round: 1,
    })
    await testPlayPassValidation({
      game,
      gamePlayer: game.players[0],
    })
  })
  it('returns objects if no errors for round 2', async () => {
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        }),
      ],
      round: 2,
    })
    await testPlayPassValidation({
      game,
      gamePlayer: game.players[0],
    })
  })
  it('returns objects if no errors for round 3', async () => {
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        }),
      ],
      round: 3,
    })
    await testPlayPassValidation({
      game,
      gamePlayer: game.players[0],
    })
  })
})

async function testPlayPassValidation({
  game,
  gamePlayer = TestUtil.getDbGamePlayer({}),
  getUserContextError,
  getGamePlayerError,
  error,
  errorCalls = [],
  warnCalls = [],
}: {
  game: GameDbObject
  gamePlayer?: GamePlayerDbObject
  getUserContextError?: Error
  getGamePlayerError?: Error
  error?: Error
  errorCalls?: string[][]
  warnCalls?: string[][]
}) {
  const user = TestUtil.getDbUser({
    id: gamePlayer.user,
  })
  const context: Context = {
    session: {
      user,
    },
  }

  const logPrefix = `playPass by "${user._id}" on game "${game._id}"`
  const args: MutationPlayPassArgs = {
    game: game._id.toString(),
  }
  const getUserContextSpy = jest.spyOn(ResolverUtil.prototype, 'getContextUser')
  if (getUserContextError) {
    getUserContextSpy.mockImplementation(() => {
      throw getUserContextError
    })
  } else {
    getUserContextSpy.mockReturnValue(user)
  }
  const logRequestInfoSpy = jest.spyOn(ResolverUtil.prototype, 'logRequestInfo').mockImplementation()
  const getGamePlayerSpy = jest.spyOn(ResolverUtil.prototype, 'getGamePlayer')
  if (getGamePlayerError) {
    getGamePlayerSpy.mockRejectedValue(getGamePlayerError)
  } else {
    getGamePlayerSpy.mockResolvedValue({
      game,
      player: gamePlayer,
    })
  }
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  PlayPassValidation['logger'] = {
    error: errorSpy,
    warn: warnSpy,
  } as any

  const promise = PlayPassValidation.playPassValidation(args, context, null as any)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual({
      game,
      logPrefix,
    })
  }

  expect(getUserContextSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'playPass mutation',
      },
    ],
  ])
  expect(logRequestInfoSpy.mock.calls).toEqual(
    getUserContextError
      ? []
      : [
          [
            {
              args,
              info: null,
            },
          ],
        ]
  )
  expect(getGamePlayerSpy.mock.calls).toEqual(
    getUserContextError
      ? []
      : [
          [
            {
              gameId: game._id.toString(),
              userId: user._id,
              status: GameStatus.Playing,
              turn: true,
              label: 'pass round',
            },
          ],
        ]
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
}
