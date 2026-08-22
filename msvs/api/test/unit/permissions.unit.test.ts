import { ObjectId } from 'mongodb'

import { Context } from '@gwent-oss/graphql-schema/context'
import { DeckDbObject, GameDbObject, UserDbObject } from '@gwent-oss/graphql-schema/database-typings'
import DeckStore from '../../src/database/stores/deck-store'
import GameStore from '../../src/database/stores/game-store'
import { NOT_AUTHENTICATED_MESSAGE, NOT_AUTHORIZED_MESSAGE } from '@gwent-oss/constants'
import Permissions, { GameAndPlayer } from '../../src/graphql/permissions'
import PresentableError from '../../src/util/presentable-error'
import TestUtil from '../util/test-util'

describe('permissions', () => {
  describe('isAuthenticated', () => {
    const label = 'label'
    it('throws error if context undefined', () => {
      const context: Context = undefined as any as Context
      testIsAuthenticated({
        context,
        label,
        expected: new PresentableError(NOT_AUTHENTICATED_MESSAGE),
        warnCalls: [[`No user on context for ${label}: "${JSON.stringify(context?.session)}".`]],
      })
    })
    it('throws error if session undefined', () => {
      const context: Context = {}
      testIsAuthenticated({
        context,
        label,
        expected: new PresentableError(NOT_AUTHENTICATED_MESSAGE),
        warnCalls: [[`No user on context for ${label}: "${JSON.stringify(context?.session)}".`]],
      })
    })
    it('throws error if user undefined', () => {
      const context: Context = {
        session: {},
      }
      testIsAuthenticated({
        context,
        label,
        expected: new PresentableError(NOT_AUTHENTICATED_MESSAGE),
        warnCalls: [[`No user on context for ${label}: "${JSON.stringify(context?.session)}".`]],
      })
    })
    it('returns user if defined', () => {
      const user = TestUtil.getDbUser({})
      const context: Context = {
        session: {
          user,
        },
      }
      testIsAuthenticated({
        context,
        label,
        expected: user,
      })
    })
  })
  describe('isGamePlayer', () => {
    const label = 'label'
    it('throws error if gameId invalid', async () => {
      const gameId = 'invalid'
      const logPrefix = `isGamePlayer check failed operation "${label}":`
      const message = `Game ID "${gameId}" not a valid MongoDB ObjectId.`
      await testIsGamePlayer({
        gameId,
        label,
        expected: new PresentableError(message),
        warnCalls: [[`${logPrefix} ${message}`]],
        gameByIdCalled: false,
      })
    })
    it('throws error if problem getting game from database', async () => {
      const gameId = new ObjectId().toString()
      const logPrefix = `isGamePlayer check failed operation "${label}":`
      const error = Error('Connection lost')
      await testIsGamePlayer({
        gameId,
        label,
        gameByIdResponse: error,
        expected: new PresentableError(NOT_AUTHORIZED_MESSAGE),
        errorCalls: [[`${logPrefix} Exception attempting to get Game with ID "${gameId}": "${error}"`]],
      })
    })
    it('throws error if game does not exist', async () => {
      const gameId = new ObjectId().toString()
      const logPrefix = `isGamePlayer check failed operation "${label}":`
      await testIsGamePlayer({
        gameId,
        label,
        gameByIdResponse: undefined,
        expected: new PresentableError(NOT_AUTHORIZED_MESSAGE),
        warnCalls: [[`${logPrefix} Game with ID "${gameId}" does not exist.`]],
      })
    })
    it('throws error if user is not a player on the game', async () => {
      const gameId = new ObjectId().toString()
      const userId = new ObjectId()
      const game = TestUtil.getDbGame({
        id: gameId,
      })
      const logPrefix = `isGamePlayer check failed operation "${label}":`
      await testIsGamePlayer({
        gameId,
        userId,
        label,
        gameByIdResponse: game,
        expected: new PresentableError(NOT_AUTHORIZED_MESSAGE),
        warnCalls: [
          [
            `${logPrefix} User "${userId}" not included in game "${gameId}" players: "${JSON.stringify(game.players.map((player) => player.user))}".`,
          ],
        ],
      })
    })
    it('returns game and player if user is first player on game', async () => {
      const gameId = new ObjectId().toString()
      const userId = new ObjectId()
      const player = TestUtil.getDbGamePlayer({
        user: userId,
      })
      const game = TestUtil.getDbGame({
        id: gameId,
        players: [player, TestUtil.getDbGamePlayer({})],
      })
      await testIsGamePlayer({
        gameId,
        userId,
        label,
        gameByIdResponse: game,
        expected: {
          game,
          player,
        },
      })
    })
    it('returns game and player if user is last player on game', async () => {
      const gameId = new ObjectId().toString()
      const userId = new ObjectId()
      const player = TestUtil.getDbGamePlayer({
        user: userId,
      })
      const game = TestUtil.getDbGame({
        id: gameId,
        players: [TestUtil.getDbGamePlayer({}), player],
      })
      await testIsGamePlayer({
        gameId,
        userId,
        label,
        gameByIdResponse: game,
        expected: {
          game,
          player,
        },
      })
    })
  })
  describe('isDeckOwner', () => {
    const label = 'label'
    it('throws error if deckId invalid', async () => {
      const deckId = 'invalid'
      const logPrefix = `isDeckOwner check failed operation "${label}":`
      const message = `Deck ID "${deckId}" not a valid MongoDB ObjectId.`
      await testIsDeckOwner({
        deckId,
        label,
        expected: new PresentableError(message),
        warnCalls: [[`${logPrefix} ${message}`]],
        deckByIdCalled: false,
      })
    })
    it('throws error if problem getting deck from database', async () => {
      const deckId = new ObjectId().toString()
      const logPrefix = `isDeckOwner check failed operation "${label}":`
      const error = Error('Connection lost')
      await testIsDeckOwner({
        deckId,
        label,
        deckByIdResponse: error,
        expected: new PresentableError(NOT_AUTHORIZED_MESSAGE),
        errorCalls: [[`${logPrefix} Exception attempting to get Deck with ID "${deckId}": "${error}"`]],
      })
    })
    it('throws error if deck does not exist', async () => {
      const deckId = new ObjectId().toString()
      const logPrefix = `isDeckOwner check failed operation "${label}":`
      await testIsDeckOwner({
        deckId,
        label,
        deckByIdResponse: undefined,
        expected: new PresentableError(NOT_AUTHORIZED_MESSAGE),
        warnCalls: [[`${logPrefix} Deck with ID "${deckId}" does not exist.`]],
      })
    })
    it('throws error if user is not deck owner', async () => {
      const deckId = new ObjectId().toString()
      const userId = new ObjectId()
      const deck = TestUtil.getDbDeck({
        id: deckId,
      })
      const logPrefix = `isDeckOwner check failed operation "${label}":`
      await testIsDeckOwner({
        deckId,
        userId,
        label,
        deckByIdResponse: deck,
        expected: new PresentableError(NOT_AUTHORIZED_MESSAGE),
        warnCalls: [[`${logPrefix} Deck with ID "${deckId}" not owned by user "${userId}".`]],
      })
    })
    it('returns deck if user is deck owner', async () => {
      const deckId = new ObjectId().toString()
      const userId = new ObjectId()
      const deck = TestUtil.getDbDeck({
        id: deckId,
        user: userId,
      })
      await testIsDeckOwner({
        deckId,
        userId,
        label,
        deckByIdResponse: deck,
        expected: deck,
      })
    })
  })
})

function testIsAuthenticated({
  context,
  label,
  expected,
  warnCalls = [],
}: {
  context: Context
  label: string
  expected: UserDbObject | PresentableError
  warnCalls?: string[][]
}) {
  const warnSpy = jest.fn().mockImplementation()
  Permissions['logger'] = {
    warn: warnSpy,
  } as any

  if (expected instanceof PresentableError) {
    expect(() =>
      Permissions.isAuthenticated({
        context,
        label,
      })
    ).toThrow(expected)
  } else {
    expect(
      Permissions.isAuthenticated({
        context,
        label,
      })
    ).toEqual(expected)
  }

  expect(warnSpy.mock.calls).toEqual(warnCalls)
}

async function testIsGamePlayer({
  gameId,
  userId = new ObjectId(),
  label,
  gameByIdResponse = null,
  expected,
  gameByIdCalled = true,
  warnCalls = [],
  errorCalls = [],
}: {
  gameId: string
  userId?: ObjectId
  label: string
  gameByIdResponse?: GameDbObject | null | Error
  expected: GameAndPlayer | PresentableError
  gameByIdCalled?: boolean
  warnCalls?: string[][]
  errorCalls?: string[][]
}) {
  const gameByIdSpy = jest.spyOn(GameStore, 'getById')
  if (gameByIdResponse instanceof Error) {
    gameByIdSpy.mockRejectedValue(gameByIdResponse)
  } else {
    gameByIdSpy.mockResolvedValue(gameByIdResponse)
  }
  const warnSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  Permissions['logger'] = {
    warn: warnSpy,
    error: errorSpy,
  } as any

  const promise = Permissions.isGamePlayer({
    gameId,
    userId,
    label,
  })
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(gameByIdSpy.mock.calls).toEqual(
    gameByIdCalled
      ? [
          [
            {
              id: gameId,
            },
          ],
        ]
      : []
  )
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}

async function testIsDeckOwner({
  deckId,
  userId = new ObjectId(),
  label,
  deckByIdResponse = null,
  expected,
  deckByIdCalled = true,
  warnCalls = [],
  errorCalls = [],
}: {
  deckId: string
  userId?: ObjectId
  label: string
  deckByIdResponse?: DeckDbObject | null | Error
  expected: DeckDbObject | PresentableError
  deckByIdCalled?: boolean
  warnCalls?: string[][]
  errorCalls?: string[][]
}) {
  const deckByIdSpy = jest.spyOn(DeckStore, 'getById')
  if (deckByIdResponse instanceof Error) {
    deckByIdSpy.mockRejectedValue(deckByIdResponse)
  } else {
    deckByIdSpy.mockResolvedValue(deckByIdResponse)
  }
  const warnSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  Permissions['logger'] = {
    warn: warnSpy,
    error: errorSpy,
  } as any

  const promise = Permissions.isDeckOwner({
    deckId,
    userId,
    label,
  })
  if (expected instanceof PresentableError) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(deckByIdSpy.mock.calls).toEqual(
    deckByIdCalled
      ? [
          [
            {
              id: deckId,
            },
          ],
        ]
      : []
  )
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
