import { ObjectId } from 'mongodb'

import { Combat, Game, GamePlayer, GameStatus, Unit, User } from '@gwent/graphql-schema/resolver-typings'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import GamePlayerResolver from '../../src/graphql/resolvers/types/game-player-resolver'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import { MoveType } from '@gwent/graphql-schema'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'
import Verifier from '../../src/util/verifier'

describe('game-resolver', () => {
  describe('fromObject', () => {
    it('throws error if creator not found', async () => {
      const game = TestUtil.getDbGame({})
      await testFromObject({
        game: game,
        expected: Error(`Could not find creator "${game.creator}" in resolved users`),
        players: [],
        resolvedUsers: [],
      })
    })
    it('throws error if turn player not found', async () => {
      const game = TestUtil.getDbGame({
        turn: new ObjectId(),
      })
      await testFromObject({
        game: game,
        expected: Error(`Could not find turn "${game.turn}" in resolved players`),
        players: [],
        resolvedUsers: [
          TestUtil.getUser({
            id: game.creator,
          }),
        ],
      })
    })
    it('throws error if only victor not found', async () => {
      const game = TestUtil.getDbGame({
        victors: [new ObjectId()],
      })
      await testFromObject({
        game: game,
        expected: Error(`Could not find victor "${game.victors[0]}" in resolved users`),
        players: [],
        resolvedUsers: [
          TestUtil.getUser({
            id: game.creator,
          }),
        ],
      })
    })
    it('throws error if first of many victors not found', async () => {
      const game = TestUtil.getDbGame({
        victors: [new ObjectId(), new ObjectId()],
      })
      await testFromObject({
        game: game,
        expected: Error(`Could not find victor "${game.victors[0]}" in resolved users`),
        players: [],
        resolvedUsers: [
          TestUtil.getUser({
            id: game.creator,
          }),
          TestUtil.getUser({
            id: game.victors[1],
          }),
        ],
      })
    })
    it('throws error if last of many victors not found', async () => {
      const game = TestUtil.getDbGame({
        victors: [new ObjectId(), new ObjectId()],
      })
      await testFromObject({
        game: game,
        expected: Error(`Could not find victor "${game.victors[1]}" in resolved users`),
        players: [],
        resolvedUsers: [
          TestUtil.getUser({
            id: game.creator,
          }),
          TestUtil.getUser({
            id: game.victors[0],
          }),
        ],
      })
    })
    it('returns game without turn', async () => {
      const users = [TestUtil.getUser({})]
      const players = [TestUtil.getGamePlayer({}), TestUtil.getGamePlayer({})]
      const game = TestUtil.getDbGame({
        creator: users[0].id,
        players: [
          TestUtil.getDbGamePlayer({
            user: players[0].user.id,
          }),
          TestUtil.getDbGamePlayer({
            user: players[1].user.id,
          }),
        ],
      })
      // TODO: add rounds/moves to get full coverage
      await testFromObject({
        game: game,
        expected: {
          config: game.config,
          created: game.created,
          creator: users[0],
          id: game._id.toString(),
          players,
          round: game.round,
          status: game.status as GameStatus,
          turn: undefined,
          updated: game.updated,
          victors: [],
          weather: game.weather.map((weather) => weather as Combat),
        },
        players,
        resolvedUsers: users,
      })
    })
    // TODO: more test cases
  })
  describe('fromArray', () => {
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              close: {
                score: 0,
                units: [TestUtil.getDbGameUnit({})],
              },
              ranged: {
                score: 0,
                units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
              },
              siege: {
                score: 0,
                units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
              },
              moves: [
                TestUtil.getDbMove({
                  type: MoveType.Unit,
                  unit: TestUtil.getDbGameUnit({}),
                }),
                TestUtil.getDbMove({
                  type: MoveType.Unit,
                  unit: TestUtil.getDbGameUnit({}),
                }),
              ],
            }),
            TestUtil.getDbPlayerRound({
              close: {
                score: 0,
                units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
              },
              ranged: {
                score: 0,
                units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
              },
              siege: {
                score: 0,
                units: [TestUtil.getDbGameUnit({})],
              },
              moves: [
                TestUtil.getDbMove({
                  type: MoveType.Unit,
                  unit: TestUtil.getDbGameUnit({}),
                }),
              ],
            }),
          ],
        }),
        TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              close: {
                score: 0,
                units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
              },
              ranged: {
                score: 0,
                units: [TestUtil.getDbGameUnit({})],
              },
              siege: {
                score: 0,
                units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
              },
              moves: [
                TestUtil.getDbMove({
                  type: MoveType.Unit,
                  unit: TestUtil.getDbGameUnit({}),
                }),
                TestUtil.getDbMove({
                  type: MoveType.Unit,
                  unit: TestUtil.getDbGameUnit({}),
                }),
                TestUtil.getDbMove({
                  type: MoveType.Unit,
                  unit: TestUtil.getDbGameUnit({}),
                }),
              ],
            }),
          ],
        }),
      ],
    })
    it('returns empty array if given one', async () => {
      await testFromArray({
        games: [],
      })
    })
    it('resolves single game', async () => {
      const games = [game]
      await testFromArray({
        games: games,
        resolveMoveUsersAndUnitsCalls: [
          [
            {
              moves: [
                games[0].players[0].rounds[0].moves[0],
                games[0].players[0].rounds[0].moves[1],
                games[0].players[0].rounds[1].moves[0],
                games[0].players[1].rounds[0].moves[0],
                games[0].players[1].rounds[0].moves[1],
                games[0].players[1].rounds[0].moves[2],
              ],
              gameUnits: [
                games[0].players[0].rounds[0].close.units[0],
                games[0].players[0].rounds[0].ranged.units[0],
                games[0].players[0].rounds[0].ranged.units[1],
                games[0].players[0].rounds[0].siege.units[0],
                games[0].players[0].rounds[0].siege.units[1],
                games[0].players[0].rounds[0].siege.units[2],
                games[0].players[0].rounds[1].close.units[0],
                games[0].players[0].rounds[1].close.units[1],
                games[0].players[0].rounds[1].ranged.units[0],
                games[0].players[0].rounds[1].ranged.units[1],
                games[0].players[0].rounds[1].ranged.units[2],
                games[0].players[0].rounds[1].siege.units[0],
                games[0].players[1].rounds[0].close.units[0],
                games[0].players[1].rounds[0].close.units[1],
                games[0].players[1].rounds[0].close.units[2],
                games[0].players[1].rounds[0].ranged.units[0],
                games[0].players[1].rounds[0].siege.units[0],
                games[0].players[1].rounds[0].siege.units[1],
              ],
              userIds: [games[0].players[0].user, games[0].players[1].user],
            },
          ],
        ],
      })
    })
    it('resolves multiple games', async () => {
      const games = [
        game,
        TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
                  },
                  ranged: {
                    score: 0,
                    units: [TestUtil.getDbGameUnit({})],
                  },
                  siege: {
                    score: 0,
                    units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
                  },
                  moves: [
                    TestUtil.getDbMove({
                      type: MoveType.Unit,
                      unit: TestUtil.getDbGameUnit({}),
                    }),
                    TestUtil.getDbMove({
                      type: MoveType.Unit,
                      unit: TestUtil.getDbGameUnit({}),
                    }),
                    TestUtil.getDbMove({
                      type: MoveType.Unit,
                      unit: TestUtil.getDbGameUnit({}),
                    }),
                  ],
                }),
              ],
            }),
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [TestUtil.getDbGameUnit({})],
                  },
                  ranged: {
                    score: 0,
                    units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
                  },
                  siege: {
                    score: 0,
                    units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
                  },
                  moves: [
                    TestUtil.getDbMove({
                      type: MoveType.Unit,
                      unit: TestUtil.getDbGameUnit({}),
                    }),
                    TestUtil.getDbMove({
                      type: MoveType.Unit,
                      unit: TestUtil.getDbGameUnit({}),
                    }),
                  ],
                }),
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
                  },
                  ranged: {
                    score: 0,
                    units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
                  },
                  siege: {
                    score: 0,
                    units: [TestUtil.getDbGameUnit({})],
                  },
                  moves: [
                    TestUtil.getDbMove({
                      type: MoveType.Unit,
                      unit: TestUtil.getDbGameUnit({}),
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ]
      await testFromArray({
        games: games,
        resolveMoveUsersAndUnitsCalls: [
          [
            {
              moves: [
                games[0].players[0].rounds[0].moves[0],
                games[0].players[0].rounds[0].moves[1],
                games[0].players[0].rounds[1].moves[0],
                games[0].players[1].rounds[0].moves[0],
                games[0].players[1].rounds[0].moves[1],
                games[0].players[1].rounds[0].moves[2],
                games[1].players[0].rounds[0].moves[0],
                games[1].players[0].rounds[0].moves[1],
                games[1].players[0].rounds[0].moves[2],
                games[1].players[1].rounds[0].moves[0],
                games[1].players[1].rounds[0].moves[1],
                games[1].players[1].rounds[1].moves[0],
              ],
              gameUnits: [
                games[0].players[0].rounds[0].close.units[0],
                games[0].players[0].rounds[0].ranged.units[0],
                games[0].players[0].rounds[0].ranged.units[1],
                games[0].players[0].rounds[0].siege.units[0],
                games[0].players[0].rounds[0].siege.units[1],
                games[0].players[0].rounds[0].siege.units[2],
                games[0].players[0].rounds[1].close.units[0],
                games[0].players[0].rounds[1].close.units[1],
                games[0].players[0].rounds[1].ranged.units[0],
                games[0].players[0].rounds[1].ranged.units[1],
                games[0].players[0].rounds[1].ranged.units[2],
                games[0].players[0].rounds[1].siege.units[0],
                games[0].players[1].rounds[0].close.units[0],
                games[0].players[1].rounds[0].close.units[1],
                games[0].players[1].rounds[0].close.units[2],
                games[0].players[1].rounds[0].ranged.units[0],
                games[0].players[1].rounds[0].siege.units[0],
                games[0].players[1].rounds[0].siege.units[1],
                games[1].players[0].rounds[0].close.units[0],
                games[1].players[0].rounds[0].close.units[1],
                games[1].players[0].rounds[0].close.units[2],
                games[1].players[0].rounds[0].ranged.units[0],
                games[1].players[0].rounds[0].siege.units[0],
                games[1].players[0].rounds[0].siege.units[1],
                games[1].players[1].rounds[0].close.units[0],
                games[1].players[1].rounds[0].ranged.units[0],
                games[1].players[1].rounds[0].ranged.units[1],
                games[1].players[1].rounds[0].siege.units[0],
                games[1].players[1].rounds[0].siege.units[1],
                games[1].players[1].rounds[0].siege.units[2],
                games[1].players[1].rounds[1].close.units[0],
                games[1].players[1].rounds[1].close.units[1],
                games[1].players[1].rounds[1].ranged.units[0],
                games[1].players[1].rounds[1].ranged.units[1],
                games[1].players[1].rounds[1].ranged.units[2],
                games[1].players[1].rounds[1].siege.units[0],
              ],
              userIds: [
                games[0].players[0].user,
                games[0].players[1].user,
                games[1].players[0].user,
                games[1].players[1].user,
              ],
            },
          ],
        ],
      })
    })
  })
  describe('fromId', () => {
    it('throws error if verifyObjects throws error', async () => {
      await testFromId({
        verifyObjectsResponse: Error(`Could not find games "["id"]" to resolve.`),
      })
    })
    it('returns resolved game if getById returns game', async () => {
      const game = TestUtil.getDbGame({})
      await testFromId({
        game,
        resolvedGame: TestUtil.getGameFromDbGame({
          game,
        }),
      })
    })
  })
})

async function testFromObject({
  game,
  users,
  units,
  resolvedUsers,
  players = [],
  expected,
}: {
  game: GameDbObject
  users?: User[]
  units?: Unit[]
  resolvedUsers: User[]
  players: GamePlayer[]
  expected: Game | Error
}) {
  const resolvedUnits = [TestUtil.getUnit({})]
  const resolveMoveUsersAndUnitsSpy = jest.spyOn(ResolverUtil, 'resolveMoveUsersAndUnits').mockResolvedValue({
    users: resolvedUsers,
    units: resolvedUnits,
  })
  const gamePlayerResolverSpy = jest.spyOn(GamePlayerResolver, 'fromArray').mockResolvedValue(players)

  const promise = GameResolver.fromObject({
    game,
    units,
    users,
  })
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(resolveMoveUsersAndUnitsSpy.mock.calls).toEqual([
    [
      {
        moves: game.players
          .map((player) => player.rounds)
          .flat()
          .map((round) => round.moves)
          .flat(),
        gameUnits: game.players
          .map((player) => player.rounds)
          .flat()
          .map((round) => [...round.close.units, ...round.ranged.units, ...round.siege.units])
          .flat(),
        userIds: game.players.map((player) => player.user),
        presolvedUnits: units,
        presolvedUsers: users,
      },
    ],
  ])
  expect(gamePlayerResolverSpy.mock.calls).toEqual([
    [
      {
        players: game.players,
        gameStatus: game.status,
        users: resolvedUsers,
        units: resolvedUnits,
      },
    ],
  ])
}

async function testFromArray({
  games,
  resolveMoveUsersAndUnitsCalls = [],
}: {
  games: GameDbObject[]
  resolveMoveUsersAndUnitsCalls?: any[][]
}) {
  const units = [TestUtil.getUnit({})]
  const users = [TestUtil.getUser({})]
  const resolveMoveUsersAndUnitsSpy = jest.spyOn(ResolverUtil, 'resolveMoveUsersAndUnits').mockResolvedValue({
    units,
    users,
  })
  const fromObjectSpy = jest.spyOn(GameResolver, 'fromObject')
  const resolvedGames: Game[] = []
  for (const game of games) {
    const resoledGame = TestUtil.getGameFromDbGame({
      game,
    })
    fromObjectSpy.mockResolvedValueOnce(resoledGame)
    resolvedGames.push(resoledGame)
  }

  await expect(GameResolver.fromArray(games)).resolves.toEqual(resolvedGames)

  expect(resolveMoveUsersAndUnitsSpy.mock.calls).toEqual(resolveMoveUsersAndUnitsCalls)
  expect(fromObjectSpy.mock.calls).toEqual(
    games.map((game) => {
      return [
        {
          game,
          users,
          units,
        },
      ]
    })
  )
}

async function testFromId({
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
