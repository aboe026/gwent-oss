import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { DeckDbObject, GameDbObject, GameStatus, UserDbObject } from '@gwent/graphql-schema/database-typings'
import DeckStore from '../../src/database/stores/deck-store'
import { MutationSetDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import SetDeckValidation from '../../src/graphql/resolvers/mutations/set-deck/set-deck-validation'
import TestUtil from '../util/test-util'

describe('set-deck-validation', () => {
  it('throws error if getContextUser throws error', async () => {
    const error = Error('getContextUser error')
    await testSetDeckValidation({
      args: {
        deck: new ObjectId().toString(),
        game: new ObjectId().toString(),
      },
      getContextUserError: error,
      error,
    })
  })
  it('throws error if verifyMongoIds throws error', async () => {
    const error = Error('verifyMongoIds error')
    await testSetDeckValidation({
      args: {
        deck: new ObjectId().toString(),
        game: new ObjectId().toString(),
      },
      verifyMongoIdsError: error,
      error,
    })
  })
  it('throws error if deck does not exist', async () => {
    const message = 'Deck does not exist.'
    const user = TestUtil.getDbUser({})
    const deck = TestUtil.getDbDeck({})
    const game = TestUtil.getDbGame({})
    const logPrefix = `setDeck by "${user._id}" for deck "${deck?._id}" on game "${game?._id}"`
    await testSetDeckValidation({
      args: {
        deck: deck._id.toString(),
        game: game._id.toString(),
      },
      user,
      error: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if deck already set', async () => {
    const message = 'Deck already set.'
    const user = TestUtil.getDbUser({})
    const deck = TestUtil.getDbDeck({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
          deck: TestUtil.getDbGameDeck({
            from: deck,
          }),
        }),
      ],
    })
    const logPrefix = `setDeck by "${user._id}" for deck "${deck?._id}" on game "${game?._id}"`
    await testSetDeckValidation({
      args: {
        deck: deck._id.toString(),
        game: game._id.toString(),
      },
      user,
      deck,
      game,
      error: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('returns objects if no errors', async () => {
    const user = TestUtil.getDbUser({})
    const deck = TestUtil.getDbDeck({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
        }),
      ],
    })
    await testSetDeckValidation({
      args: {
        deck: deck._id.toString(),
        game: game._id.toString(),
      },
      user,
      deck,
      game,
    })
  })
  it('logs to trace if enabled', async () => {
    const user = TestUtil.getDbUser({})
    const deck = TestUtil.getDbDeck({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
        }),
      ],
    })
    await testSetDeckValidation({
      args: {
        deck: deck._id.toString(),
        game: game._id.toString(),
      },
      user,
      deck,
      game,
      traceEnabled: true,
    })
  })
})

async function testSetDeckValidation({
  user = TestUtil.getDbUser({}),
  args,
  deck,
  game,
  getContextUserError,
  verifyMongoIdsError,
  error,
  warnCalls = [],
  traceEnabled,
}: {
  user?: UserDbObject
  args: MutationSetDeckArgs
  deck?: DeckDbObject
  game?: GameDbObject
  getContextUserError?: Error
  verifyMongoIdsError?: Error
  error?: Error
  warnCalls?: string[][]
  traceEnabled?: boolean
}) {
  const logPrefix = `setDeck by "${user._id}" for deck "${deck?._id}" on game "${game?._id}"`
  const context: Context = {
    session: {
      user,
    },
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
  if (verifyMongoIdsError) {
    verifyMongoIdsSpy.mockImplementation(() => {
      throw verifyMongoIdsError
    })
  } else {
    verifyMongoIdsSpy.mockImplementation()
  }
  const deckStoreGetByIdSpy = jest.spyOn(DeckStore, 'getById').mockResolvedValue(deck)
  const getGamePlayerSpy = jest.spyOn(ResolverUtil.prototype, 'getGamePlayer')
  if (game) {
    getGamePlayerSpy.mockResolvedValue({
      game,
      player: game?.players[0],
    })
  }
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SetDeckValidation['logger'] = {
    warn: warnSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = SetDeckValidation.setDeckValidation(args, context, null as any)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual({
      deck,
      game,
      logPrefix: `setDeck by "${user._id}" for deck "${args.deck}" on game "${args.game}"`,
      userId: user._id,
    })
  }

  expect(getContextUserSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'setDeck mutation',
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
              ids: [args.deck],
              label: 'Deck ID',
            },
          ],
        ]
  )
  expect(deckStoreGetByIdSpy.mock.calls).toEqual(
    getContextUserError || verifyMongoIdsError
      ? []
      : [
          [
            {
              id: args.deck,
            },
          ],
        ]
  )
  expect(getGamePlayerSpy.mock.calls).toEqual(
    game
      ? [
          [
            {
              gameId: args.game,
              userId: user._id,
              status: GameStatus.Decking,
              label: 'set deck',
            },
          ],
        ]
      : []
  )
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`${logPrefix} deck: "${JSON.stringify(deck)}"`]] : [])
}
