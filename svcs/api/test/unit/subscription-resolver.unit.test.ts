import * as graphqlSubscriptions from 'graphql-subscriptions'
import { Logger } from 'log4js'
import { ObjectId } from 'mongodb'

import EventManager from '../../src/graphql/resolvers/event-manager'
import { Game, GameDeck, GamePlayer, User } from '@gwent/graphql-schema/resolver-typings'
import { PubSubEvents } from '@gwent/constants'
import SubscriptionResolver, {
  DeckAddedPayload,
  DeckSetPayload,
  GameAddedPayload,
  GameReadyPayload,
  GameSetPayload,
  OrderSetPayload,
  SubscriptionContext,
  UnitRedrawnPayload,
} from '../../src/graphql/resolvers/subscription-resolver'
import TestUtil from '../test-util'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'

describe('subscription-resolver', () => {
  describe('getResolvers', () => {
    it('returns subscriptions with calls to withFilter', () => {
      const withFilterSpy = jest.spyOn(graphqlSubscriptions, 'withFilter').mockReturnValue((() => {}) as any)
      const asyncIteratorSpy = jest.spyOn(EventManager.pubsub, 'asyncIterator').mockReturnValue('' as any)
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
        const context: SubscriptionContext = {
          user: TestUtil.getDbUser({}),
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
    it('calls to trace if enabled', () => {
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
    it('calls to trace if enabled', () => {
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
          {
            ready: false,
            rounds: [],
            user: {
              id: new ObjectId().toString(),
            } as unknown as User,
          },
          {
            ready: false,
            rounds: [],
            user: {
              id: new ObjectId().toString(),
            } as unknown as User,
          },
        ],
        userId,
        expected: false,
        debugCalls: [[`Not publishing gameReady for game "${gameId}": User "${userId}" not a player on game.`]],
      })
    })
    it('returns false if user is first player and no players ready', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameReady({
        gameId: gameId.toString(),
        players: [
          {
            ready: false,
            rounds: [],
            user: {
              id: userId.toString(),
            } as unknown as User,
          },
          {
            ready: false,
            rounds: [],
            user: {
              id: opponentId.toString(),
            } as unknown as User,
          },
        ],
        userId,
        expected: false,
        debugCalls: [
          [
            `Not publishing gameReady for game "${gameId}": Player(s) "${JSON.stringify([
              userId,
              opponentId,
            ])}" not ready.`,
          ],
        ],
      })
    })
    it('returns false if user is first player and user is not ready', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameReady({
        gameId: gameId.toString(),
        players: [
          {
            ready: false,
            rounds: [],
            user: {
              id: userId.toString(),
            } as unknown as User,
          },
          {
            ready: true,
            rounds: [],
            user: {
              id: opponentId.toString(),
            } as unknown as User,
          },
        ],
        userId,
        expected: false,
        debugCalls: [
          [`Not publishing gameReady for game "${gameId}": Player(s) "${JSON.stringify([userId])}" not ready.`],
        ],
      })
    })
    it('returns false if user is first player and opponent is not ready', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameReady({
        gameId: gameId.toString(),
        players: [
          {
            ready: true,
            rounds: [],
            user: {
              id: userId.toString(),
            } as unknown as User,
          },
          {
            ready: false,
            rounds: [],
            user: {
              id: opponentId.toString(),
            } as unknown as User,
          },
        ],
        userId,
        expected: false,
        debugCalls: [
          [`Not publishing gameReady for game "${gameId}": Player(s) "${JSON.stringify([opponentId])}" not ready.`],
        ],
      })
    })
    it('returns false if user is last player and no players ready', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameReady({
        gameId: gameId.toString(),
        players: [
          {
            ready: false,
            rounds: [],
            user: {
              id: opponentId.toString(),
            } as unknown as User,
          },
          {
            ready: false,
            rounds: [],
            user: {
              id: userId.toString(),
            } as unknown as User,
          },
        ],
        userId,
        expected: false,
        debugCalls: [
          [
            `Not publishing gameReady for game "${gameId}": Player(s) "${JSON.stringify([
              opponentId,
              userId,
            ])}" not ready.`,
          ],
        ],
      })
    })
    it('returns false if user is last player and user is not ready', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameReady({
        gameId: gameId.toString(),
        players: [
          {
            ready: true,
            rounds: [],
            user: {
              id: opponentId.toString(),
            } as unknown as User,
          },
          {
            ready: false,
            rounds: [],
            user: {
              id: userId.toString(),
            } as unknown as User,
          },
        ],
        userId,
        expected: false,
        debugCalls: [
          [`Not publishing gameReady for game "${gameId}": Player(s) "${JSON.stringify([userId])}" not ready.`],
        ],
      })
    })
    it('returns false if user is last player and opponent is not ready', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameReady({
        gameId: gameId.toString(),
        players: [
          {
            ready: false,
            rounds: [],
            user: {
              id: opponentId.toString(),
            } as unknown as User,
          },
          {
            ready: true,
            rounds: [],
            user: {
              id: userId.toString(),
            } as unknown as User,
          },
        ],
        userId,
        expected: false,
        debugCalls: [
          [`Not publishing gameReady for game "${gameId}": Player(s) "${JSON.stringify([opponentId])}" not ready.`],
        ],
      })
    })
    it('returns true if user is first player and all players ready', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameReady({
        gameId: gameId.toString(),
        players: [
          {
            ready: true,
            rounds: [],
            user: {
              id: userId.toString(),
            } as unknown as User,
          },
          {
            ready: true,
            rounds: [],
            user: {
              id: opponentId.toString(),
            } as unknown as User,
          },
        ],
        userId,
        expected: true,
        debugCalls: [[`Publishing gameReady for game "${gameId}" to user "${userId}".`]],
      })
    })
    it('returns true if user is last player and all players ready', () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      const opponentId = new ObjectId()
      testFilterGameReady({
        gameId: gameId.toString(),
        players: [
          {
            ready: true,
            rounds: [],
            user: {
              id: opponentId.toString(),
            } as unknown as User,
          },
          {
            ready: true,
            rounds: [],
            user: {
              id: userId.toString(),
            } as unknown as User,
          },
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
          {
            ready: true,
            rounds: [],
            user: {
              id: userId.toString(),
            } as unknown as User,
          },
          {
            ready: true,
            rounds: [],
            user: {
              id: opponentId.toString(),
            } as unknown as User,
          },
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
      // TODO: change instances of manually created mock game player to use TestUtil.getGamePlayer (in this file and potentially elsewhere)
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
  const payload = {
    deckAdded: {
      id: deckId,
      user: {
        id: deckOwner,
      },
    },
  } as DeckAddedPayload
  const ctx = {} as unknown as SubscriptionContext
  if (userId) {
    ctx.user = {
      _id: userId,
    } as UserDbObject
  }
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SubscriptionResolver['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as unknown as Logger

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
  const ctx = {} as unknown as SubscriptionContext
  if (userId) {
    ctx.user = {
      _id: userId,
    } as UserDbObject
  }
  const payload = {
    deckSet: {
      deck,
      game,
    },
  } as DeckSetPayload
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SubscriptionResolver['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as unknown as Logger

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
  const payload = {
    gameAdded: {
      id: gameId,
      players: playerIds.map((playerId) => {
        return {
          ready: false,
          rounds: [],
          user: {
            id: playerId,
          } as unknown as User,
        }
      }),
    },
  } as unknown as GameAddedPayload
  const ctx = {} as unknown as SubscriptionContext
  if (userId) {
    ctx.user = {
      _id: userId,
    } as UserDbObject
  }
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SubscriptionResolver['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as unknown as Logger

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
  const payload = {
    gameReady: {
      id: gameId,
      players,
    },
  } as unknown as GameReadyPayload
  const ctx = {} as unknown as SubscriptionContext
  if (userId) {
    ctx.user = {
      _id: userId,
    } as UserDbObject
  }
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SubscriptionResolver['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as unknown as Logger

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
  const payload = {
    gameSet: {
      id: gameId,
      players,
    },
  } as unknown as GameSetPayload
  const ctx = {} as unknown as SubscriptionContext
  if (userId) {
    ctx.user = {
      _id: userId,
    } as UserDbObject
  }
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  SubscriptionResolver['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as unknown as Logger

  expect(SubscriptionResolver['filterGameSet'](payload, ctx)).toEqual(expected)

  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`gameSet payload: "${JSON.stringify(payload)}"`], [`gameSet ctx: "${JSON.stringify(ctx)}"`]] : []
  )
}
