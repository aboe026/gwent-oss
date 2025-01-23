import { ObjectId } from 'mongodb'

import { Game, GamePlayer, GameStatus, User } from '@gwent/graphql-schema/resolver-typings'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import GamePlayerResolver from '../../src/graphql/resolvers/types/game-player-resolver'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import TestUtil from '../test-util'
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
              allDecksChosen: false,
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
              allDecksChosen: false,
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
  describe('allDecksChosen', () => {
    it('returns false if no players on game', () => {
      expect(GameResolver.allDecksChosen(TestUtil.getDbGame({}))).toEqual(false)
    })
    it('returns false if all players have not chosen decks', () => {
      expect(
        GameResolver.allDecksChosen(
          TestUtil.getDbGame({
            players: [TestUtil.getDbGamePlayer({}), TestUtil.getDbGamePlayer({})],
          })
        )
      ).toEqual(false)
    })
    it('returns false if first player has not chosen deck', () => {
      expect(
        GameResolver.allDecksChosen(
          TestUtil.getDbGame({
            players: [
              TestUtil.getDbGamePlayer({}),
              TestUtil.getDbGamePlayer({
                deck: TestUtil.getDbGameDeck({
                  from: TestUtil.getDbDeck({}),
                }),
              }),
            ],
          })
        )
      ).toEqual(false)
    })
    it('returns false if last player has not chosen deck', () => {
      expect(
        GameResolver.allDecksChosen(
          TestUtil.getDbGame({
            players: [
              TestUtil.getDbGamePlayer({
                deck: TestUtil.getDbGameDeck({
                  from: TestUtil.getDbDeck({}),
                }),
              }),
              TestUtil.getDbGamePlayer({}),
            ],
          })
        )
      ).toEqual(false)
    })
    it('returns true if all players have chosen decks', () => {
      expect(
        GameResolver.allDecksChosen(
          TestUtil.getDbGame({
            players: [
              TestUtil.getDbGamePlayer({
                deck: TestUtil.getDbGameDeck({
                  from: TestUtil.getDbDeck({}),
                }),
              }),
              TestUtil.getDbGamePlayer({
                deck: TestUtil.getDbGameDeck({
                  from: TestUtil.getDbDeck({}),
                }),
              }),
            ],
          })
        )
      ).toEqual(true)
    })
  })
  describe('getStatus', () => {
    it('returns DECKING if not all players have chosen a deck', () => {
      const game = TestUtil.getDbGame({})
      const allDecksChosenSpy = jest.spyOn(GameResolver, 'allDecksChosen').mockReturnValue(false)

      expect(GameResolver.getStatus(game)).toEqual(GameStatus.Decking)

      expect(allDecksChosenSpy.mock.calls).toEqual([[game]])
    })
    it('returns ORDERING if all decks chosen but no turn set', () => {
      const game = TestUtil.getDbGame({})
      const allDecksChosenSpy = jest.spyOn(GameResolver, 'allDecksChosen').mockReturnValue(true)

      expect(GameResolver.getStatus(game)).toEqual(GameStatus.Ordering)

      expect(allDecksChosenSpy.mock.calls).toEqual([[game]])
    })
    it('returns REDRAWING if all decks chosen and turn set but not everybody ready', () => {
      const game = TestUtil.getDbGame({
        turn: new ObjectId(),
        players: [TestUtil.getDbGamePlayer({})],
      })
      const allDecksChosenSpy = jest.spyOn(GameResolver, 'allDecksChosen').mockReturnValue(true)

      expect(GameResolver.getStatus(game)).toEqual(GameStatus.Redrawing)

      expect(allDecksChosenSpy.mock.calls).toEqual([[game]])
    })
    it('returns PLAYING if all decks chosen and turn and everybody ready but no victors', () => {
      const game = TestUtil.getDbGame({
        turn: new ObjectId(),
        players: [
          TestUtil.getDbGamePlayer({
            ready: true,
          }),
        ],
      })
      const allDecksChosenSpy = jest.spyOn(GameResolver, 'allDecksChosen').mockReturnValue(true)

      expect(GameResolver.getStatus(game)).toEqual(GameStatus.Playing)

      expect(allDecksChosenSpy.mock.calls).toEqual([[game]])
    })
    it('returns DONE if all decks chosen and turn and everybody ready and single victor', () => {
      const game = TestUtil.getDbGame({
        turn: new ObjectId(),
        players: [
          TestUtil.getDbGamePlayer({
            ready: true,
          }),
        ],
        victors: [new ObjectId()],
      })
      const allDecksChosenSpy = jest.spyOn(GameResolver, 'allDecksChosen').mockReturnValue(true)

      expect(GameResolver.getStatus(game)).toEqual(GameStatus.Done)

      expect(allDecksChosenSpy.mock.calls).toEqual([[game]])
    })
    it('returns DONE if all decks chosen and turn and everybody ready and multiple victors', () => {
      const game = TestUtil.getDbGame({
        turn: new ObjectId(),
        players: [
          TestUtil.getDbGamePlayer({
            ready: true,
          }),
        ],
        victors: [new ObjectId(), new ObjectId()],
      })
      const allDecksChosenSpy = jest.spyOn(GameResolver, 'allDecksChosen').mockReturnValue(true)

      expect(GameResolver.getStatus(game)).toEqual(GameStatus.Done)

      expect(allDecksChosenSpy.mock.calls).toEqual([[game]])
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
    status: GameResolver.getStatus(game),
    updated: game.updated,
    turn: game.turn
      ? resolvedGamePlayers.find((player) => player.user.id.toString() === game.turn?.toString())
      : undefined,
    victors,
    weather: [],
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
