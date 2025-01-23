import * as graphqlSubscriptions from 'graphql-subscriptions'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { Deck, Game } from '@gwent/graphql-schema/resolver-typings'
import EventManager from '../../src/graphql/event-manager'
import { PubSubEvents } from '@gwent/constants'
import SubscriptionResolver, {
  DeckAddedPayload,
  DeckSetPayload,
  GameAddedPayload,
  GameReadyPayload,
  GameSetPayload,
  OrderSetPayload,
  PassPlayedPayload,
  RoundEndedForDeckPayload,
  UnitPlayedFromDeckPayload,
  UnitPlayedOnGamePayload,
  UnitRedrawnPayload,
} from '../../src/graphql/resolvers/subscription-resolver'
import TestUtil from '../test-util'
import * as utils from '@gwent/utils'

describe('subscription-resolver', () => {
  describe('getResolvers', () => {
    it('returns subscriptions with calls to withFilter', () => {
      const withFilterSpy = jest.spyOn(graphqlSubscriptions, 'withFilter').mockReturnValue((() => {}) as any)
      const asyncIteratorSpy = jest.spyOn(EventManager.pubsub, 'asyncIterableIterator').mockReturnValue('' as any)
      const filterDeckOwnerSpy = jest.spyOn(SubscriptionResolver as any, 'filterDeckOwner').mockResolvedValue('')
      const filterPlayerOnGameSpy = jest.spyOn(SubscriptionResolver as any, 'filterPlayerOnGame').mockResolvedValue('')
      const result = SubscriptionResolver.getResolvers()
      expect(result).toEqual({
        deckAdded: {
          subscribe: expect.any(Function),
        },
        deckSet: {
          subscribe: expect.any(Function),
        },
        gameAdded: {
          subscribe: expect.any(Function),
        },
        gameReady: {
          subscribe: expect.any(Function),
        },
        gameSet: {
          subscribe: expect.any(Function),
        },
        orderSet: {
          subscribe: expect.any(Function),
        },
        passPlayed: {
          subscribe: expect.any(Function),
        },
        roundEndedForDeck: {
          subscribe: expect.any(Function),
        },
        unitPlayedFromDeck: {
          subscribe: expect.any(Function),
        },
        unitPlayedOnGame: {
          subscribe: expect.any(Function),
        },
        unitRedrawn: {
          subscribe: expect.any(Function),
        },
      })

      if (
        result.deckAdded &&
        result.deckSet &&
        result.gameAdded &&
        result.gameReady &&
        result.gameSet &&
        result.orderSet &&
        result.passPlayed &&
        result.roundEndedForDeck &&
        result.unitPlayedFromDeck &&
        result.unitPlayedOnGame &&
        result.unitRedrawn
      ) {
        expect((result.deckAdded as any).subscribe()).toEqual(undefined)
        expect((result.deckSet as any).subscribe()).toEqual(undefined)
        expect((result.gameAdded as any).subscribe()).toEqual(undefined)
        expect((result.gameReady as any).subscribe()).toEqual(undefined)
        expect((result.gameSet as any).subscribe()).toEqual(undefined)
        expect((result.orderSet as any).subscribe()).toEqual(undefined)
        expect((result.passPlayed as any).subscribe()).toEqual(undefined)
        expect((result.roundEndedForDeck as any).subscribe()).toEqual(undefined)
        expect((result.unitPlayedFromDeck as any).subscribe()).toEqual(undefined)
        expect((result.unitPlayedOnGame as any).subscribe()).toEqual(undefined)
        expect((result.unitRedrawn as any).subscribe()).toEqual(undefined)

        expect(withFilterSpy.mock.calls).toEqual([
          [expect.any(Function), expect.any(Function)],
          [expect.any(Function), expect.any(Function)],
          [expect.any(Function), expect.any(Function)],
          [expect.any(Function), expect.any(Function)],
          [expect.any(Function), expect.any(Function)],
          [expect.any(Function), expect.any(Function)],
          [expect.any(Function), expect.any(Function)],
          [expect.any(Function), expect.any(Function)],
          [expect.any(Function), expect.any(Function)],
          [expect.any(Function), expect.any(Function)],
          [expect.any(Function), expect.any(Function)],
        ])
        expect(asyncIteratorSpy.mock.calls).toEqual([])

        withFilterSpy.mock.calls[0][0]()
        withFilterSpy.mock.calls[1][0]()
        withFilterSpy.mock.calls[2][0]()
        withFilterSpy.mock.calls[3][0]()
        withFilterSpy.mock.calls[4][0]()
        withFilterSpy.mock.calls[5][0]()
        withFilterSpy.mock.calls[6][0]()
        withFilterSpy.mock.calls[7][0]()
        withFilterSpy.mock.calls[8][0]()
        withFilterSpy.mock.calls[9][0]()
        withFilterSpy.mock.calls[10][0]()

        expect(asyncIteratorSpy.mock.calls).toEqual([
          [[PubSubEvents.DeckAdded]],
          [[PubSubEvents.DeckSet]],
          [[PubSubEvents.GameAdded]],
          [[PubSubEvents.GameReady]],
          [[PubSubEvents.GameSet]],
          [[PubSubEvents.OrderSet]],
          [[PubSubEvents.PassPlayed]],
          [[PubSubEvents.RoundEndedForDeck]],
          [[PubSubEvents.UnitPlayedFromDeck]],
          [[PubSubEvents.UnitPlayedOnGame]],
          [[PubSubEvents.UnitRedrawn]],
        ])
        expect(filterDeckOwnerSpy.mock.calls).toEqual([])
        expect(filterPlayerOnGameSpy.mock.calls).toEqual([])

        const deckAddedPayload: DeckAddedPayload = { deckAdded: TestUtil.getDeck({}) }
        const deckSetPayload: DeckSetPayload = {
          deckSet: {
            deck: TestUtil.getGameDeck({}),
            game: TestUtil.getGame({}),
          },
        }
        const gameAddedPayload: GameAddedPayload = { gameAdded: TestUtil.getGame({}) }
        const gameReadyPayload: GameReadyPayload = { gameReady: TestUtil.getGame({}) }
        const gameSetPayload: GameSetPayload = { gameSet: TestUtil.getGame({}) }
        const orderSetPayload: OrderSetPayload = { orderSet: TestUtil.getGame({}) }
        const passPlayedPayload: PassPlayedPayload = { passPlayed: TestUtil.getGame({}) }
        const roundEndedForDeckPayload: RoundEndedForDeckPayload = {
          roundEndedForDeck: {
            deck: TestUtil.getGameDeck({}),
            game: TestUtil.getGame({}),
          },
        }
        const unitPlayedFromDeckPayload: UnitPlayedFromDeckPayload = {
          unitPlayedFromDeck: {
            deck: TestUtil.getGameDeck({}),
            game: TestUtil.getGame({}),
            unit: TestUtil.getDeckUnit({}),
          },
        }
        const unitPlayedOnGamePayload: UnitPlayedOnGamePayload = {
          unitPlayedOnGame: {
            game: TestUtil.getGame({}),
            unit: TestUtil.getDeckUnit({}),
          },
        }
        const unitRedrawnPayload: UnitRedrawnPayload = {
          unitRedrawn: {
            from: TestUtil.getDeckUnit({}),
            deck: TestUtil.getGameDeck({}),
            game: TestUtil.getGame({}),
            to: TestUtil.getDeckUnit({}),
          },
        }
        const context: Context = {
          session: {
            user: TestUtil.getDbUser({}),
          },
        }
        withFilterSpy.mock.calls[0][1](deckAddedPayload, undefined, context)
        withFilterSpy.mock.calls[1][1](deckSetPayload, undefined, context)
        withFilterSpy.mock.calls[2][1](gameAddedPayload, undefined, context)
        withFilterSpy.mock.calls[3][1](gameReadyPayload, undefined, context)
        withFilterSpy.mock.calls[4][1](gameSetPayload, undefined, context)
        withFilterSpy.mock.calls[5][1](orderSetPayload, undefined, context)
        withFilterSpy.mock.calls[6][1](passPlayedPayload, undefined, context)
        withFilterSpy.mock.calls[7][1](roundEndedForDeckPayload, undefined, context)
        withFilterSpy.mock.calls[8][1](unitPlayedFromDeckPayload, undefined, context)
        withFilterSpy.mock.calls[9][1](unitPlayedOnGamePayload, undefined, context)
        withFilterSpy.mock.calls[10][1](unitRedrawnPayload, undefined, context)

        expect(filterDeckOwnerSpy.mock.calls).toEqual([
          [
            {
              ctx: context,
              payload: deckAddedPayload,
              subscriptionName: 'deckAdded',
            },
          ],
          [
            {
              ctx: context,
              payload: deckSetPayload,
              subscriptionName: 'deckSet',
              nestedDeckPath: 'deck.from',
            },
          ],
          [
            {
              ctx: context,
              payload: roundEndedForDeckPayload,
              subscriptionName: 'roundEndedForDeck',
              nestedDeckPath: 'deck.from',
            },
          ],
          [
            {
              ctx: context,
              payload: unitPlayedFromDeckPayload,
              subscriptionName: 'unitPlayedFromDeck',
              nestedDeckPath: 'deck.from',
            },
          ],
          [
            {
              ctx: context,
              payload: unitRedrawnPayload,
              subscriptionName: 'unitRedrawn',
              nestedDeckPath: 'deck.from',
            },
          ],
        ])
        expect(filterPlayerOnGameSpy.mock.calls).toEqual([
          [
            {
              ctx: context,
              payload: deckSetPayload,
              subscriptionName: 'deckSet',
              nestedGamePath: 'game',
            },
          ],
          [
            {
              ctx: context,
              payload: gameAddedPayload,
              subscriptionName: 'gameAdded',
            },
          ],
          [
            {
              ctx: context,
              payload: gameReadyPayload,
              subscriptionName: 'gameReady',
            },
          ],
          [
            {
              ctx: context,
              payload: gameSetPayload,
              subscriptionName: 'gameSet',
            },
          ],
          [
            {
              ctx: context,
              payload: orderSetPayload,
              subscriptionName: 'orderSet',
            },
          ],
          [
            {
              ctx: context,
              payload: passPlayedPayload,
              subscriptionName: 'passPlayed',
            },
          ],
          [
            {
              ctx: context,
              payload: roundEndedForDeckPayload,
              subscriptionName: 'roundEndedForDeck',
              nestedGamePath: 'game',
            },
          ],
          [
            {
              ctx: context,
              payload: unitPlayedOnGamePayload,
              subscriptionName: 'unitPlayedOnGame',
              nestedGamePath: 'game',
            },
          ],
          [
            {
              ctx: context,
              payload: unitRedrawnPayload,
              subscriptionName: 'unitRedrawn',
              nestedGamePath: 'game',
            },
          ],
        ])
      } else {
        expect('should not get here').toEqual(undefined)
      }
    })
  })
  describe('filterDeckOwner', () => {
    const subscriptionName = 'test'
    const userId = new ObjectId()
    const deck = TestUtil.getDeck({
      user: TestUtil.getUser({
        id: userId,
      }),
    })
    it('returns false if no user on context', () => {
      const deck = TestUtil.getDeck({})
      testFilterDeckOwner({
        subscriptionName,
        deck,
        expected: false,
        debugCalls: [[`Not publishing ${subscriptionName} for deck "${deck.id}": No user on context.`]],
      })
    })
    it('returns false if user not deck owner', () => {
      const unownedDeck = TestUtil.getDeck({})
      testFilterDeckOwner({
        subscriptionName,
        userId,
        deck: unownedDeck,
        expected: false,
        debugCalls: [
          [
            `Not publishing ${subscriptionName} for deck "${unownedDeck.id}": User "${userId}" is not the deck owner "${unownedDeck.user.id}".`,
          ],
        ],
      })
    })
    it('returns true if user is deck owner', () => {
      testFilterDeckOwner({
        subscriptionName,
        userId,
        deck,
        expected: true,
        debugCalls: [[`Publishing ${subscriptionName} for deck "${deck.id}" to user "${userId}".`]],
      })
    })
    it('uses correct nestedProperty if nestedDeckPath specified', () => {
      testFilterDeckOwner({
        subscriptionName,
        userId,
        deck,
        nestedDeckPath: 'nested',
        expected: true,
        debugCalls: [[`Publishing ${subscriptionName} for deck "${deck.id}" to user "${userId}".`]],
      })
    })
    it('logs to trace if enabled', () => {
      testFilterDeckOwner({
        subscriptionName,
        userId,
        deck,
        expected: true,
        debugCalls: [[`Publishing ${subscriptionName} for deck "${deck.id}" to user "${userId}".`]],
        traceEnabled: true,
      })
    })
  })
  describe('filterPlayerOnGame', () => {
    const subscriptionName = 'test'
    const userId = new ObjectId()
    const game = TestUtil.getGame({
      players: [
        TestUtil.getGamePlayer({
          user: TestUtil.getUser({
            id: userId,
          }),
        }),
      ],
    })
    it('returns false if no user on context', () => {
      testFilterPlayerOnGame({
        subscriptionName,
        game,
        expected: false,
        debugCalls: [[`Not publishing ${subscriptionName} for game "${game.id}": No user on context.`]],
      })
    })
    it('returns false if user not game player', () => {
      const nonPlayerGame = TestUtil.getGame({})
      testFilterPlayerOnGame({
        subscriptionName,
        userId,
        game: nonPlayerGame,
        expected: false,
        debugCalls: [
          [`Not publishing ${subscriptionName} for game "${nonPlayerGame.id}": User "${userId}" not a player on game.`],
        ],
      })
    })
    it('returns true if user game player', () => {
      testFilterPlayerOnGame({
        subscriptionName,
        userId,
        game,
        expected: true,
        debugCalls: [[`Publishing ${subscriptionName} for game "${game.id}" to user "${userId}".`]],
      })
    })
    it('uses correct nestedProperty if nestedDeckPath specified', () => {
      testFilterPlayerOnGame({
        subscriptionName,
        userId,
        game,
        nestedGamePath: 'nested',
        expected: true,
        debugCalls: [[`Publishing ${subscriptionName} for game "${game.id}" to user "${userId}".`]],
      })
    })
    it('returns true if user game player', () => {
      testFilterPlayerOnGame({
        subscriptionName,
        userId,
        game,
        expected: true,
        debugCalls: [[`Publishing ${subscriptionName} for game "${game.id}" to user "${userId}".`]],
        traceEnabled: true,
      })
    })
  })
})

function testFilterDeckOwner({
  userId,
  payload,
  nestedDeckPath,
  subscriptionName,
  deck,
  expected,
  debugCalls = [],
  traceEnabled,
}: {
  userId?: ObjectId
  payload?: any
  nestedDeckPath?: string
  subscriptionName: string
  deck: Deck
  expected: boolean
  debugCalls?: string[][]
  traceEnabled?: boolean
}) {
  const ctx: Context = {
    session: {},
  }
  if (userId && ctx.session) {
    ctx.session.user = TestUtil.getDbUser({
      id: userId,
    })
  }

  const getNestedPropertySpy = jest.spyOn(utils, 'getNestedProperty').mockReturnValue(deck)

  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SubscriptionResolver['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  expect(
    SubscriptionResolver['filterDeckOwner']({
      ctx,
      nestedDeckPath,
      payload,
      subscriptionName,
    })
  ).toEqual(expected)

  expect(getNestedPropertySpy.mock.calls).toEqual([
    [
      {
        obj: payload,
        nestedProperty: `${subscriptionName}${nestedDeckPath ? `.${nestedDeckPath}` : ''}`,
      },
    ],
  ])
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${subscriptionName} filterDeckOwner payload: "${JSON.stringify(payload)}"`],
          [`${subscriptionName} filterDeckOwner ctx: "${JSON.stringify(ctx)}"`],
          [`${subscriptionName} filterDeckOwner subscriptionName: "${subscriptionName}"`],
          [`${subscriptionName} filterDeckOwner nestedDeckPath: "${nestedDeckPath}"`],
        ]
      : []
  )
}

function testFilterPlayerOnGame({
  userId,
  payload,
  nestedGamePath,
  subscriptionName,
  game,
  expected,
  debugCalls = [],
  traceEnabled,
}: {
  userId?: ObjectId
  payload?: any
  nestedGamePath?: string
  subscriptionName: string
  game: Game
  expected: boolean
  debugCalls?: string[][]
  traceEnabled?: boolean
}) {
  const ctx: Context = {
    session: {},
  }
  if (userId && ctx.session) {
    ctx.session.user = TestUtil.getDbUser({
      id: userId,
    })
  }

  const getNestedPropertySpy = jest.spyOn(utils, 'getNestedProperty').mockReturnValue(game)

  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SubscriptionResolver['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  expect(
    SubscriptionResolver['filterPlayerOnGame']({
      ctx,
      nestedGamePath,
      payload,
      subscriptionName,
    })
  ).toEqual(expected)

  expect(getNestedPropertySpy.mock.calls).toEqual([
    [
      {
        obj: payload,
        nestedProperty: `${subscriptionName}${nestedGamePath ? `.${nestedGamePath}` : ''}`,
      },
    ],
  ])
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${subscriptionName} filterPlayerOnGame payload: "${JSON.stringify(payload)}"`],
          [`${subscriptionName} filterPlayerOnGame ctx: "${JSON.stringify(ctx)}"`],
          [`${subscriptionName} filterPlayerOnGame subscriptionName: "${subscriptionName}"`],
          [`${subscriptionName} filterPlayerOnGame nestedGamePath: "${nestedGamePath}"`],
        ]
      : []
  )
}
