import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { GameDbObject, GameStatus, UserDbObject } from '@gwent/graphql-schema/database-typings'
import { MAX_REDRAWS } from '@gwent/constants'
import { MutationRedrawArgs } from '@gwent/graphql-schema/resolver-typings'
import RedrawValidation from '../../src/graphql/resolvers/mutations/redraw/redraw-validation'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('redraw-validation', () => {
  const user = TestUtil.getDbUser({})
  const unitId = new ObjectId()
  it('throws erorr if getContextUser throws error', async () => {
    const message = 'getContextUser error'
    await testRedrawValidation({
      getContextUserError: Error(message),
      error: Error(message),
    })
  })
  it('throws erorr if verifyMongoIds throws error', async () => {
    const message = 'verifyMongoIds error'
    await testRedrawValidation({
      user,
      unitId,
      verifyMongoIdsError: Error(message),
      error: Error(message),
    })
  })
  it('throws erorr if getGamePlayer throws error', async () => {
    const message = 'getGamePlayer error'
    await testRedrawValidation({
      user,
      unitId,
      getGamePlayerError: Error(message),
      error: Error(message),
    })
  })
  it('throws erorr if player marked as ready', async () => {
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          ready: true,
        }),
      ],
    })
    const logPrefix = `redraw by "${user?._id}" for unit "${unitId}" on game "${game._id}"`
    const message = 'Redraw not allowed after game marked as ready.'
    await testRedrawValidation({
      game,
      user,
      unitId,
      error: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws erorr if max redraws exceeded', async () => {
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            redraws: [
              {
                from: TestUtil.getDbDeckUnit({}),
                to: TestUtil.getDbDeckUnit({}),
              },
              {
                from: TestUtil.getDbDeckUnit({}),
                to: TestUtil.getDbDeckUnit({}),
              },
            ],
          }),
        }),
      ],
    })
    const logPrefix = `redraw by "${user?._id}" for unit "${unitId}" on game "${game._id}"`
    const message = `Cannot exceed maximum redraw limit of "${MAX_REDRAWS}".`
    await testRedrawValidation({
      game,
      user,
      unitId,
      error: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('returns objects if no errors', async () => {
    const game = TestUtil.getDbGame({
      players: [TestUtil.getDbGamePlayer({})],
    })
    await testRedrawValidation({
      game,
      user,
      unitId,
    })
  })
})

async function testRedrawValidation({
  user,
  game,
  unitId,
  getContextUserError,
  verifyMongoIdsError,
  getGamePlayerError,
  error,
  warnCalls = [],
}: {
  user?: UserDbObject
  game?: GameDbObject
  unitId?: ObjectId
  getContextUserError?: Error
  verifyMongoIdsError?: Error
  getGamePlayerError?: Error
  error?: Error
  warnCalls?: string[][]
}) {
  const context: Context = {
    session: {
      user,
    },
  }
  const args: MutationRedrawArgs = {
    game: (game?._id || '').toString(),
    unit: (unitId || '').toString(),
  }
  const getContextUserSpy = jest.spyOn(ResolverUtil.prototype, 'getContextUser')
  if (getContextUserError) {
    getContextUserSpy.mockImplementation(() => {
      throw getContextUserError
    })
  } else if (user) {
    getContextUserSpy.mockReturnValue(user)
  }
  const logRequestInfoSpy = jest.spyOn(ResolverUtil.prototype, 'logRequestInfo').mockImplementation()
  const verifyMongoIdsSpy = jest.spyOn(ResolverUtil.prototype, 'verifyMongoIds')
  verifyMongoIdsSpy.mockImplementation(() => {
    if (verifyMongoIdsError) {
      throw verifyMongoIdsError
    }
  })
  const getGamePlayerSpy = jest.spyOn(ResolverUtil.prototype, 'getGamePlayer')
  if (getGamePlayerError) {
    getGamePlayerSpy.mockRejectedValue(getGamePlayerError)
  } else if (game) {
    getGamePlayerSpy.mockResolvedValue({
      game,
      player: game.players[0],
    })
  }
  const warnSpy = jest.fn().mockImplementation()
  RedrawValidation['logger'] = {
    warn: warnSpy,
  } as any

  const promise = RedrawValidation.redrawValidation(args, context, null as any)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual({
      game,
      logPrefix: `redraw by "${user?._id}" for unit "${args.unit}" on game "${game?._id}"`,
      unitId: args.unit,
      userId: user?._id,
    })
  }

  expect(getContextUserSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'redraw mutation',
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
  expect(verifyMongoIdsSpy.mock.calls).toEqual(
    getContextUserError
      ? []
      : [
          [
            {
              ids: [args.unit],
              label: 'Unit ID',
            },
          ],
        ]
  )
  expect(getGamePlayerSpy.mock.calls).toEqual(
    getContextUserError || verifyMongoIdsError
      ? []
      : [
          [
            {
              gameId: args.game,
              userId: user?._id,
              status: GameStatus.Redrawing,
              label: 'redraw',
            },
          ],
        ]
  )
  expect(warnSpy.mock.calls).toEqual(warnCalls)
}
