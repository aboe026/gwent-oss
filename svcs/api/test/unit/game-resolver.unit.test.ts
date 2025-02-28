import { ObjectId } from 'mongodb'

import { Combat, Game, GamePlayer, User } from '@gwent/graphql-schema/resolver-typings'
import { GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import GamePlayerResolver from '../../src/graphql/resolvers/types/game-player-resolver'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import TestUtil from '../util/test-util'
import UserResolver from '../../src/graphql/resolvers/types/user-resolver'
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
        game: TestUtil.getDbGame({
          id: gameId,
          creator: user.id,
          players,
          victors: [victor.id],
        }),
        resolvedUsers: [user, victor],
        resolvedVictors: [victor],
        resolvedGamePlayers: [
          TestUtil.getGamePlayer({
            user,
          }),
        ],
        userResolverCalls: [[[user.id, victor.id]]],
        gamePlayerResolverCalls: [
          [
            {
              players,
              users: [user, victor],
              gameStatus: GameStatus.Decking,
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
        game: TestUtil.getDbGame({
          id: gameId,
          creator: user.id,
          players,
          turn: user.id,
          victors: [victor.id],
          weather: [Combat.Close, Combat.Ranged],
        }),
        creator: user,
        users: [victor],
        resolvedGamePlayers: [
          TestUtil.getGamePlayer({
            user,
          }),
        ],
        gamePlayerResolverCalls: [
          [
            {
              players: players,
              users: [user, victor],
              gameStatus: GameStatus.Decking,
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
      const game = TestUtil.getDbGame({
        id: gameId,
        creator: creator.id,
        players: [
          TestUtil.getDbGamePlayer({
            user: player.id,
          }),
        ],
      })
      await testResolveFromArray({
        games: [game],
        resolvedUsers: [creator, player],
        resolvedGames: [
          TestUtil.getGameFromDbGame({
            game,
          }),
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
        resolvedGame: TestUtil.getGameFromDbGame({
          game,
        }),
      })
    })
  })
})

async function testResolveFromObject({
  creator,
  game,
  users,
  resolvedUsers = [],
  resolvedGamePlayers = [],
  resolvedVictors,
  userResolverCalls = [[[]]],
  gamePlayerResolverCalls = [],
}: {
  game: GameDbObject
  creator?: User
  users?: User[]
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
      users,
    })
  ).resolves.toEqual({
    config: {
      lives: 2,
    },
    created: game.created,
    creator: creator || resolvedUsers[0],
    id: game._id.toString(),
    players: resolvedGamePlayers,
    round: game.round,
    status: game.status,
    updated: game.updated,
    turn: game.turn
      ? resolvedGamePlayers.find((player) => player.user.id.toString() === game.turn?.toString())
      : undefined,
    victors,
    weather: game.weather,
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
