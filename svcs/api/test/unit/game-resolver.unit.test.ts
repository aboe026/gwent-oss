import { Game, GamePlayer, GameStatus, User } from '@gwent/graphql-schema/resolver-typings'
import GamePlayerResolver from '../../src/graphql/resolvers/game-player-resolver'
import UserResolver from '../../src/graphql/resolvers/user-resolver'
import GameResolver from '../../src/graphql/resolvers/game-resolver'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import { ObjectId } from 'mongodb'
import { MAX_ROUNDS } from '@gwent/constants'
import GameStore from '../../src/database/stores/game-store'
import TestUtil from '../test-util'

describe('game-resolver', () => {
  describe('resolveFromObject', () => {
    it('throws error if creator not found', async () => {
      const gameId = new ObjectId()
      const userId = new ObjectId()
      await testResolveFromObject({
        game: {
          _id: gameId,
          created: new Date(),
          creator: userId,
          players: [],
          round: {
            current: 0,
            maximum: MAX_ROUNDS,
          },
          updated: new Date(),
          victors: [],
        },
        resolvedUsers: [],
        error: `Could not resolve creator "${userId}" for game "${gameId}".`,
        userResolverCalls: [[[userId.toString()]]],
      })
    })
    it('throws error if player not found', async () => {
      const gameId = new ObjectId()
      const creator = TestUtil.getUser({})
      const playerId = new ObjectId()
      await testResolveFromObject({
        game: {
          _id: gameId,
          created: new Date(),
          creator: new ObjectId(creator.id),
          players: [
            TestUtil.getDbGamePlayer({
              user: playerId,
            }),
          ],
          round: {
            current: 0,
            maximum: MAX_ROUNDS,
          },
          updated: new Date(),
          victors: [],
        },
        users: [creator],
        resolvedUsers: [],
        error: `Could not resolve player "${playerId}" for game "${gameId}".`,
        userResolverCalls: [[[playerId.toString()]]],
      })
    })
    it('throws error if victor not found', async () => {
      const gameId = new ObjectId()
      const creator = TestUtil.getUser({})
      const playerId = new ObjectId()
      await testResolveFromObject({
        game: {
          _id: gameId,
          created: new Date(),
          creator: new ObjectId(creator.id),
          players: [
            TestUtil.getDbGamePlayer({
              user: creator.id,
            }),
          ],
          round: {
            current: 0,
            maximum: MAX_ROUNDS,
          },
          updated: new Date(),
          victors: [playerId],
        },
        resolvedUsers: [creator],
        error: `Could not resolve victor "${playerId}" for game "${gameId}".`,
        userResolverCalls: [[[creator.id, playerId.toString()]]],
      })
    })
    it('returns resolved object if no errors', async () => {
      const gameId = new ObjectId()
      const user = TestUtil.getUser({})
      const victor = TestUtil.getUser({})
      await testResolveFromObject({
        game: {
          _id: gameId,
          created: new Date(),
          creator: new ObjectId(user.id),
          players: [],
          round: {
            current: 0,
            maximum: MAX_ROUNDS,
          },
          updated: new Date(),
          victors: [new ObjectId(victor.id)],
        },
        creator: user,
        resolvedUsers: [victor],
        resolvedVictors: [victor],
        resolvedGamePlayers: [
          {
            ready: false,
            rounds: [],
            user,
          },
        ],
        userResolverCalls: [[[victor.id]]],
        gamePlayerResolverCalls: [
          [
            {
              players: [],
              users: [user, victor],
              everyoneReady: false,
              neutralFactionStats: undefined,
              neutralLeaderStats: undefined,
            },
          ],
        ],
      })
    })
  })
  describe('resolveFromArray', () => {
    it('throws error if creator not found', async () => {
      const gameId = new ObjectId()
      const creatorId = new ObjectId()
      await testResolveFromArray({
        games: [
          {
            _id: gameId,
            created: new ObjectId(),
            creator: creatorId,
            players: [],
            round: {
              current: 0,
              maximum: MAX_ROUNDS,
            },
            updated: new Date(),
            victors: [],
          },
        ],
        resolvedUsers: [],
        error: `Could not resolve creator "${creatorId}" for game "${gameId}" in array.`,
        userResolverCalls: [[[creatorId.toString()]]],
      })
    })
    it('throws error if player not found', async () => {
      const gameId = new ObjectId()
      const creator = TestUtil.getUser({})
      const playerId = new ObjectId()
      await testResolveFromArray({
        games: [
          {
            _id: gameId,
            created: new ObjectId(),
            creator: new ObjectId(creator.id),
            players: [
              TestUtil.getDbGamePlayer({
                user: playerId,
              }),
            ],
            round: {
              current: 0,
              maximum: MAX_ROUNDS,
            },
            updated: new Date(),
            victors: [],
          },
        ],
        resolvedUsers: [creator],
        error: `Could not resolve player "${playerId}" for game "${gameId}" in array.`,
        userResolverCalls: [[[creator.id, playerId.toString()]]],
      })
    })
    it('calls to resolveFromObject if no errors thrown', async () => {
      const gameId = new ObjectId()
      const creator = TestUtil.getUser({})
      const player = TestUtil.getUser({})
      const game: GameDbObject = {
        _id: gameId,
        created: new ObjectId(),
        creator: new ObjectId(creator.id),
        players: [
          TestUtil.getDbGamePlayer({
            user: player.id,
          }),
        ],
        round: {
          current: 0,
          maximum: MAX_ROUNDS,
        },
        updated: new Date(),
        victors: [],
      }
      await testResolveFromArray({
        games: [game],
        resolvedUsers: [creator, player],
        resolvedGames: [
          {
            created: game.created,
            creator: creator,
            id: game._id.toString(),
            players: [
              {
                ready: false,
                rounds: [],
                user: creator,
              },
              {
                ready: false,
                rounds: [],
                user: player,
              },
            ],
            round: game.round,
            status: GameStatus.Decking,
            updated: game.updated,
            victors: [],
          },
        ],
        userResolverCalls: [[[creator.id, player.id]]],
        gameResolverCalls: [
          [
            {
              creator,
              game,
              users: [player],
            },
          ],
        ],
      })
    })
  })
  describe('resolveById', () => {
    it('returns undefined if getById returns undefined', async () => {
      await testResolveById({
        game: undefined,
      })
    })
    it('returns resolved game if getById returns game', async () => {
      const game = TestUtil.getDbGame({})
      await testResolveById({
        game,
        resolvedGame: {
          created: game.created,
          creator: {
            created: new Date(),
            id: game.creator.toString(),
            name: 'creator-name',
          },
          id: game._id.toString(),
          players: [],
          round: game.round,
          status: GameStatus.Decking,
          updated: game.updated,
          victors: [],
        },
      })
    })
  })
  describe('isEveryoneReady', () => {
    const game = TestUtil.getDbGame({})
    it('returns false if game players empty array', () => {
      expect(GameResolver.isEveryoneReady(game)).toEqual(false)
    })
    it('returns false if single game player not ready', () => {
      expect(
        GameResolver.isEveryoneReady({
          ...game,
          players: [TestUtil.getDbGamePlayer({})],
        })
      ).toEqual(false)
    })
    it('returns false if single out of many game players not ready', () => {
      expect(
        GameResolver.isEveryoneReady({
          ...game,
          players: [
            TestUtil.getDbGamePlayer({
              ready: true,
            }),
            TestUtil.getDbGamePlayer({}),
          ],
        })
      ).toEqual(false)
    })
    it('returns true if all out of many game players ready', () => {
      expect(
        GameResolver.isEveryoneReady({
          ...game,
          players: [
            TestUtil.getDbGamePlayer({
              ready: true,
            }),
            TestUtil.getDbGamePlayer({
              ready: true,
            }),
          ],
        })
      ).toEqual(true)
    })
    it('returns true if single game player ready', () => {
      expect(
        GameResolver.isEveryoneReady({
          ...game,
          players: [
            TestUtil.getDbGamePlayer({
              ready: true,
            }),
          ],
        })
      ).toEqual(true)
    })
  })
  describe('getStatus', () => {
    const game = TestUtil.getDbGame({})
    it('returns Done if there is a single victor', () => {
      expect(
        GameResolver.getStatus({
          ...game,
          victors: [new ObjectId()],
        })
      ).toEqual(GameStatus.Done)
    })
    it('returns Done if there are multiple victors', () => {
      expect(
        GameResolver.getStatus({
          ...game,
          victors: [new ObjectId(), new ObjectId()],
        })
      ).toEqual(GameStatus.Done)
    })
    it('returns Decking if no victors not everybody is ready', () => {
      expect(GameResolver.getStatus(game)).toEqual(GameStatus.Decking)
    })
    it('returns Playing if no victors and everybody is ready', () => {
      expect(
        GameResolver.getStatus({
          ...game,
          players: [
            TestUtil.getDbGamePlayer({
              ready: true,
            }),
          ],
        })
      ).toEqual(GameStatus.Playing)
    })
  })
})

async function testResolveFromObject({
  creator,
  game,
  users,
  neutralFactionStats,
  neutralLeaderStats,
  resolvedUsers = [],
  resolvedGamePlayers = [],
  resolvedVictors,
  error,
  userResolverCalls = [[[]]],
  gamePlayerResolverCalls = [],
}: {
  game: GameDbObject
  creator?: User
  users?: User[]
  neutralFactionStats?: boolean
  neutralLeaderStats?: boolean
  resolvedUsers?: User[]
  resolvedGamePlayers?: GamePlayer[]
  resolvedVictors?: User[]
  error?: string
  userResolverCalls?: any[][]
  gamePlayerResolverCalls?: any[][]
}) {
  const userResolverSpy = jest.spyOn(UserResolver, 'resolveByIds').mockResolvedValue(resolvedUsers)
  const gamePlayerResolverSpy = jest
    .spyOn(GamePlayerResolver, 'resolveFromArray')
    .mockResolvedValue(resolvedGamePlayers)

  const promise = GameResolver.resolveFromObject({
    game,
    creator,
    neutralFactionStats,
    neutralLeaderStats,
    users,
  })
  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual({
      created: game.created,
      creator: creator || resolvedUsers,
      id: game._id.toString(),
      players: resolvedGamePlayers,
      round: game.round,
      status: GameResolver.getStatus(game),
      updated: game.updated,
      victors: resolvedVictors || game.victors,
    })
  }

  expect(userResolverSpy.mock.calls).toEqual(userResolverCalls)
  expect(gamePlayerResolverSpy.mock.calls).toEqual(gamePlayerResolverCalls)
}

async function testResolveFromArray({
  games,
  resolvedUsers = [],
  resolvedGames = [],
  error,
  userResolverCalls = [],
  gameResolverCalls = [],
}: {
  games: GameDbObject[]
  resolvedUsers?: User[]
  resolvedGames?: Game[]
  error?: string
  userResolverCalls?: any[][]
  gameResolverCalls?: any[][]
}) {
  const userResolverSpy = jest.spyOn(UserResolver, 'resolveByIds').mockResolvedValue(resolvedUsers)
  const resolveFromObjectSpy = jest.spyOn(GameResolver, 'resolveFromObject')
  for (const resolvedGame of resolvedGames) {
    resolveFromObjectSpy.mockResolvedValueOnce(resolvedGame)
  }

  const promise = GameResolver.resolveFromArray(games)
  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual(resolvedGames)
  }

  expect(userResolverSpy.mock.calls).toEqual(userResolverCalls)
  expect(resolveFromObjectSpy.mock.calls).toEqual(gameResolverCalls)
}

async function testResolveById({ game, resolvedGame }: { game?: GameDbObject; resolvedGame?: Game }) {
  const id = new ObjectId()
  const gameGetSpy = jest.spyOn(GameStore, 'getById').mockResolvedValue(game)
  const gameResolveSpy = jest.spyOn(GameResolver, 'resolveFromObject')
  if (resolvedGame) {
    gameResolveSpy.mockResolvedValueOnce(resolvedGame)
  }

  await expect(GameResolver.resolveById(id)).resolves.toEqual(resolvedGame)

  expect(gameGetSpy.mock.calls).toEqual([
    [
      {
        id,
      },
    ],
  ])
  expect(gameResolveSpy.mock.calls).toEqual(
    resolvedGame
      ? [
          [
            {
              game,
            },
          ],
        ]
      : []
  )
}
