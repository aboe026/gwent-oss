import { Context } from '@gwent/graphql-schema/context'
import { GameStatus } from '@gwent/graphql-schema/database-typings'
import { MutationReadyArgs } from '@gwent/graphql-schema/resolver-typings'
import ReadyValidation from '../../src/graphql/resolvers/mutations/ready/ready-validation'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('ready-validation', () => {
  it('throws error if getContextUser throws error', async () => {
    await testReadyValidation({
      getContextUserError: Error('getContextUser error'),
    })
  })
  it('throws error if getGamePlayer throws error', async () => {
    await testReadyValidation({
      getGamePlayerError: Error('getGamePlayer error'),
    })
  })
  it('returns objects if no error', async () => {
    await testReadyValidation({})
  })
})

async function testReadyValidation({
  getContextUserError,
  getGamePlayerError,
}: {
  getContextUserError?: Error
  getGamePlayerError?: Error
}) {
  const user = TestUtil.getDbUser({})
  const context: Context = {
    session: {
      user,
    },
  }
  const game = TestUtil.getDbGame({
    players: [
      TestUtil.getDbGamePlayer({
        user: user._id,
      }),
    ],
  })
  const args: MutationReadyArgs = {
    game: game._id.toString(),
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
  const getGamePlayerSpy = jest.spyOn(ResolverUtil.prototype, 'getGamePlayer')
  if (getGamePlayerError) {
    getGamePlayerSpy.mockRejectedValue(getGamePlayerError)
  } else {
    getGamePlayerSpy.mockResolvedValue({
      game,
      player: game.players[0],
    })
  }

  const error = getContextUserError || getGamePlayerError
  const promise = ReadyValidation.readyValidation(args, context, null as any)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual({
      logPrefix: `ready by "${user._id}" on game "${game._id}"`,
      game,
      userId: user._id,
    })
  }

  expect(getContextUserSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'ready mutation',
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
  expect(getGamePlayerSpy.mock.calls).toEqual(
    getContextUserError
      ? []
      : [
          [
            {
              gameId: game._id.toString(),
              userId: user._id,
              status: GameStatus.Redrawing,
              label: 'mark ready',
            },
          ],
        ]
  )
}
