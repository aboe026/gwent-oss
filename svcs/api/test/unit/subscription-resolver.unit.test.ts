import * as graphqlSubscriptions from 'graphql-subscriptions'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import EventManager from '../../src/graphql/event-manager'
import { Game, GameDeck, GamePlayer } from '@gwent/graphql-schema/resolver-typings'
import { PubSubEvents } from '@gwent/constants'
import SubscriptionResolver, {
  DeckAddedPayload,
  DeckSetPayload,
  GameAddedPayload,
  GameReadyPayload,
  GameSetPayload,
  OrderSetPayload,
  UnitRedrawnPayload,
} from '../../src/graphql/resolvers/subscription-resolver'
import TestUtil from '../test-util'

describe('subscription-resolver', () => {
  describe('getResolvers', () => {
    it('returns subscriptions with calls to withFilter', () => {
      const withFilterSpy = jest.spyOn(graphqlSubscriptions, 'withFilter').mockReturnValue((() => {}) as any)
      const asyncIteratorSpy = jest.spyOn(EventManager.pubsub, 'asyncIterableIterator').mockReturnValue('' as any)
      const filterDeckAddedSpy = jest.spyOn(SubscriptionResolver as any, 'filterDeckAdded').mockResolvedValue('')
      const filterDeckSetSpy = jest.spyOn(SubscriptionResolver as any, 'filterDeckSet').mockResolvedValue('')
      const filterGameAddedSpy = jest.spyOn(SubscriptionResolver as any, 'filterGameAdded').mockResolvedValue('')
      const filterGameReadySpy = jest.spyOn(SubscriptionResolver as any, 'filterGameReady').mockResolvedValue('')
      const filterGameSetSpy = jest.spyOn(SubscriptionResolver as any, 'filterGameSet').mockResolvedValue('')
      const filterOrderSetSpy = jest.spyOn(SubscriptionResolver as any, 'filterOrderSet').mockResolvedValue('')
      const filterUnitRedrawnSpy = jest.spyOn(SubscriptionResolver as any, 'filterUnitRedrawn').mockResolvedValue('')
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
        result.unitRedrawn
      ) {
        expect((result.deckAdded as any).subscribe()).toEqual(undefined)
        expect((result.deckSet as any).subscribe()).toEqual(undefined)
        expect((result.gameAdded as any).subscribe()).toEqual(undefined)
        expect((result.gameReady as any).subscribe()).toEqual(undefined)
        expect((result.gameSet as any).subscribe()).toEqual(undefined)
        expect((result.orderSet as any).subscribe()).toEqual(undefined)
        expect((result.unitRedrawn as any).subscribe()).toEqual(undefined)

        expect(withFilterSpy.mock.calls).toEqual([
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

        expect(asyncIteratorSpy.mock.calls).toEqual([
          [[PubSubEvents.DeckAdded]],
          [[PubSubEvents.DeckSet]],
          [[PubSubEvents.GameAdded]],
          [[PubSubEvents.GameReady]],
          [[PubSubEvents.GameSet]],
          [[PubSubEvents.OrderSet]],
          [[PubSubEvents.UnitRedrawn]],
        ])
        expect(filterDeckAddedSpy.mock.calls).toEqual([])
        expect(filterDeckSetSpy.mock.calls).toEqual([])
        expect(filterGameAddedSpy.mock.calls).toEqual([])
        expect(filterGameReadySpy.mock.calls).toEqual([])
        expect(filterGameSetSpy.mock.calls).toEqual([])
        expect(filterOrderSetSpy.mock.calls).toEqual([])
        expect(filterUnitRedrawnSpy.mock.calls).toEqual([])

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
        const unitRedrawnPayload: UnitRedrawnPayload = {
          unitRedrawn: {
            from: TestUtil.getDeckUnit({}),
            game: TestUtil.getGame({}),
            ownerId: new ObjectId(),
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
        withFilterSpy.mock.calls[6][1](unitRedrawnPayload, undefined, context)

        expect(filterDeckAddedSpy.mock.calls).toEqual([[deckAddedPayload, context]])
        expect(filterDeckSetSpy.mock.calls).toEqual([[deckSetPayload, context]])
        expect(filterGameAddedSpy.mock.calls).toEqual([[gameAddedPayload, context]])
        expect(filterGameReadySpy.mock.calls).toEqual([[gameReadyPayload, context]])
        expect(filterGameSetSpy.mock.calls).toEqual([[gameSetPayload, context]])
        expect(filterOrderSetSpy.mock.calls).toEqual([[orderSetPayload, context]])
        expect(filterUnitRedrawnSpy.mock.calls).toEqual([[unitRedrawnPayload, context]])
      } else {
        expect('should not get here').toEqual(undefined)
      }
    })
  })
  describe('filterDeckAdded', () => {
    it('returns false if no user on context', () => {
      const deckId = new ObjectId()
      testFilterDeckAdded({
        deckId: deckId.toString(),
        deckOwner: new ObjectId().toString(),
        userId: undefined,
        expected: false,
        debugCalls: [[`Not publishing deckAdded for deck "${deckId}": No user on context.`]],
      })
    })
    it('returns false if user does not match deck owner', () => {
      const deckId = new ObjectId()
      const deckOwner = new ObjectId()
      const userId = new ObjectId()
      testFilterDeckAdded({
        deckId: deckId.toString(),
        deckOwner: deckOwner.toString(),
        userId,
        expected: false,
        debugCalls: [
          [`Not publishing deckAdded for deck "${deckId}": User "${userId}" is not the deck owner "${deckOwner}".`],
        ],
      })
    })
    it('returns true if user matches deck owner', () => {
      const deckId = new ObjectId()
      const deckOwner = new ObjectId()
      testFilterDeckAdded({
        deckId: deckId.toString(),
        deckOwner: deckOwner.toString(),
        userId: deckOwner,
        expected: true,
        debugCalls: [[`Publishing deckAdded for deck "${deckId}" to user "${deckOwner}".`]],
      })
    })
    it('logs to trace if enabled', () => {
      const deckId = new ObjectId()
      const deckOwner = new ObjectId()
      testFilterDeckAdded({
        deckId: deckId.toString(),
        deckOwner: deckOwner.toString(),
        userId: deckOwner,
        expected: true,
        debugCalls: [[`Publishing deckAdded for deck "${deckId}" to user "${deckOwner}".`]],
        traceEnabled: true,
      })
    })
  })
  describe('filterDeckSet', () => {
    it('returns false if no user on context', () => {
      const deck = TestUtil.getGameDeck({
        from: TestUtil.getDeck({}),
      })
      const game = TestUtil.getGame({})
      testFilterDeckSet({
        deck,
        game,
        expected: false,
        debugCalls: [[`Not publishing deckSet for deck "${deck.from?.id}" on game "${game.id}": No user on context.`]],
      })
    })
    it('returns false if not a player on game', () => {
      const userId = new ObjectId()
      const deck = TestUtil.getGameDeck({
        from: TestUtil.getDeck({}),
      })
      const game = TestUtil.getGame({})
      testFilterDeckSet({
        userId,
        deck,
        game,
        expected: false,
        debugCalls: [
          [
            `Not publishing deckSet for deck "${deck.from?.id}" on game "${game.id}": User "${userId}" not a player on game.`,
          ],
        ],
      })
    })
    it('returns false if not deck owner', () => {
      const userId = new ObjectId()
      const owner = new ObjectId()
      const deck = TestUtil.getGameDeck({
        from: TestUtil.getDeck({
          user: TestUtil.getUser({
            id: owner,
          }),
        }),
      })
      const game = TestUtil.getGame({
        players: [
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: userId,
            }),
          }),
          TestUtil.getGamePlayer({}),
        ],
      })
      testFilterDeckSet({
        userId,
        deck,
        game,
        expected: false,
        debugCalls: [
          [
            `Not publishing deckSet for deck "${deck.from?.id}" on game "${game.id}": User "${userId}" is not the deck owner "${owner}".`,
          ],
        ],
      })
    })
    it('returns true if player and deck owner', () => {
      const userId = new ObjectId()
      const deck = TestUtil.getGameDeck({
        from: TestUtil.getDeck({
          user: TestUtil.getUser({
            id: userId,
          }),
        }),
      })
      const game = TestUtil.getGame({
        players: [
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: userId,
            }),
          }),
          TestUtil.getGamePlayer({}),
        ],
      })
      testFilterDeckSet({
        userId,
        deck,
        game,
        expected: true,
        debugCalls: [[`Publishing deckSet for deck "${deck.from?.id}" on game "${game.id}" to user "${userId}".`]],
      })
    })
    it('logs to trace if enabled', () => {
      const userId = new ObjectId()
      const deck = TestUtil.getGameDeck({
        from: TestUtil.getDeck({
          user: TestUtil.getUser({
            id: userId,
          }),
        }),
      })
      const game = TestUtil.getGame({
        players: [
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: userId,
            }),
          }),
          TestUtil.getGamePlayer({}),
        ],
      })
      testFilterDeckSet({
        userId,
        deck,
        game,
        expected: true,
        debugCalls: [[`Publishing deckSet for deck "${deck.from?.id}" on game "${game.id}" to user "${userId}".`]],
        traceEnabled: true,
      })
    })
  })
  describe('filterGameAdded', () => {
    it('returns false if no user on context', () => {
      const gameId = new ObjectId()
      testFilterGameAdded({
        gameId: gameId.toString(),
        playerIds: [],
        userId: undefined,
        expected: false,
        debugCalls: [[`Not publishing gameAdded for game "${gameId}": No user on context.`]],
      })
    })
    it('returns false if user not a player on game', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      testFilterGameAdded({
        gameId: gameId.toString(),
        playerIds: [new ObjectId().toString(), new ObjectId().toString()],
        userId,
        expected: false,
        debugCalls: [[`Not publishing gameAdded for game "${gameId}": User "${userId}" not a player on game.`]],
      })
    })
    it('returns true if user is first player on game', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      testFilterGameAdded({
        gameId: gameId.toString(),
        playerIds: [userId.toString(), new ObjectId().toString()],
        userId,
        expected: true,
        debugCalls: [[`Publishing gameAdded for game "${gameId}" to user "${userId}".`]],
      })
    })
    it('returns true if user is last player on game', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      testFilterGameAdded({
        gameId: gameId.toString(),
        playerIds: [new ObjectId().toString(), userId.toString()],
        userId,
        expected: true,
        debugCalls: [[`Publishing gameAdded for game "${gameId}" to user "${userId}".`]],
      })
    })
    it('logs to trace if enabled', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      testFilterGameAdded({
        gameId: gameId.toString(),
        playerIds: [userId.toString(), new ObjectId().toString()],
        userId,
        expected: true,
        debugCalls: [[`Publishing gameAdded for game "${gameId}" to user "${userId}".`]],
        traceEnabled: true,
      })
    })
  })
  describe('filterGameReady', () => {
    it('returns false if no user on context', () => {
      const gameId = new ObjectId()
      testFilterGameReady({
        gameId: gameId.toString(),
        players: [],
        userId: undefined,
        expected: false,
        debugCalls: [[`Not publishing gameReady for game "${gameId}": No user on context.`]],
      })
    })
    it('returns false if user not a player on game', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      testFilterGameReady({
        gameId: gameId.toString(),
        players: [
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({}),
          }),
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({}),
          }),
        ],
        userId,
        expected: false,
        debugCalls: [[`Not publishing gameReady for game "${gameId}": User "${userId}" not a player on game.`]],
      })
    })
    it('returns true if user is first player', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameReady({
        gameId: gameId.toString(),
        players: [
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: userId,
            }),
            ready: true,
          }),
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: opponentId,
            }),
          }),
        ],
        userId,
        expected: true,
        debugCalls: [[`Publishing gameReady for game "${gameId}" to user "${userId}".`]],
      })
    })
    it('returns true if user is last player', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameReady({
        gameId: gameId.toString(),
        players: [
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: opponentId,
            }),
            ready: true,
          }),
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: userId,
            }),
            ready: true,
          }),
        ],
        userId,
        expected: true,
        debugCalls: [[`Publishing gameReady for game "${gameId}" to user "${userId}".`]],
      })
    })
    it('logs to trace if enabled', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameReady({
        gameId: gameId.toString(),
        players: [
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: userId,
            }),
            ready: true,
          }),
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: opponentId,
            }),
          }),
        ],
        userId,
        expected: true,
        debugCalls: [[`Publishing gameReady for game "${gameId}" to user "${userId}".`]],
        traceEnabled: true,
      })
    })
  })
  describe('filterGameSet', () => {
    it('returns false if no user on context', () => {
      const gameId = new ObjectId()
      testFilterGameSet({
        gameId: gameId.toString(),
        players: [],
        userId: undefined,
        expected: false,
        debugCalls: [[`Not publishing gameSet for game "${gameId}": No user on context.`]],
      })
    })
    it('returns false if user not a player on game', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      testFilterGameSet({
        gameId: gameId.toString(),
        players: [TestUtil.getGamePlayer({}), TestUtil.getGamePlayer({})],
        userId,
        expected: false,
        debugCalls: [[`Not publishing gameSet for game "${gameId}": User "${userId}" not a player on game.`]],
      })
    })
    it('returns false if user is first player and no players set', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameSet({
        gameId: gameId.toString(),
        players: [
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: userId,
            }),
          }),
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: opponentId,
            }),
          }),
        ],
        userId,
        expected: false,
        debugCalls: [
          [`Not publishing gameSet for game "${gameId}": Player(s) "${JSON.stringify([userId, opponentId])}" not set.`],
        ],
      })
    })
    it('returns false if user is first player and user not set', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameSet({
        gameId: gameId.toString(),
        players: [
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: userId,
            }),
          }),
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: opponentId,
            }),
            faction: TestUtil.getFaction({}),
            leader: TestUtil.getLeader({}),
          }),
        ],
        userId,
        expected: false,
        debugCalls: [[`Not publishing gameSet for game "${gameId}": Player(s) "${JSON.stringify([userId])}" not set.`]],
      })
    })
    it('returns false if user is first player and opponent not set', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameSet({
        gameId: gameId.toString(),
        players: [
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: userId,
            }),
            faction: TestUtil.getFaction({}),
            leader: TestUtil.getLeader({}),
          }),
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: opponentId,
            }),
          }),
        ],
        userId,
        expected: false,
        debugCalls: [
          [`Not publishing gameSet for game "${gameId}": Player(s) "${JSON.stringify([opponentId])}" not set.`],
        ],
      })
    })
    it('returns false if user is last player and no players set', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameSet({
        gameId: gameId.toString(),
        players: [
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: opponentId,
            }),
          }),
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: userId,
            }),
          }),
        ],
        userId,
        expected: false,
        debugCalls: [
          [`Not publishing gameSet for game "${gameId}": Player(s) "${JSON.stringify([opponentId, userId])}" not set.`],
        ],
      })
    })
    it('returns false if user is last player and user not set', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameSet({
        gameId: gameId.toString(),
        players: [
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: opponentId,
            }),
            faction: TestUtil.getFaction({}),
            leader: TestUtil.getLeader({}),
          }),
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: userId,
            }),
          }),
        ],
        userId,
        expected: false,
        debugCalls: [[`Not publishing gameSet for game "${gameId}": Player(s) "${JSON.stringify([userId])}" not set.`]],
      })
    })
    it('returns false if user is last player and opponent not set', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameSet({
        gameId: gameId.toString(),
        players: [
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: opponentId,
            }),
          }),
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: userId,
            }),
            faction: TestUtil.getFaction({}),
            leader: TestUtil.getLeader({}),
          }),
        ],
        userId,
        expected: false,
        debugCalls: [
          [`Not publishing gameSet for game "${gameId}": Player(s) "${JSON.stringify([opponentId])}" not set.`],
        ],
      })
    })
    it('returns true if user is first and all players set', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameSet({
        gameId: gameId.toString(),
        players: [
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: userId,
            }),
            faction: TestUtil.getFaction({}),
            leader: TestUtil.getLeader({}),
          }),
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: opponentId,
            }),
            faction: TestUtil.getFaction({}),
            leader: TestUtil.getLeader({}),
          }),
        ],
        userId,
        expected: true,
        debugCalls: [[`Publishing gameSet for game "${gameId}" to user "${userId}".`]],
      })
    })
    it('returns true if user is last and all players set', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameSet({
        gameId: gameId.toString(),
        players: [
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: opponentId,
            }),
            faction: TestUtil.getFaction({}),
            leader: TestUtil.getLeader({}),
          }),
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: userId,
            }),
            faction: TestUtil.getFaction({}),
            leader: TestUtil.getLeader({}),
          }),
        ],
        userId,
        expected: true,
        debugCalls: [[`Publishing gameSet for game "${gameId}" to user "${userId}".`]],
      })
    })
    it('logs to trace if enabled', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameSet({
        gameId: gameId.toString(),
        players: [
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: userId,
            }),
            faction: TestUtil.getFaction({}),
            leader: TestUtil.getLeader({}),
          }),
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: opponentId,
            }),
            faction: TestUtil.getFaction({}),
            leader: TestUtil.getLeader({}),
          }),
        ],
        userId,
        expected: true,
        debugCalls: [[`Publishing gameSet for game "${gameId}" to user "${userId}".`]],
        traceEnabled: true,
      })
    })
  })
  describe('filterOrderSet', () => {
    const gameId = new ObjectId()
    const userId = new ObjectId()
    it('returns false if no user on context', () => {
      testFilterOrderSet({
        gameId: gameId.toString(),
        playerIds: [],
        userId: undefined,
        expected: false,
        debugCalls: [[`Not publishing orderSet for game "${gameId}": No user on context.`]],
      })
    })
    it('returns false if user not a player on game', () => {
      testFilterOrderSet({
        gameId: gameId.toString(),
        playerIds: [new ObjectId().toString(), new ObjectId().toString()],
        userId,
        expected: false,
        debugCalls: [[`Not publishing orderSet for game "${gameId}": User "${userId}" not a player on game.`]],
      })
    })
    it('returns true if user is first player on game', () => {
      testFilterOrderSet({
        gameId: gameId.toString(),
        playerIds: [userId.toString(), new ObjectId().toString()],
        userId,
        expected: true,
        debugCalls: [[`Publishing orderSet for game "${gameId}" to user "${userId}".`]],
      })
    })
    it('returns true if user is last player on game', () => {
      testFilterOrderSet({
        gameId: gameId.toString(),
        playerIds: [new ObjectId().toString(), userId.toString()],
        userId,
        expected: true,
        debugCalls: [[`Publishing orderSet for game "${gameId}" to user "${userId}".`]],
      })
    })
    it('logs to trace if enabled', () => {
      testFilterOrderSet({
        gameId: gameId.toString(),
        playerIds: [userId.toString(), new ObjectId().toString()],
        userId,
        expected: true,
        debugCalls: [[`Publishing orderSet for game "${gameId}" to user "${userId}".`]],
        traceEnabled: true,
      })
    })
  })
  describe('filterUnitRedrawn', () => {
    const gameId = new ObjectId().toString()
    const ownerId = new ObjectId().toString()
    const userId = new ObjectId()
    const fromId = new ObjectId().toString()
    const toId = new ObjectId().toString()
    it('returns false if no user on context', () => {
      testFilterUnitRedrawn({
        gameId: gameId.toString(),
        ownerId,
        fromId,
        toId,
        userId: undefined,
        expected: false,
        debugCalls: [[`Not publishing unitRedrawn for unit "${fromId}" on game "${gameId}": No user on context.`]],
      })
    })
    it('returns false if user not a player on game', () => {
      testFilterUnitRedrawn({
        gameId: gameId.toString(),
        playerIds: [new ObjectId().toString(), new ObjectId().toString()],
        ownerId,
        fromId,
        toId,
        userId,
        expected: false,
        debugCalls: [
          [
            `Not publishing unitRedrawn for unit "${fromId}" on game "${gameId}": User "${userId}" not a player on game.`,
          ],
        ],
      })
    })
    it('returns false if user not deck owner', () => {
      testFilterUnitRedrawn({
        gameId: gameId.toString(),
        playerIds: [userId.toString(), ownerId],
        ownerId,
        fromId,
        toId,
        userId,
        expected: false,
        debugCalls: [
          [
            `Not publishing unitRedrawn for unit "${fromId}" on game "${gameId}": User "${userId}" is not deck owner "${ownerId}".`,
          ],
        ],
      })
    })
    it('returns true if user is deck owner', () => {
      testFilterUnitRedrawn({
        gameId: gameId.toString(),
        playerIds: [userId.toString(), ownerId],
        ownerId: userId.toString(),
        fromId,
        toId,
        userId,
        expected: true,
        debugCalls: [[`Publishing unitRedrawn for unit "${fromId}" on game "${gameId}" to user "${userId}".`]],
      })
    })
    it('logs to trace if enabled', () => {
      testFilterUnitRedrawn({
        gameId: gameId.toString(),
        playerIds: [userId.toString(), ownerId],
        ownerId: userId.toString(),
        fromId,
        toId,
        userId,
        expected: true,
        debugCalls: [[`Publishing unitRedrawn for unit "${fromId}" on game "${gameId}" to user "${userId}".`]],
        traceEnabled: true,
      })
    })
  })
})

function testFilterDeckAdded({
  deckId,
  deckOwner,
  userId,
  expected,
  debugCalls = [],
  traceEnabled,
}: {
  deckId: string
  deckOwner: string
  userId?: ObjectId
  expected: boolean
  debugCalls?: string[][]
  traceEnabled?: boolean
}) {
  const payload: DeckAddedPayload = {
    deckAdded: TestUtil.getDeck({
      id: deckId,
      user: TestUtil.getUser({
        id: deckOwner,
      }),
    }),
  }
  const ctx: Context = {
    session: {},
  }
  if (userId && ctx.session) {
    ctx.session.user = TestUtil.getDbUser({
      id: userId,
    })
  }
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SubscriptionResolver['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  expect(SubscriptionResolver['filterDeckAdded'](payload, ctx)).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [[`deckAdded payload: "${JSON.stringify(payload)}"`], [`deckAdded ctx: "${JSON.stringify(ctx)}"`]]
      : []
  )
}

function testFilterDeckSet({
  userId,
  game,
  deck,
  expected,
  debugCalls = [],
  traceEnabled,
}: {
  userId?: ObjectId
  game: Game
  deck: GameDeck
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
  const payload: DeckSetPayload = {
    deckSet: {
      deck,
      game,
    },
  }
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SubscriptionResolver['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  expect(SubscriptionResolver['filterDeckSet'](payload, ctx)).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`deckSet payload: "${JSON.stringify(payload)}"`], [`deckSet ctx: "${JSON.stringify(ctx)}"`]] : []
  )
}

function testFilterGameAdded({
  gameId,
  playerIds,
  userId,
  expected,
  debugCalls = [],
  traceEnabled,
}: {
  gameId: string
  playerIds: string[]
  userId?: ObjectId
  expected: boolean
  debugCalls?: string[][]
  traceEnabled?: boolean
}) {
  const payload: GameAddedPayload = {
    gameAdded: TestUtil.getGame({
      id: gameId,
      players: playerIds.map((playerId) =>
        TestUtil.getGamePlayer({
          user: TestUtil.getUser({
            id: playerId,
          }),
        })
      ),
    }),
  }
  const ctx: Context = {
    session: {},
  }
  if (userId && ctx.session) {
    ctx.session.user = TestUtil.getDbUser({
      id: userId,
    })
  }
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SubscriptionResolver['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  expect(SubscriptionResolver['filterGameAdded'](payload, ctx)).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [[`gameAdded payload: "${JSON.stringify(payload)}"`], [`gameAdded ctx: "${JSON.stringify(ctx)}"`]]
      : []
  )
}

function testFilterGameReady({
  gameId,
  players,
  userId,
  expected,
  debugCalls = [],
  traceEnabled,
}: {
  gameId: string
  players: GamePlayer[]
  userId?: ObjectId
  expected: boolean
  debugCalls?: string[][]
  traceEnabled?: boolean
}) {
  const payload: GameReadyPayload = {
    gameReady: TestUtil.getGame({
      id: gameId,
      players,
    }),
  }
  const ctx: Context = {
    session: {},
  }
  if (userId && ctx.session) {
    ctx.session.user = TestUtil.getDbUser({
      id: userId,
    })
  }
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SubscriptionResolver['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  expect(SubscriptionResolver['filterGameReady'](payload, ctx)).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [[`gameReady payload: "${JSON.stringify(payload)}"`], [`gameReady ctx: "${JSON.stringify(ctx)}"`]]
      : []
  )
}

function testFilterGameSet({
  gameId,
  players,
  userId,
  expected,
  debugCalls = [],
  traceEnabled,
}: {
  gameId: string
  players: GamePlayer[]
  userId?: ObjectId
  expected: boolean
  debugCalls?: string[][]
  traceEnabled?: boolean
}) {
  const payload: GameSetPayload = {
    gameSet: TestUtil.getGame({
      id: gameId,
      players,
    }),
  }
  const ctx: Context = {
    session: {},
  }
  if (userId && ctx.session) {
    ctx.session.user = TestUtil.getDbUser({
      id: userId,
    })
  }
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SubscriptionResolver['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  expect(SubscriptionResolver['filterGameSet'](payload, ctx)).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`gameSet payload: "${JSON.stringify(payload)}"`], [`gameSet ctx: "${JSON.stringify(ctx)}"`]] : []
  )
}

function testFilterOrderSet({
  gameId,
  playerIds,
  userId,
  expected,
  debugCalls = [],
  traceEnabled,
}: {
  gameId: string
  playerIds: string[]
  userId?: ObjectId
  expected: boolean
  debugCalls?: string[][]
  traceEnabled?: boolean
}) {
  const payload: OrderSetPayload = {
    orderSet: TestUtil.getGame({
      id: gameId,
      players: playerIds.map((playerId) =>
        TestUtil.getGamePlayer({
          user: TestUtil.getUser({
            id: playerId,
          }),
        })
      ),
    }),
  }
  const ctx: Context = {
    session: {},
  }
  if (userId && ctx.session) {
    ctx.session.user = TestUtil.getDbUser({
      id: userId,
    })
  }
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SubscriptionResolver['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  expect(SubscriptionResolver['filterOrderSet'](payload, ctx)).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual([[`orderSet with userId: "${userId}", gameId: "${gameId}"`], ...debugCalls])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`orderSet payload: "${JSON.stringify(payload)}"`], [`orderSet ctx: "${JSON.stringify(ctx)}"`]] : []
  )
}

function testFilterUnitRedrawn({
  gameId,
  ownerId,
  fromId,
  toId,
  playerIds = [],
  userId,
  expected,
  debugCalls = [],
  traceEnabled,
}: {
  gameId: string
  ownerId: string
  fromId: string
  toId: string
  playerIds?: string[]
  userId?: ObjectId
  expected: boolean
  debugCalls?: string[][]
  traceEnabled?: boolean
}) {
  const payload: UnitRedrawnPayload = {
    unitRedrawn: {
      from: TestUtil.getDeckUnit({
        id: fromId,
      }),
      game: TestUtil.getGame({
        id: gameId,
        players: playerIds.map((playerId) =>
          TestUtil.getGamePlayer({
            user: TestUtil.getUser({
              id: playerId,
            }),
          })
        ),
      }),
      ownerId,
      to: TestUtil.getDeckUnit({
        id: toId,
      }),
    },
  }
  const ctx: Context = {
    session: {},
  }
  if (userId && ctx.session) {
    ctx.session.user = TestUtil.getDbUser({
      id: userId,
    })
  }
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SubscriptionResolver['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  expect(SubscriptionResolver['filterUnitRedrawn'](payload, ctx)).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual([
    [
      `unitRedrawn with userId: "${userId}", gameId: "${gameId}", fromId: "${fromId}", toId: "${toId}", ownerId: "${ownerId}"`,
    ],
    ...debugCalls,
  ])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [[`unitRedrawn payload: "${JSON.stringify(payload)}"`], [`unitRedrawn ctx: "${JSON.stringify(ctx)}"`]]
      : []
  )
}
