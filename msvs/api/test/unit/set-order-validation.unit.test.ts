import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { GameStatus } from '@gwent/graphql-schema/database-typings'
import { MutationSetOrderArgs } from '@gwent/graphql-schema/resolver-typings'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import SetOrderValidation from '../../src/graphql/resolvers/mutations/set-order/set-order-validation'
import TestUtil from '../util/test-util'

describe('set-order-validation', () => {
  it('throws error if getContextUser throws error', async () => {
    await testSetOrderValidation({
      getContextUserError: Error('getContextUser error'),
    })
  })
  it('throws error if verifyMongoIds throws error for game id', async () => {
    await testSetOrderValidation({
      verifyMongoIdsGameError: Error('verifyMongoIds game id error'),
    })
  })
  it('throws error if verifyMongoIds throws error for user ids', async () => {
    await testSetOrderValidation({
      userIds: [new ObjectId().toString()],
      verifyMongoIdsUserError: Error('verifyMongoIds user ids error'),
    })
  })
  it('returns objects if no errors and no user ids', async () => {
    await testSetOrderValidation({})
  })
  it('returns objects if no errors and user ids', async () => {
    await testSetOrderValidation({})
  })
})

async function testSetOrderValidation({
  userIds,
  getContextUserError,
  verifyMongoIdsGameError,
  verifyMongoIdsUserError,
  getGamePlayerError,
}: {
  userIds?: string[]
  getContextUserError?: Error
  verifyMongoIdsGameError?: Error
  verifyMongoIdsUserError?: Error
  getGamePlayerError?: Error
}) {
  const user = TestUtil.getDbUser({})
  const game = TestUtil.getDbGame({})
  const context: Context = {
    session: {
      user,
    },
  }
  const args: MutationSetOrderArgs = {
    game: game._id.toString(),
  }
  if (userIds) {
    args.users = userIds
  }
  const getContextUserSpy = jest.spyOn(ResolverUtil.prototype, 'getContextUser')
  if (getContextUserError) {
    getContextUserSpy.mockImplementation(() => {
      throw getContextUserError
    })
  } else {
    getContextUserSpy.mockReturnValue(user)
  }
  const logRequestInfoSpy = jest.spyOn(ResolverUtil.prototype, 'logRequestInfo').mockImplementation()
  const verifyMongoIdsSpy = jest.spyOn(ResolverUtil.prototype, 'verifyMongoIds')
  verifyMongoIdsSpy.mockImplementationOnce(() => {
    if (verifyMongoIdsGameError) {
      throw verifyMongoIdsGameError
    }
  })
  verifyMongoIdsSpy.mockImplementationOnce(() => {
    if (verifyMongoIdsUserError) {
      throw verifyMongoIdsUserError
    }
  })
  const getGamePlayerSpy = jest.spyOn(ResolverUtil.prototype, 'getGamePlayer')
  if (getGamePlayerError) {
    getGamePlayerSpy.mockRejectedValue(getGamePlayerError)
  } else {
    getGamePlayerSpy.mockResolvedValue({
      game,
      player: game.players[0],
    })
  }

  const promise = SetOrderValidation.setOrderValidation(args, context, null as any)
  const error = getContextUserError || verifyMongoIdsGameError || verifyMongoIdsUserError || getGamePlayerError
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual({
      game,
      gameDeck: game.players[0].deck,
      logPrefix: `setOrder by "${user._id}" to users "${JSON.stringify(userIds)}" on game "${game._id}"`,
      userIds,
    })
  }

  expect(getContextUserSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'setOrder mutation',
      },
    ],
  ])
  expect(logRequestInfoSpy.mock.calls).toEqual(
    getContextUserError
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
  const verifyMongoIdsCalls: any[][] = []
  if (!getContextUserError) {
    verifyMongoIdsCalls.push([
      {
        ids: [game._id.toString()],
        label: 'Game ID',
      },
    ])
    if (!verifyMongoIdsGameError && userIds) {
      verifyMongoIdsCalls.push([
        {
          ids: userIds,
          label: 'User ID',
        },
      ])
    }
  }
  expect(verifyMongoIdsSpy.mock.calls).toEqual(verifyMongoIdsCalls)
  expect(getGamePlayerSpy.mock.calls).toEqual(
    getContextUserError || verifyMongoIdsGameError || verifyMongoIdsUserError
      ? []
      : [
          [
            {
              gameId: game._id.toString(),
              userId: user._id,
              label: 'set order',
              status: GameStatus.Ordering,
            },
          ],
        ]
  )
}
