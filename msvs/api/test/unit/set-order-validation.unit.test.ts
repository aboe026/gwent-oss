import { Context } from '@gwent-oss/graphql-schema/context'
import { GameStatus, UserDbObject } from '@gwent-oss/graphql-schema/database-typings'
import { MutationSetOrderArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import Permissions, { GameAndPlayer } from '../../src/graphql/permissions'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import SetOrderValidation, {
  ValidatedSetOrder,
} from '../../src/graphql/resolvers/mutations/set-order/set-order-validation'
import TestUtil from '../util/test-util'

describe('set-order-validation', () => {
  it('throws error if isAuthenticated throws error', async () => {
    const error = Error('isAuthenticated error')
    await testSetOrderValidation({
      isAuthenticatedResponse: error,
      expected: error,
    })
  })
  it('throws error if isGamePlayer throws error', async () => {
    const error = Error('isGamePlayer error')
    await testSetOrderValidation({
      isAuthenticatedResponse: TestUtil.getDbUser({}),
      isGamePlayerResponse: error,
      expected: error,
    })
  })
  it('throws error if verifyMongoIds throws error', async () => {
    const user = TestUtil.getDbUser({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
        }),
        TestUtil.getDbGamePlayer({}),
      ],
    })
    const error = Error('verifyMongoIds error')
    await testSetOrderValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      userIds: [game.players[1].user.toString(), game.players[0].user.toString()],
      verifyMongoIdsError: error,
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
    await testSetOrderValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      validateGameError: error,
      expected: error,
    })
  })
  it('returns objects if no errors and no user ids', async () => {
    const user = TestUtil.getDbUser({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
        }),
        TestUtil.getDbGamePlayer({}),
      ],
    })
    await testSetOrderValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      expected: {
        game,
        gameDeck: game.players[0].deck,
        logPrefix: `setOrder by "${user._id}" to users "undefined" on game "${game._id}"`,
        userIds: undefined,
        userId: user._id,
      },
    })
  })
  it('returns objects if no errors and user ids', async () => {
    const user = TestUtil.getDbUser({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
        }),
        TestUtil.getDbGamePlayer({}),
      ],
    })
    const userIds = [game.players[1].user.toString(), game.players[0].user.toString()]
    await testSetOrderValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      userIds,
      expected: {
        game,
        gameDeck: game.players[0].deck,
        logPrefix: `setOrder by "${user._id}" to users "${JSON.stringify(userIds)}" on game "${game._id}"`,
        userIds,
        userId: user._id,
      },
    })
  })
})

async function testSetOrderValidation({
  isAuthenticatedResponse,
  isGamePlayerResponse,
  verifyMongoIdsError,
  validateGameError,
  userIds,
  expected,
}: {
  isAuthenticatedResponse: UserDbObject | Error
  isGamePlayerResponse?: GameAndPlayer | Error
  verifyMongoIdsError?: Error
  validateGameError?: Error
  userIds?: string[]
  expected: ValidatedSetOrder | Error
}) {
  const gameId = isGamePlayerResponse
    ? isGamePlayerResponse instanceof Error
      ? ''
      : isGamePlayerResponse.game._id.toString()
    : ''
  const context: Context = {
    session: {
      user: isAuthenticatedResponse instanceof Error ? undefined : isAuthenticatedResponse,
    },
  }
  const args: MutationSetOrderArgs = {
    game: gameId,
  }
  if (userIds) {
    args.users = userIds
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
  const verifyMongoIdsSpy = jest.spyOn(ResolverUtil.prototype, 'verifyMongoIds').mockImplementation(() => {
    if (verifyMongoIdsError) {
      throw verifyMongoIdsError
    }
  })
  const validateGameSpy = jest.spyOn(ResolverUtil.prototype, 'validateGame').mockImplementation(() => {
    if (validateGameError) {
      throw validateGameError
    }
  })

  const promise = SetOrderValidation.setOrderValidation(args, context, null as any)
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(isAuthenticatedSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'setOrder mutation',
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
              label: 'setOrder mutation',
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
  expect(verifyMongoIdsSpy.mock.calls).toEqual(
    !userIds || isAuthenticatedResponse instanceof Error || isGamePlayerResponse instanceof Error
      ? []
      : [
          [
            {
              ids: userIds,
              label: 'User ID',
            },
          ],
        ]
  )
  expect(validateGameSpy.mock.calls).toEqual(
    isAuthenticatedResponse instanceof Error || isGamePlayerResponse instanceof Error || verifyMongoIdsError
      ? []
      : [
          [
            {
              game: isGamePlayerResponse?.game,
              userId: isAuthenticatedResponse._id,
              status: GameStatus.Ordering,
              label: 'set order',
            },
          ],
        ]
  )
}
