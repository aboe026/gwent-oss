import { ObjectId } from 'mongodb'

import { Game, GamePlayer, GameStatus, User } from '@gwent/graphql-schema/resolver-typings'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import GamePlayerResolver from '../../src/graphql/resolvers/game-player-resolver'
import GameResolver from '../../src/graphql/resolvers/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import { MAX_ROUNDS } from '@gwent/constants'
import TestUtil from '../test-util'
import UserResolver from '../../src/graphql/resolvers/user-resolver'
import Verifier from '../../src/util/verifier'

describe('game-resolver', () => {
  describe('fromObject', () => {
    it('returns resolved object if nothing provided', async () => {
      const gameId = new ObjectId()
      const user = TestUtil.getUser({})
      const victor = TestUtil.getUser({})
      const players = [
        TestUtil.getDbGamePlayer({
          user: user.id,
        }),
        TestUtil.getDbGamePlayer({
          user: victor.id,
        }),
      ]
      await testResolveFromObject({
        game: {
          _id: gameId,
          created: new Date(),
          creator: new ObjectId(user.id),
          players,

          round: {
            current: 0,
            maximum: MAX_ROUNDS,
          },
          updated: new Date(),
          victors: [new ObjectId(victor.id)],
        },
        resolvedUsers: [user, victor],
        resolvedVictors: [victor],
        resolvedGamePlayers: [
          {
            ready: false,
            rounds: [],
            user,
          },
        ],
        userResolverCalls: [[[user.id, victor.id]]],
        gamePlayerResolverCalls: [
          [
            {
              players,
              users: [user, victor],
              everyoneReady: false,
              neutralFactionStats: undefined,
              neutralLeaderStats: undefined,
            },
          ],
        ],
      })
    })
    it('returns resolved object if everything provided', async () => {
      const gameId = new ObjectId()
      const user = TestUtil.getUser({})
      const victor = TestUtil.getUser({})
      const players = [
        TestUtil.getDbGamePlayer({
          user: user.id,
        }),
        TestUtil.getDbGamePlayer({
          user: victor.id,
        }),
      ]
      await testResolveFromObject({
        game: {
          _id: gameId,
          created: new Date(),
          creator: new ObjectId(user.id),
          players,
          round: {
            current: 0,
            maximum: MAX_ROUNDS,
          },
          updated: new Date(),
          victors: [new ObjectId(victor.id)],
        },
        creator: user,
        users: [victor],
        resolvedGamePlayers: [
          {
            ready: false,
            rounds: [],
            user,
          },
        ],
        gamePlayerResolverCalls: [
          [
            {
              players: players,
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
  describe('fromArray', () => {
    it('calls to fromObject with resolved users', async () => {
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
  describe('fromId', () => {
    it('throws error if verifyObjects throws error', async () => {
      await testResolveById({
        verifyObjectsResponse: Error(`Could not find games "["id"]" to resolve.`),
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
  userResolverCalls?: any[][]
  gamePlayerResolverCalls?: any[][]
}) {
  const userResolverSpy = jest.spyOn(UserResolver, 'fromIds').mockResolvedValue(resolvedUsers)
  const gamePlayerResolverSpy = jest.spyOn(GamePlayerResolver, 'fromArray').mockResolvedValue(resolvedGamePlayers)
  const victors: User[] = []
  if (resolvedVictors) {
    victors.push(...resolvedVictors)
  } else if (resolvedUsers && resolvedUsers.length > 0) {
    victors.push(resolvedUsers[1])
  } else if (users) {
    victors.push(...users)
  }

  await expect(
    GameResolver.fromObject({
      game,
      creator,
      neutralFactionStats,
      neutralLeaderStats,
      users,
    })
  ).resolves.toEqual({
    created: game.created,
    creator: creator || resolvedUsers[0],
    id: game._id.toString(),
    players: resolvedGamePlayers,
    round: game.round,
    status: GameResolver.getStatus(game),
    updated: game.updated,
    victors,
  })

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
  const userResolverSpy = jest.spyOn(UserResolver, 'fromIds').mockResolvedValue(resolvedUsers)
  const fromObjectSpy = jest.spyOn(GameResolver, 'fromObject')
  for (const resolvedGame of resolvedGames) {
    fromObjectSpy.mockResolvedValueOnce(resolvedGame)
  }

  const promise = GameResolver.fromArray(games)
  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual(resolvedGames)
  }

  expect(userResolverSpy.mock.calls).toEqual(userResolverCalls)
  expect(fromObjectSpy.mock.calls).toEqual(gameResolverCalls)
}

async function testResolveById({
  game,
  resolvedGame,
  verifyObjectsResponse,
}: {
  game?: GameDbObject
  resolvedGame?: Game
  verifyObjectsResponse?: Error
}) {
  const id = new ObjectId()
  const gameGetSpy = jest.spyOn(GameStore, 'getById').mockResolvedValue(game)
  const verifyObjectsSpy = jest.spyOn(Verifier, 'checkObjects')
  if (verifyObjectsResponse) {
    verifyObjectsSpy.mockImplementation(() => {
      throw verifyObjectsResponse
    })
  } else {
    verifyObjectsSpy.mockReturnValue()
  }
  const gameResolveSpy = jest.spyOn(GameResolver, 'fromObject')
  if (resolvedGame) {
    gameResolveSpy.mockResolvedValueOnce(resolvedGame)
  }

  const promise = GameResolver.fromId(id)
  if (verifyObjectsResponse) {
    await expect(promise).rejects.toThrow(verifyObjectsResponse)
  } else {
    await expect(promise).resolves.toEqual(resolvedGame)
  }

  expect(gameGetSpy.mock.calls).toEqual([
    [
      {
        id,
      },
    ],
  ])
  expect(verifyObjectsSpy.mock.calls).toEqual([
    [
      {
        expectedKeys: [id],
        objects: [game],
        field: '_id',
        logger: GameResolver['logger'],
        label: 'games',
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
