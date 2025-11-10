import { Context } from '@gwent/graphql-schema/context'
import { GameStatus, UserDbObject } from '@gwent/graphql-schema/database-typings'
import { MutationReadyArgs } from '@gwent/graphql-schema/resolver-typings'
import Permissions, { GameAndPlayer } from '../../src/graphql/permissions'
import ReadyValidation, { ValidatedReady } from '../../src/graphql/resolvers/mutations/ready/ready-validation'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('ready-validation', () => {
  it('throws error if isAuthenticated throws error', async () => {
    const error = Error('isAuthenticated error')
    await testReadyValidation({
      isAuthenticatedResponse: error,
      expected: error,
    })
  })
  it('throws error if isGamePlayer throws error', async () => {
    const error = Error('isGamePlayer error')
    await testReadyValidation({
      isAuthenticatedResponse: TestUtil.getDbUser({}),
      isGamePlayerResponse: error,
      expected: error,
    })
  })
  it('throws error if validateGame throws error', async () => {
    const user = TestUtil.getDbUser({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
        }),
        TestUtil.getDbGamePlayer({}),
      ],
    })
    const error = Error('validateGame error')
    await testReadyValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      validateGameError: error,
      expected: error,
    })
  })
  it('returns objects if no error', async () => {
    const user = TestUtil.getDbUser({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
        }),
        TestUtil.getDbGamePlayer({}),
      ],
    })
    await testReadyValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      expected: {
        game,
        logPrefix: `ready by "${user._id}" on game "${game._id}"`,
        userId: user._id,
      },
    })
  })
})

async function testReadyValidation({
  isAuthenticatedResponse,
  isGamePlayerResponse,
  validateGameError,
  expected,
}: {
  isAuthenticatedResponse: UserDbObject | Error
  isGamePlayerResponse?: GameAndPlayer | Error
  validateGameError?: Error
  expected: ValidatedReady | Error
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
  const args: MutationReadyArgs = {
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
  const logRequestInfoSpy = jest.spyOn(ResolverUtil.prototype, 'logRequestInfo').mockImplementation()
  const validateGameSpy = jest.spyOn(ResolverUtil.prototype, 'validateGame').mockImplementation(() => {
    if (validateGameError) {
      throw validateGameError
    }
  })

  const promise = ReadyValidation.readyValidation(args, context, null as any)
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(isAuthenticatedSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'ready mutation',
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
              label: 'ready mutation',
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
              status: GameStatus.Redrawing,
              label: 'mark ready',
            },
          ],
        ]
  )
}
