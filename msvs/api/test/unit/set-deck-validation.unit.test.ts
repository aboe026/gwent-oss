import { ObjectId } from 'mongodb'

import { Context } from '@gwent-oss/graphql-schema/context'
import { DeckDbObject, GameStatus, UserDbObject } from '@gwent-oss/graphql-schema/database-typings'
import { MutationSetDeckArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import Permissions, { GameAndPlayer } from '../../src/graphql/permissions'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import SetDeckValidation, { ValidatedSetDeck } from '../../src/graphql/resolvers/mutations/set-deck/set-deck-validation'
import TestUtil from '../util/test-util'

describe('set-deck-validation', () => {
  it('throws error if isAuthenticated throws error', async () => {
    const error = Error('isAuthenticated error')
    await testSetDeckValidation({
      isAuthenticatedResponse: error,
      expected: error,
    })
  })
  it('throws error if isGamePlayer throws error', async () => {
    const error = Error('isGamePlayer error')
    await testSetDeckValidation({
      isAuthenticatedResponse: TestUtil.getDbUser({}),
      isGamePlayerResponse: error,
      expected: error,
    })
  })
  it('throws error if isDeckOwner throws error', async () => {
    const user = TestUtil.getDbUser({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          user: user._id,
        }),
        TestUtil.getDbGamePlayer({}),
      ],
    })
    const error = Error('isDeckOwner error')
    await testSetDeckValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      isDeckOwnerResponse: error,
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
    await testSetDeckValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      isDeckOwnerResponse: TestUtil.getDbDeck({}),
      validateGameError: error,
      expected: error,
    })
  })
  it('throws error if deck already set', async () => {
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
        TestUtil.getDbGamePlayer({}),
      ],
    })
    const logPrefix = `setDeck by "${user._id}" for deck "${deck._id}" on game "${game._id}"`
    const message = 'Deck already set.'
    await testSetDeckValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      isDeckOwnerResponse: deck,
      expected: Error(message),
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
        TestUtil.getDbGamePlayer({}),
      ],
    })
    await testSetDeckValidation({
      isAuthenticatedResponse: user,
      isGamePlayerResponse: {
        game,
        player: game.players[0],
      },
      isDeckOwnerResponse: deck,
      expected: {
        deck,
        game,
        logPrefix: `setDeck by "${user._id}" for deck "${deck._id}" on game "${game._id}"`,
        userId: user._id,
      },
    })
  })
})

async function testSetDeckValidation({
  isAuthenticatedResponse,
  isGamePlayerResponse,
  isDeckOwnerResponse,
  validateGameError,
  expected,
  warnCalls = [],
}: {
  isAuthenticatedResponse: UserDbObject | Error
  isGamePlayerResponse?: GameAndPlayer | Error
  isDeckOwnerResponse?: DeckDbObject | Error
  validateGameError?: Error
  expected: ValidatedSetDeck | Error
  warnCalls?: string[][]
}) {
  const userId = isAuthenticatedResponse instanceof Error ? '' : isAuthenticatedResponse._id.toString()
  const gameId = isGamePlayerResponse
    ? isGamePlayerResponse instanceof Error
      ? ''
      : isGamePlayerResponse.game._id.toString()
    : ''
  const deckId = isDeckOwnerResponse
    ? isDeckOwnerResponse instanceof Error
      ? ''
      : isDeckOwnerResponse._id.toString()
    : ''
  const args: MutationSetDeckArgs = {
    game: gameId,
    deck: deckId,
  }
  const context: Context = {
    session: {
      user: isAuthenticatedResponse instanceof Error ? undefined : isAuthenticatedResponse,
    },
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
  const isDeckOwnerSpy = jest.spyOn(Permissions, 'isDeckOwner')
  if (isDeckOwnerResponse) {
    if (isDeckOwnerResponse instanceof Error) {
      isDeckOwnerSpy.mockRejectedValue(isDeckOwnerResponse)
    } else {
      isDeckOwnerSpy.mockResolvedValue(isDeckOwnerResponse)
    }
  }
  const logRequestInfoSpy = jest.spyOn(ResolverUtil.prototype, 'logRequestInfo').mockImplementation()
  const validateGameSpy = jest.spyOn(ResolverUtil.prototype, 'validateGame').mockImplementation(() => {
    if (validateGameError) {
      throw validateGameError
    }
  })
  const warnSpy = jest.fn().mockImplementation()
  SetDeckValidation['logger'] = {
    warn: warnSpy,
  } as any

  const promise = SetDeckValidation.setDeckValidation(args, context, null as any)
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(isAuthenticatedSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'setDeck mutation',
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
              label: 'setDeck mutation',
            },
          ],
        ]
  )
  expect(isDeckOwnerSpy.mock.calls).toEqual(
    isAuthenticatedResponse instanceof Error || isGamePlayerResponse instanceof Error
      ? []
      : [
          [
            {
              deckId,
              userId: new ObjectId(userId),
              label: 'setDeck mutation',
            },
          ],
        ]
  )
  expect(logRequestInfoSpy.mock.calls).toEqual(
    isAuthenticatedResponse instanceof Error ||
      isGamePlayerResponse instanceof Error ||
      isDeckOwnerResponse instanceof Error
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
    isAuthenticatedResponse instanceof Error ||
      isGamePlayerResponse instanceof Error ||
      isDeckOwnerResponse instanceof Error
      ? []
      : [
          [
            {
              game: isGamePlayerResponse?.game,
              userId: isAuthenticatedResponse._id,
              status: GameStatus.Decking,
              label: 'set deck',
            },
          ],
        ]
  )
  expect(warnSpy.mock.calls).toEqual(warnCalls)
}
