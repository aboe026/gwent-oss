import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import ResolverUtil, { GamePlayerResponse } from '../../src/graphql/resolvers/resolver-util'
import { Context } from '@gwent/graphql-schema/context'
import { GameDbObject, GameStatus, UserDbObject } from '@gwent/graphql-schema/database-typings'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import TestUtil from '../test-util'
import PresentableError from '../../src/util/presentable-error'
import { GraphQLResolveInfo } from 'graphql'
import GameStore from '../../src/database/stores/game-store'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'

describe('resolver-util', () => {
  describe('setLogPrefix', () => {
    it('sets logPrefix when none provided to constructor', () => {
      const resolverUtil = new ResolverUtil({
        logger: getLogger('test'),
      })
      expect(resolverUtil['logPrefix']).toEqual('')

      resolverUtil.setLogPrefix('first')

      expect(resolverUtil['logPrefix']).toEqual('first')
    })
    it('changes the logPrefix set by constructor', () => {
      const resolverUtil = new ResolverUtil({
        logger: getLogger('test'),
        logPrefix: 'first',
      })
      expect(resolverUtil['logPrefix']).toEqual('first')

      resolverUtil.setLogPrefix('second')

      expect(resolverUtil['logPrefix']).toEqual('second')
    })
  })
  describe('getContextUser', () => {
    const label = 'test'
    it('returns NOT_AUTHENTICATED_MESSAGE if context session undefined', () => {
      testGetContextUser({
        context: {
          session: undefined,
        },
        label,
        expected: Error(NOT_AUTHENTICATED_MESSAGE),
        errorCalls: [[`No user on context for ${label}: "undefined".`]],
      })
    })
    it('returns NOT_AUTHENTICATED_MESSAGE if context user undefined', () => {
      testGetContextUser({
        context: {
          session: {
            user: undefined,
          },
        },
        label,
        expected: Error(NOT_AUTHENTICATED_MESSAGE),
        errorCalls: [[`No user on context for ${label}: "{}".`]],
      })
    })
    it('returns user if on context', () => {
      const user = TestUtil.getDbUser({})
      testGetContextUser({
        context: {
          session: {
            user,
          },
        },
        label,
        expected: user,
      })
    })
  })
  describe('verifyMongoIds', () => {
    const label = 'test'
    const logPrefix = 'prefix'
    it('does not throw error if empty array', () => {
      testVerifyMongoIds({
        ids: [],
        label,
      })
    })
    it('throws error if single invalid id', () => {
      const id = 'invalid'
      const message = `${label} "${id}" is not a valid MongoDB ObjectId.`
      testVerifyMongoIds({
        ids: [id],
        label,
        logPrefix,
        expected: new PresentableError(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if multiple invalid ids', () => {
      const id = 'invalid'
      const message = `${label} "${id}" is not a valid MongoDB ObjectId.`
      testVerifyMongoIds({
        ids: [id, id],
        label,
        logPrefix,
        expected: new PresentableError(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if invalid id among valid', () => {
      const id = 'invalid'
      const message = `${label} "${id}" is not a valid MongoDB ObjectId.`
      testVerifyMongoIds({
        ids: [new ObjectId().toString(), id, new ObjectId().toString()],
        label,
        logPrefix,
        expected: new PresentableError(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('does not throw error if single valid id', () => {
      testVerifyMongoIds({
        ids: [new ObjectId().toString()],
        label,
      })
    })
    it('does not throw error if multiple valid ids', () => {
      testVerifyMongoIds({
        ids: [new ObjectId().toString(), new ObjectId().toString()],
        label,
      })
    })
  })
  describe('logRequestInfo', () => {
    it('does not log to trace if not enabled', () => {
      testLogRequestInfo({
        traceEnabled: false,
      })
    })
    it('logs to trace if enabled', () => {
      testLogRequestInfo({
        traceEnabled: true,
      })
    })
  })
  describe('getGamePlayer', () => {
    const userId = new ObjectId()
    const logPrefix = `playUnit by "${userId}"`
    it('returns error if gameId invalid', async () => {
      const gameId = 'invalid'
      const message = `Game ID "${gameId}" is not a valid MongoDB ObjectId.`
      await testGetGamePlayer({
        gameId,
        userId,
        logPrefix,
        expected: Error(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns error if no game found', async () => {
      const gameId = new ObjectId().toString()
      const message = `Game with ID "${gameId}" does not exist.`
      await testGetGamePlayer({
        gameId,
        userId,
        logPrefix,
        expected: Error(message),
        warnCalls: [[`${logPrefix} getGamePlayer failed: ${message}`]],
      })
    })
    it('returns error if player not on game', async () => {
      const gameId = new ObjectId().toString()
      const message = `Not a player on game "${gameId}".`
      await testGetGamePlayer({
        gameId,
        userId,
        logPrefix,
        getGameResponse: TestUtil.getDbGame({
          id: gameId,
        }),
        expected: Error(message),
        warnCalls: [[`${logPrefix} getGamePlayer failed: ${message}`]],
      })
    })
    it('returns error if more than 1 player with userId found', async () => {
      const gameId = new ObjectId().toString()
      const message = `Found more than 1 player with ID "${userId}" on game "${gameId}"`
      const game = TestUtil.getDbGame({
        id: gameId,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
        ],
      })
      await testGetGamePlayer({
        gameId,
        userId,
        logPrefix,
        getGameResponse: game,
        expected: Error(`${message}.`),
        errorCalls: [[`${logPrefix} getGamePlayer failed: ${message}: "${JSON.stringify(game.players)}"`]],
      })
    })
    it('returns error if game is wrong status', async () => {
      const gameId = new ObjectId().toString()
      const label = 'do something'
      const requiredStatus = GameStatus.Playing
      const actualStatus = GameStatus.Decking
      const message = `Invalid game status "${actualStatus}": Can only ${label} for game with status "${requiredStatus}".`
      const game = TestUtil.getDbGame({
        id: gameId,
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
        ],
      })
      await testGetGamePlayer({
        gameId,
        userId,
        logPrefix,
        label,
        status: requiredStatus,
        getGameResponse: game,
        expected: Error(message),
        statusCalls: [[game]],
        warnCalls: [[`${logPrefix} getGamePlayer failed: ${message}`]],
      })
    })
    it('returns error if it is not users turn when required', async () => {
      const gameId = new ObjectId().toString()
      const label = 'do something'
      const message = `Cannot ${label} when it is not your turn.`
      await testGetGamePlayer({
        gameId,
        userId,
        logPrefix,
        label,
        turn: true,
        getGameResponse: TestUtil.getDbGame({
          id: gameId,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
            }),
          ],
        }),
        expected: Error(message),
        warnCalls: [[`${logPrefix} getGamePlayer failed: ${message}`]],
      })
    })
    it('returns game and player if no errors', async () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
        ],
      })
      await testGetGamePlayer({
        gameId: game._id.toString(),
        userId,
        logPrefix,
        getGameResponse: game,
        expected: {
          game,
          player: game.players[0],
        },
      })
    })
    it('logs to trace if enabled', async () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
        ],
      })
      await testGetGamePlayer({
        gameId: game._id.toString(),
        userId,
        logPrefix,
        getGameResponse: game,
        expected: {
          game,
          player: game.players[0],
        },
        traceEnabled: true,
      })
    })
  })
})

function testGetContextUser({
  context,
  expected,
  label,
  errorCalls = [],
}: {
  context: Context
  label: string
  expected: Error | UserDbObject
  errorCalls?: string[][]
}) {
  const logger = getLogger('test')
  const errorSpy = jest.spyOn(logger, 'error').mockImplementation()
  const resolverUtil = new ResolverUtil({
    logger,
  })

  if (expected instanceof Error) {
    expect(() =>
      resolverUtil.getContextUser({
        context,
        label,
      })
    ).toThrow(expected)
  } else {
    expect(
      resolverUtil.getContextUser({
        context,
        label,
      })
    ).toEqual(expected)
  }

  expect(errorSpy.mock.calls).toEqual(errorCalls)
}

function testVerifyMongoIds({
  ids,
  label,
  expected,
  logPrefix,
  warnCalls = [],
}: {
  ids: string[]
  label: string
  expected?: Error
  logPrefix?: string
  warnCalls?: string[][]
}) {
  const logger = getLogger('test')
  const warnSpy = jest.spyOn(logger, 'warn').mockImplementation()
  const resolverUtil = new ResolverUtil({
    logger,
    logPrefix,
  })

  if (expected) {
    expect(() =>
      resolverUtil.verifyMongoIds({
        ids,
        label,
      })
    ).toThrow(expected)
  } else {
    expect(
      resolverUtil.verifyMongoIds({
        ids,
        label,
      })
    ).toEqual(expected)
  }

  expect(warnSpy.mock.calls).toEqual(warnCalls)
}

function testLogRequestInfo({ traceEnabled }: { traceEnabled: boolean }) {
  const args = {
    hello: 'world',
  }
  const info: GraphQLResolveInfo = {} as GraphQLResolveInfo
  const logPrefix = 'prefix'
  const logger = getLogger('test')
  const traceSpy = jest.spyOn(logger, 'trace').mockImplementation()
  jest.spyOn(logger, 'isTraceEnabled').mockReturnValue(traceEnabled)
  const resolverUtil = new ResolverUtil({
    logger,
    logPrefix,
  })

  expect(
    resolverUtil.logRequestInfo({
      args,
      info,
    })
  ).toEqual(undefined)

  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} args: "${JSON.stringify(args)}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
        ]
      : []
  )
}

async function testGetGamePlayer({
  gameId,
  userId,
  status,
  logPrefix,
  label,
  turn,
  getGameResponse,
  getStatusResponse,
  expected,
  statusCalls = [],
  errorCalls = [],
  warnCalls = [],
  traceEnabled,
}: {
  gameId: string
  userId: ObjectId
  logPrefix: string
  status?: GameStatus
  label?: string
  turn?: boolean
  getGameResponse?: GameDbObject | undefined
  getStatusResponse?: GameStatus
  expected: GamePlayerResponse | Error
  statusCalls?: GameDbObject[][]
  errorCalls?: string[][]
  warnCalls?: string[][]
  traceEnabled?: boolean
}) {
  const getGameSpy = jest.spyOn(GameStore, 'getById').mockResolvedValue(getGameResponse)
  const getStatusSpy = jest.spyOn(GameResolver, 'getStatus')
  if (getStatusResponse) {
    getStatusSpy.mockReturnValue(getStatusResponse)
  }
  const logger = getLogger('test')
  const errorSpy = jest.spyOn(logger, 'error').mockImplementation()
  const warnSpy = jest.spyOn(logger, 'warn').mockImplementation()
  const traceSpy = jest.spyOn(logger, 'trace').mockImplementation()
  jest.spyOn(logger, 'isTraceEnabled').mockReturnValue(traceEnabled || false)
  const resolverUtil = new ResolverUtil({
    logger,
    logPrefix,
  })

  const promise = resolverUtil.getGamePlayer({
    gameId,
    userId,
    status,
    label,
    turn,
  })
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(getGameSpy.mock.calls).toEqual(
    ObjectId.isValid(gameId)
      ? [
          [
            {
              id: gameId,
            },
          ],
        ]
      : []
  )
  expect(getStatusSpy.mock.calls).toEqual(statusCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} getGamePlayer game: "${JSON.stringify(getGameResponse)}"`],
          [`${logPrefix} getGamePlayer game "${gameId}" players: "${JSON.stringify(getGameResponse?.players)}"`],
        ]
      : []
  )
}
