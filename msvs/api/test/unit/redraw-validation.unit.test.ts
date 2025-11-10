import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { GameStatus, UserDbObject } from '@gwent/graphql-schema/database-typings'
import { MAX_REDRAWS } from '@gwent/constants'
import { MutationRedrawArgs } from '@gwent/graphql-schema/resolver-typings'
import Permissions, { GameAndPlayer } from '../../src/graphql/permissions'
import RedrawValidation, { ValidatedRedraw } from '../../src/graphql/resolvers/mutations/redraw/redraw-validation'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('redraw-validation', () => {
  const user = TestUtil.getDbUser({})
  const unitId = new ObjectId()
  it('throws error if isAuthenticated throws error', async () => {
    const error = Error('isAuthenticated error')
    await testRedrawValidation({
      isAuthenticatedResponse: error,
      expected: error,
    })
  })
  it('throws error if isGamePlayer throws error', async () => {
    const error = Error('isGamePlayer error')
    await testRedrawValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: error,
      expected: error,
    })
  })
  it('throws error if verifyMongoIds throws error', async () => {
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
        }),
        TestUtil.getDbGamePlayer({}),
      ],
    })
    const error = Error('verifyMongoIds error')
    await testRedrawValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      verifyMongoIdsError: error,
      expected: error,
    })
  })
  it('throws error if validateGame throws error', async () => {
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
        }),
        TestUtil.getDbGamePlayer({}),
      ],
    })
    const error = Error('validateGame error')
    await testRedrawValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      validateGameError: error,
      expected: error,
    })
  })
  it('throws error if player marked as ready', async () => {
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
          ready: true,
        }),
        TestUtil.getDbGamePlayer({}),
      ],
    })
    const logPrefix = `redraw by "${user._id}" for unit "${unitId}" on game "${game._id}"`
    const message = 'Redraw not allowed after game marked as ready.'
    await testRedrawValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      unitId,
      expected: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if max redraws exceeded', async () => {
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
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
        TestUtil.getDbGamePlayer({}),
      ],
    })
    const logPrefix = `redraw by "${user._id}" for unit "${unitId}" on game "${game._id}"`
    const message = `Cannot exceed maximum redraw limit of "${MAX_REDRAWS}".`
    await testRedrawValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      unitId,
      expected: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('returns objects if no errors', async () => {
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
        }),
        TestUtil.getDbGamePlayer({}),
      ],
    })
    await testRedrawValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      unitId,
      expected: {
        game,
        logPrefix: `redraw by "${user._id}" for unit "${unitId}" on game "${game._id}"`,
        unitId: unitId.toString(),
        userId: user._id,
      },
    })
  })
})

async function testRedrawValidation({
  isAuthenticatedResponse,
  isGamePlayerResponse,
  verifyMongoIdsError,
  validateGameError,
  unitId = new ObjectId(),
  expected,
  warnCalls = [],
}: {
  isAuthenticatedResponse: UserDbObject | Error
  isGamePlayerResponse?: GameAndPlayer | Error
  verifyMongoIdsError?: Error
  validateGameError?: Error
  unitId?: ObjectId
  expected: ValidatedRedraw | Error
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
  const args: MutationRedrawArgs = {
    game: gameId,
    unit: (unitId || '').toString(),
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
  const verifyMongoIdsSpy = jest.spyOn(ResolverUtil.prototype, 'verifyMongoIds')
  verifyMongoIdsSpy.mockImplementation(() => {
    if (verifyMongoIdsError) {
      throw verifyMongoIdsError
    }
  })
  const validateGameSpy = jest.spyOn(ResolverUtil.prototype, 'validateGame').mockImplementation(() => {
    if (validateGameError) {
      throw validateGameError
    }
  })
  const warnSpy = jest.fn().mockImplementation()
  RedrawValidation['logger'] = {
    warn: warnSpy,
  } as any

  const promise = RedrawValidation.redrawValidation(args, context, null as any)
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(isAuthenticatedSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'redraw mutation',
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
              label: 'redraw mutation',
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
    isAuthenticatedResponse instanceof Error || isGamePlayerResponse instanceof Error
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
  expect(validateGameSpy.mock.calls).toEqual(
    isAuthenticatedResponse instanceof Error || isGamePlayerResponse instanceof Error || verifyMongoIdsError
      ? []
      : [
          [
            {
              game: isGamePlayerResponse?.game,
              userId: isAuthenticatedResponse._id,
              status: GameStatus.Redrawing,
              label: 'redraw',
            },
          ],
        ]
  )
  expect(warnSpy.mock.calls).toEqual(warnCalls)
}
