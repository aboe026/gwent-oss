import { ObjectId } from 'mongodb'

import { NO_RULE_DEFINED, Permissions } from '../../src/graphql/permissions'
import { MAX_ROUNDS, NOT_AUTHENTICATED_MESSAGE, NOT_AUTHORIZED_MESSAGE } from '@gwent/constants'
import { GraphQLResolveInfo } from 'graphql'
import GameStore from '../../src/database/stores/game-store'
import { DeckDbObject, GameDbObject, UnitStats } from '@gwent/graphql-schema/database-typings'
import DeckStore from '../../src/database/stores/deck-store'

describe('permissions', () => {
  describe('fallback', () => {
    const fieldName = 'new'
    it('returns false if parentType is Query', () => {
      testFallback({
        info: {
          fieldName,
          parentType: {
            name: 'Query',
          },
        } as any as GraphQLResolveInfo,
        expected: Error(NO_RULE_DEFINED),
        errorCalls: [[`fallback hit because no rule defined for Query "${fieldName}"`]],
      })
    })
    it('returns false if parentType is Mutation', () => {
      testFallback({
        info: {
          fieldName,
          parentType: {
            name: 'Mutation',
          },
        } as any as GraphQLResolveInfo,
        expected: Error(NO_RULE_DEFINED),
        errorCalls: [[`fallback hit because no rule defined for Mutation "${fieldName}"`]],
      })
    })
    it('returns true if parentType is neither Query or Mutation', () => {
      testFallback({
        info: {
          fieldName,
          parentType: {
            name: 'User',
          },
        } as any as GraphQLResolveInfo,
        expected: true,
      })
    })
  })
  describe('isAuthenticated', () => {
    const info = {
      fieldName: 'currentUser',
    } as any as GraphQLResolveInfo
    it('returns error if context undefined', () => {
      testIsAuthenticated({
        context: undefined,
        info,
        expected: Error(NOT_AUTHENTICATED_MESSAGE),
        debugCalls: [
          [
            `isAuthenticated failed operation "${info.fieldName}" due to no user on session: "${JSON.stringify(
              undefined
            )}"`,
          ],
        ],
      })
    })
    it('returns error if session undefined', () => {
      testIsAuthenticated({
        context: {
          session: undefined,
        },
        info,
        expected: Error(NOT_AUTHENTICATED_MESSAGE),
        debugCalls: [
          [
            `isAuthenticated failed operation "${info.fieldName}" due to no user on session: "${JSON.stringify(
              undefined
            )}"`,
          ],
        ],
      })
    })
    it('returns error if user undefined', () => {
      testIsAuthenticated({
        context: {
          session: {
            user: undefined,
          },
        },
        info,
        expected: Error(NOT_AUTHENTICATED_MESSAGE),
        debugCalls: [
          [
            `isAuthenticated failed operation "${info.fieldName}" due to no user on session: "${JSON.stringify(
              undefined
            )}"`,
          ],
        ],
      })
    })
    it('returns error if id undefined', () => {
      testIsAuthenticated({
        context: {
          session: {
            user: {
              _id: undefined,
            },
          },
        },
        info,
        expected: Error(NOT_AUTHENTICATED_MESSAGE),
        debugCalls: [
          [`isAuthenticated failed operation "${info.fieldName}" due to no user on session: "${JSON.stringify({})}"`],
        ],
      })
    })
    it('returns true if user defined on session', () => {
      testIsAuthenticated({
        context: {
          session: {
            user: {
              _id: new ObjectId(),
            },
          },
        },
        info,
        expected: true,
      })
    })
  })
  describe('isPlayer', () => {
    const fieldName = 'gameDeck'
    it('returns error if no user id on context', async () => {
      await testIsPlayer({
        fieldName,
        userId: null,
        error: NOT_AUTHORIZED_MESSAGE,
        getByIdCalls: [],
        debugCalls: [
          [
            `isPlayer check failed operation "${fieldName}" due to not being able to extract user ID from context: "${JSON.stringify(
              {
                _id: null,
              }
            )}"`,
          ],
        ],
      })
    })
    it('returns error if game id is not valid ObjectId', async () => {
      const gameId = 'invalid'
      await testIsPlayer({
        fieldName,
        gameId,
        error: NOT_AUTHORIZED_MESSAGE,
        getByIdCalls: [],
        debugCalls: [
          [`isPlayer check failed operation "${fieldName}" due to gameId "${gameId}" not being a valid ObjectId.`],
        ],
      })
    })
    it('returns error if error thrown getting game', async () => {
      const gameId = new ObjectId().toString()
      const error = 'network timeout'
      await testIsPlayer({
        fieldName,
        gameId,
        gameError: error,
        error: NOT_AUTHORIZED_MESSAGE,
        errorCalls: [
          [
            `isPlayer check failed operation "${fieldName}" due to exception attempting to get game with ID "${gameId}": "${Error(
              error
            )}"`,
          ],
        ],
      })
    })
    it('returns error if game does not exist', async () => {
      const gameId = new ObjectId().toString()
      await testIsPlayer({
        fieldName,
        gameId,
        gameResponse: undefined,
        error: NOT_AUTHORIZED_MESSAGE,
        debugCalls: [[`isPlayer check failed operation "${fieldName}" due to game with ID "${gameId}" not existing.`]],
      })
    })
    it('returns error if user is not a player on game', async () => {
      const userId = new ObjectId()
      const gameId = new ObjectId().toString()
      const player1 = new ObjectId()
      const player2 = new ObjectId()
      const game: GameDbObject = {
        _id: new ObjectId(gameId),
        created: new Date(),
        creator: player1,
        players: [
          {
            deck: {
              discard: [],
              hand: [],
              redraws: [],
              undrawn: [],
            },
            ready: false,
            rounds: [],
            user: player1,
          },
          {
            deck: {
              discard: [],
              hand: [],
              redraws: [],
              undrawn: [],
            },
            ready: false,
            rounds: [],
            user: player2,
          },
        ],
        round: {
          current: 0,
          maximum: MAX_ROUNDS,
        },
        updated: new Date(),
        victors: [],
      }
      await testIsPlayer({
        fieldName,
        userId,
        gameId,
        gameResponse: game,
        error: NOT_AUTHORIZED_MESSAGE,
        debugCalls: [
          [
            `isPlayer check failed operation "${fieldName}" due to user "${userId}" not included in game "${gameId}" players: "["${player1}","${player2}"]".`,
          ],
        ],
      })
    })
    it('returns true if user is creator of game', async () => {
      const userId = new ObjectId()
      const gameId = new ObjectId().toString()
      const game: GameDbObject = {
        _id: new ObjectId(gameId),
        created: new Date(),
        creator: userId,
        players: [
          {
            deck: {
              discard: [],
              hand: [],
              redraws: [],
              undrawn: [],
            },
            ready: false,
            rounds: [],
            user: userId,
          },
          {
            deck: {
              discard: [],
              hand: [],
              redraws: [],
              undrawn: [],
            },
            ready: false,
            rounds: [],
            user: new ObjectId(),
          },
        ],
        round: {
          current: 0,
          maximum: MAX_ROUNDS,
        },
        updated: new Date(),
        victors: [],
      }
      await testIsPlayer({
        fieldName,
        userId,
        gameId,
        gameResponse: game,
      })
    })
    it('returns true if user is participant on game', async () => {
      const userId = new ObjectId()
      const gameId = new ObjectId().toString()
      const game: GameDbObject = {
        _id: new ObjectId(gameId),
        created: new Date(),
        creator: new ObjectId(),
        players: [
          {
            deck: {
              discard: [],
              hand: [],
              redraws: [],
              undrawn: [],
            },
            ready: false,
            rounds: [],
            user: new ObjectId(),
          },
          {
            deck: {
              discard: [],
              hand: [],
              redraws: [],
              undrawn: [],
            },
            ready: false,
            rounds: [],
            user: userId,
          },
        ],
        round: {
          current: 0,
          maximum: MAX_ROUNDS,
        },
        updated: new Date(),
        victors: [],
      }
      await testIsPlayer({
        fieldName,
        userId,
        gameId,
        gameResponse: game,
      })
    })
  })
  describe('ownsDeck', () => {
    const fieldName = 'setDeck'
    it('returns error if no user on session', async () => {
      await testOwnsDeck({
        fieldName,
        userId: null,
        error: NOT_AUTHORIZED_MESSAGE,
        getByIdsCalls: [],
        debugCalls: [
          [
            `ownsDeck check failed operation "${fieldName}" due to not being able to extract user ID from context: "${JSON.stringify(
              {
                _id: null,
              }
            )}"`,
          ],
        ],
      })
    })
    it('returns error if deck ID is not valid ObjectId', async () => {
      const deckId = 'invalid'
      await testOwnsDeck({
        fieldName,
        deckId,
        error: NOT_AUTHORIZED_MESSAGE,
        getByIdsCalls: [],
        debugCalls: [
          [`ownsDeck check failed operation "${fieldName}" due to deckId "${deckId}" not being a valid ObjectId.`],
        ],
      })
    })
    it('returns error if DeckStore getByIds throws error', async () => {
      const deckId = new ObjectId().toString()
      const error = 'network timeout'
      await testOwnsDeck({
        fieldName,
        deckId,
        decksError: error,
        error: NOT_AUTHORIZED_MESSAGE,
        errorCalls: [
          [
            `ownsDeck check failed operation "${fieldName}" due to exception attempting to get deck with ID "${deckId}": "${Error(
              error
            )}"`,
          ],
        ],
      })
    })
    it('returns error if DeckStore getByIds returns undefined', async () => {
      const deckId = new ObjectId().toString()
      await testOwnsDeck({
        fieldName,
        deckId,
        deckResponse: undefined,
        error: NOT_AUTHORIZED_MESSAGE,
        debugCalls: [[`ownsDeck check failed operation "${fieldName}" due to deck with ID "${deckId}" not existing.`]],
      })
    })
    it('returns error if DeckStore getById returns undefined', async () => {
      const deckId = new ObjectId().toString()
      await testOwnsDeck({
        fieldName,
        deckId,
        deckResponse: undefined,
        error: NOT_AUTHORIZED_MESSAGE,
        debugCalls: [[`ownsDeck check failed operation "${fieldName}" due to deck with ID "${deckId}" not existing.`]],
      })
    })
    it('returns error if deck user does not match context user', async () => {
      const userId = new ObjectId()
      const deckId = new ObjectId().toString()
      const deck: DeckDbObject = {
        _id: new ObjectId(deckId),
        created: new Date(),
        faction: new ObjectId(),
        leader: new ObjectId(),
        name: 'deck-name',
        // have "getFakeStats" method
        stats: {} as UnitStats,
        units: [],
        user: new ObjectId(),
      }
      await testOwnsDeck({
        fieldName,
        userId,
        deckId,
        deckResponse: deck,
        error: NOT_AUTHORIZED_MESSAGE,
        debugCalls: [
          [
            `ownsDeck check failed operation "${fieldName}" due to deck with ID "${deckId}" not being owned by user "${userId}".`,
          ],
        ],
      })
    })
    it('returns true if deck user matches context user', async () => {
      const userId = new ObjectId()
      const deckId = new ObjectId().toString()
      const deck: DeckDbObject = {
        _id: new ObjectId(deckId),
        created: new Date(),
        faction: new ObjectId(),
        leader: new ObjectId(),
        name: 'deck-name',
        // have "getFakeStats" method
        stats: {} as UnitStats,
        units: [],
        user: userId,
      }
      await testOwnsDeck({
        fieldName,
        userId,
        deckId,
        deckResponse: deck,
      })
    })
  })
})

function testFallback({
  info,
  expected,
  errorCalls = [],
}: {
  info: GraphQLResolveInfo
  expected: Error | boolean
  errorCalls?: any[][]
}) {
  const errorSpy = jest.fn().mockImplementation()
  Permissions['logger'] = {
    error: errorSpy,
  } as any

  expect(Permissions.fallback(undefined, undefined, undefined, info)).toEqual(expected)

  expect(errorSpy.mock.calls).toEqual(errorCalls)
}

function testIsAuthenticated({
  context,
  info,
  expected,
  debugCalls = [],
}: {
  context: any
  info: GraphQLResolveInfo
  expected: Error | boolean
  debugCalls?: any[][]
}) {
  const debugSpy = jest.fn().mockImplementation()
  Permissions['logger'] = {
    debug: debugSpy,
  } as any

  expect(Permissions.isAuthenticated(undefined, undefined, context, info)).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
}

async function testIsPlayer({
  userId,
  gameId,
  fieldName,
  gameError,
  gameResponse,
  error,
  getByIdCalls,
  debugCalls = [],
  errorCalls = [],
}: {
  userId?: ObjectId | null
  gameId?: string
  fieldName: string
  gameError?: string
  gameResponse?: GameDbObject
  error?: string
  getByIdCalls?: any[][]
  debugCalls?: any[][]
  errorCalls?: any[][]
}) {
  if (userId === undefined) {
    userId = new ObjectId()
  }
  const context = {
    session: {
      user: {
        _id: userId,
      },
    },
  }
  const args = {
    game: gameId,
  }
  const info = {
    fieldName,
  }
  const getByIdSpy = jest.spyOn(GameStore, 'getById')
  if (gameError) {
    getByIdSpy.mockRejectedValue(Error(gameError))
  } else {
    getByIdSpy.mockResolvedValue(gameResponse as any)
  }
  const debugSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  Permissions['logger'] = {
    debug: debugSpy,
    error: errorSpy,
  } as any

  await expect(Permissions.isPlayer(undefined, args, context, info as any)).resolves.toEqual(
    error ? Error(error) : true
  )

  expect(getByIdSpy.mock.calls).toEqual(
    getByIdCalls || [
      [
        {
          id: gameId,
          options: {
            projection: {
              _id: 0,
              players: 1,
            },
          },
        },
      ],
    ]
  )
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}

async function testOwnsDeck({
  userId,
  deckId,
  fieldName,
  decksError,
  deckResponse,
  error,
  getByIdsCalls,
  debugCalls = [],
  errorCalls = [],
}: {
  userId?: ObjectId | null
  deckId?: string
  fieldName: string
  decksError?: string
  deckResponse?: DeckDbObject
  error?: string
  getByIdsCalls?: any[][]
  debugCalls?: any[][]
  errorCalls?: any[][]
}) {
  if (userId === undefined) {
    userId = new ObjectId()
  }
  const context = {
    session: {
      user: {
        _id: userId,
      },
    },
  }
  const args = {
    deck: deckId,
  }
  const info = {
    fieldName,
  }
  const getByIdSpy = jest.spyOn(DeckStore, 'getById')
  if (decksError) {
    getByIdSpy.mockRejectedValue(Error(decksError))
  } else {
    getByIdSpy.mockResolvedValue(deckResponse as any)
  }
  const debugSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  Permissions['logger'] = {
    debug: debugSpy,
    error: errorSpy,
  } as any

  await expect(Permissions.ownsDeck(undefined, args, context, info as any)).resolves.toEqual(
    error ? Error(error) : true
  )

  expect(getByIdSpy.mock.calls).toEqual(
    getByIdsCalls || [
      [
        {
          id: deckId,
          options: {
            projection: {
              _id: 0,
              user: 1,
            },
          },
        },
      ],
    ]
  )
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
