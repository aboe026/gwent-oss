import { Context } from '@gwent/graphql-schema/context'
import { GameStatus, UserDbObject } from '@gwent/graphql-schema/database-typings'
import { MutationPlayPassArgs } from '@gwent/graphql-schema/resolver-typings'
import Permissions, { GameAndPlayer } from '../../src/graphql/permissions'
import PlayPassValidation from '../../src/graphql/resolvers/mutations/play-pass/play-pass-validation'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('play-pass-validation', () => {
  it('throws error if isAuthenticated throws error', async () => {
    const error = Error('isAuthenticated error')
    await testPlayPassValidation({
      isAuthenticatedResponse: error,
      error,
    })
  })
  it('throws error if isGamePlayer throws error', async () => {
    const error = Error('isGamePlayer error')
    await testPlayPassValidation({
      isAuthenticatedResponse: TestUtil.getDbUser({}),
      isGamePlayerResponse: error,
      error,
    })
  })
  it('throws error if validateGame throws error', async () => {
    const error = Error('isGamePlayer error')
    const user = TestUtil.getDbUser({})
    await testPlayPassValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game: TestUtil.getDbGame({}),
        player: TestUtil.getDbGamePlayer({
          user: user._id,
        }),
      },
      validateGameError: error,
      error,
    })
  })
  it('throws error if round does not exist on game player', async () => {
    const user = TestUtil.getDbUser({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
        }),
      ],
      round: 2,
    })
    const message = `Could not get round "2" for player "${game.players[0].user}"`
    const logPrefix = `playPass by "${game.players[0].user}" on game "${game._id}"`
    await testPlayPassValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      error: Error(message),
      errorCalls: [[`${logPrefix} failed: ${message}: "${JSON.stringify(game.players[0].rounds)}"`]],
    })
  })
  it('throws error if player already passed round 1', async () => {
    const user = TestUtil.getDbUser({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
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
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      error: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if player already passed round 2', async () => {
    const user = TestUtil.getDbUser({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
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
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      error: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if player already passed round 3', async () => {
    const user = TestUtil.getDbUser({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
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
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      error: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('returns objects if no errors for round 1', async () => {
    const user = TestUtil.getDbUser({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
          rounds: [TestUtil.getDbPlayerRound({})],
        }),
      ],
      round: 1,
    })
    await testPlayPassValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
    })
  })
  it('returns objects if no errors for round 2', async () => {
    const user = TestUtil.getDbUser({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        }),
      ],
      round: 2,
    })
    await testPlayPassValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
    })
  })
  it('returns objects if no errors for round 3', async () => {
    const user = TestUtil.getDbUser({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
          rounds: [TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({}), TestUtil.getDbPlayerRound({})],
        }),
      ],
      round: 3,
    })
    await testPlayPassValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
    })
  })
})

async function testPlayPassValidation({
  isAuthenticatedResponse,
  isGamePlayerResponse,
  validateGameError,
  error,
  errorCalls = [],
  warnCalls = [],
}: {
  isAuthenticatedResponse: UserDbObject | Error
  isGamePlayerResponse?: GameAndPlayer | Error
  validateGameError?: Error
  error?: Error
  errorCalls?: string[][]
  warnCalls?: string[][]
}) {
  const context: Context = {
    session: {
      user: isAuthenticatedResponse instanceof Error ? undefined : isAuthenticatedResponse,
    },
  }
  const gameId = isGamePlayerResponse
    ? isGamePlayerResponse instanceof Error
      ? ''
      : isGamePlayerResponse.game._id.toString()
    : ''

  const logPrefix = `playPass by "${isAuthenticatedResponse instanceof Error ? '' : isAuthenticatedResponse._id}" on game "${gameId}"`
  const args: MutationPlayPassArgs = {
    game: gameId,
  }
  const isAuthenticatedSpy = jest.spyOn(Permissions, 'isAuthenticated').mockImplementation(() => {
    if (isAuthenticatedResponse instanceof Error) {
      throw isAuthenticatedResponse
    } else {
      return isAuthenticatedResponse
    }
  })
  const isGamePlayerSpy = jest.spyOn(Permissions, 'isGamePlayer')
  if (isGamePlayerResponse) {
    if (isGamePlayerResponse instanceof Error) {
      isGamePlayerSpy.mockRejectedValue(isGamePlayerResponse)
    } else {
      isGamePlayerSpy.mockResolvedValue(isGamePlayerResponse)
    }
  }
  const validateGameSpy = jest.spyOn(ResolverUtil.prototype, 'validateGame').mockImplementation(() => {
    if (validateGameError) {
      throw validateGameError
    }
  })
  const logRequestInfoSpy = jest.spyOn(ResolverUtil.prototype, 'logRequestInfo').mockImplementation()
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
      game: isGamePlayerResponse instanceof Error ? undefined : isGamePlayerResponse?.game,
      logPrefix,
    })
  }

  expect(isAuthenticatedSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'playPass mutation',
      },
    ],
  ])
  expect(isGamePlayerSpy.mock.calls).toEqual(
    isAuthenticatedResponse instanceof Error
      ? []
      : [
          [
            {
              gameId,
              userId: isAuthenticatedResponse?._id,
              label: 'playPass mutation',
            },
          ],
        ]
  )
  expect(logRequestInfoSpy.mock.calls).toEqual(
    isAuthenticatedResponse instanceof Error || isGamePlayerResponse instanceof Error
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
  expect(validateGameSpy.mock.calls).toEqual(
    isAuthenticatedResponse instanceof Error || isGamePlayerResponse instanceof Error
      ? []
      : [
          [
            {
              game: isGamePlayerResponse?.game,
              userId: isAuthenticatedResponse._id,
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
