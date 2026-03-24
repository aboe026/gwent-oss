import { ObjectId } from 'mongodb'

import { Game, GamePlayer, GameStatus, Unit, User } from '@gwent/graphql-schema/resolver-typings'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import GamePlayerResolver from '../../src/graphql/resolvers/types/game-player-resolver'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import getGameUnits from '../../src/graphql/resolvers/mutations/play-unit/get-game-units'
import { MoveType } from '@gwent/graphql-schema'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'
import Verifier from '../../src/util/verifier'

describe('game-resolver', () => {
  const creatorId = new ObjectId()
  const game = TestUtil.getDbGame({
    creator: creatorId,
    players: [
      TestUtil.getDbGamePlayer({
        user: creatorId,
        rounds: [
          TestUtil.getDbPlayerRound({
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbGameUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            }),
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
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbGameUnit({})],
            }),
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
            close: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            }),
            ranged: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbGameUnit({})],
            }),
            siege: TestUtil.getDbPlayerCombatRow({
              units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
            }),
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
  describe('fromObject', () => {
    it('throws error if creator not found', async () => {
      const testGame = TestUtil.getDbGame({})
      await testFromObject({
        game: testGame,
        expected: Error(`Could not find creator "${testGame.creator}" in resolved users`),
        players: [],
        resolvedUsers: [],
      })
    })
    it('throws error if turn player not found', async () => {
      const testGame = TestUtil.getDbGame({
        turn: new ObjectId(),
      })
      await testFromObject({
        game: testGame,
        expected: Error(`Could not find turn "${testGame.turn}" in resolved players`),
        players: [],
        resolvedUsers: [
          TestUtil.getUser({
            id: testGame.creator,
          }),
        ],
      })
    })
    it('throws error if only victor not found', async () => {
      const testGame = TestUtil.getDbGame({
        victors: [new ObjectId()],
      })
      await testFromObject({
        game: testGame,
        expected: Error(`Could not find victor "${testGame.victors[0]}" in resolved users`),
        players: [],
        resolvedUsers: [
          TestUtil.getUser({
            id: testGame.creator,
          }),
        ],
      })
    })
    it('throws error if first of many victors not found', async () => {
      const testGame = TestUtil.getDbGame({
        victors: [new ObjectId(), new ObjectId()],
      })
      await testFromObject({
        game: testGame,
        expected: Error(`Could not find victor "${testGame.victors[0]}" in resolved users`),
        players: [],
        resolvedUsers: [
          TestUtil.getUser({
            id: testGame.creator,
          }),
          TestUtil.getUser({
            id: testGame.victors[1],
          }),
        ],
      })
    })
    it('throws error if last of many victors not found', async () => {
      const testGame = TestUtil.getDbGame({
        victors: [new ObjectId(), new ObjectId()],
      })
      await testFromObject({
        game: testGame,
        expected: Error(`Could not find victor "${testGame.victors[1]}" in resolved users`),
        players: [],
        resolvedUsers: [
          TestUtil.getUser({
            id: testGame.creator,
          }),
          TestUtil.getUser({
            id: testGame.victors[0],
          }),
        ],
      })
    })
    it('returns game without turn', async () => {
      const users = [
        TestUtil.getUser({
          id: game.creator,
        }),
      ]
      const players = [TestUtil.getGamePlayer({}), TestUtil.getGamePlayer({})]
      await testFromObject({
        game,
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
        },
        players,
        resolvedUsers: users,
      })
    })
    it('returns game with turn', async () => {
      const users = [
        TestUtil.getUser({
          id: game.creator,
        }),
      ]
      const players = [
        TestUtil.getGamePlayer({}),
        TestUtil.getGamePlayer({
          user: users[0],
        }),
      ]
      await testFromObject({
        game: {
          ...game,
          turn: game.creator,
        },
        expected: {
          config: game.config,
          created: game.created,
          creator: users[0],
          id: game._id.toString(),
          players,
          round: game.round,
          status: game.status as GameStatus,
          turn: players[1],
          updated: game.updated,
          victors: [],
        },
        players,
        resolvedUsers: users,
      })
    })
    it('returns game with modifiers', async () => {
      const users = [
        TestUtil.getUser({
          id: game.creator,
        }),
      ]
      const players = [TestUtil.getGamePlayer({}), TestUtil.getGamePlayer({})]
      await testFromObject({
        game: {
          ...game,
          players: game.players.map((player) => {
            return {
              ...player,
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: TestUtil.getDbPlayerCombatRow({
                    modifier: TestUtil.getDbGameUnit({}),
                  }),
                }),
              ],
            }
          }),
        },
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
        },
        players,
        resolvedUsers: users,
      })
    })
    it('returns game with weathers', async () => {
      const users = [
        TestUtil.getUser({
          id: game.creator,
        }),
      ]
      const players = [TestUtil.getGamePlayer({}), TestUtil.getGamePlayer({})]
      await testFromObject({
        game: {
          ...game,
          players: game.players.map((player) => {
            return {
              ...player,
              rounds: [
                TestUtil.getDbPlayerRound({
                  weathers: [TestUtil.getDbGameUnit({})],
                }),
              ],
            }
          }),
        },
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
        },
        players,
        resolvedUsers: users,
      })
    })
    it('returns game with first player victor', async () => {
      const users = [
        TestUtil.getUser({
          id: game.players[0].user,
        }),
        TestUtil.getUser({
          id: game.players[1].user,
        }),
      ]
      const players = [TestUtil.getGamePlayer({}), TestUtil.getGamePlayer({})]
      await testFromObject({
        game: {
          ...game,
          victors: [game.players[0].user],
        },
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
          victors: [users[0]],
        },
        players,
        resolvedUsers: users,
      })
    })
    it('returns game with last player victor', async () => {
      const users = [
        TestUtil.getUser({
          id: game.players[0].user,
        }),
        TestUtil.getUser({
          id: game.players[1].user,
        }),
      ]
      const players = [TestUtil.getGamePlayer({}), TestUtil.getGamePlayer({})]
      await testFromObject({
        game: {
          ...game,
          victors: [game.players[1].user],
        },
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
          victors: [users[1]],
        },
        players,
        resolvedUsers: users,
      })
    })
    it('returns game with multiple victors', async () => {
      const users = [
        TestUtil.getUser({
          id: game.players[0].user,
        }),
        TestUtil.getUser({
          id: game.players[1].user,
        }),
      ]
      const players = [TestUtil.getGamePlayer({}), TestUtil.getGamePlayer({})]
      await testFromObject({
        game: {
          ...game,
          victors: [game.players[0].user, game.players[1].user],
        },
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
          victors: [users[0], users[1]],
        },
        players,
        resolvedUsers: users,
      })
    })
  })
  describe('fromArray', () => {
    it('returns empty array if given one', async () => {
      await testFromArray({
        games: [],
      })
    })
    it('resolves single game', async () => {
      const games = [game]
      await testFromArray({
        games: games,
        resolveUsersAndUnitsCalls: [
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
                  close: TestUtil.getDbPlayerCombatRow({
                    units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
                  }),
                  ranged: TestUtil.getDbPlayerCombatRow({
                    units: [TestUtil.getDbGameUnit({})],
                  }),
                  siege: TestUtil.getDbPlayerCombatRow({
                    units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
                  }),
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
                  close: TestUtil.getDbPlayerCombatRow({
                    units: [TestUtil.getDbGameUnit({})],
                  }),
                  ranged: TestUtil.getDbPlayerCombatRow({
                    units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
                  }),
                  siege: TestUtil.getDbPlayerCombatRow({
                    units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
                  }),
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
                  close: TestUtil.getDbPlayerCombatRow({
                    units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
                  }),
                  ranged: TestUtil.getDbPlayerCombatRow({
                    units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
                  }),
                  siege: TestUtil.getDbPlayerCombatRow({
                    units: [TestUtil.getDbGameUnit({})],
                  }),
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
        resolveUsersAndUnitsCalls: [
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
  describe('maskSpiedHandUnits', () => {
    it('does not mask single impact unit of self', () => {
      const self = TestUtil.getUser({})
      const impactUnit = TestUtil.getGameUnit({
        unit: TestUtil.getUnit({}),
      })
      const game = TestUtil.getGame({
        players: [
          TestUtil.getGamePlayer({
            user: self,
            rounds: [
              TestUtil.getPlayerRound({
                moves: [
                  TestUtil.getMoveUnit({
                    unit: TestUtil.getGameUnit({
                      unit: TestUtil.getUnit({}),
                    }),
                    target: TestUtil.getUser({}),
                    impacts: [
                      TestUtil.getImpact({
                        user: self,
                        unit: impactUnit,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
      testMaskSpiedHandUnits({
        game: game,
        userId: self.id,
        expected: {
          ...game,
          players: [
            {
              ...game.players[0],
              rounds: [
                {
                  ...game.players[0].rounds[0],
                  moves: [
                    {
                      ...game.players[0].rounds[0].moves[0],
                      impacts: [
                        {
                          ...(game.players[0].rounds[0].moves[0] as any).impacts[0],
                          unit: impactUnit,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      })
    })
    it('does not mask impact unit of self surrounded by other moves', () => {
      const self = TestUtil.getUser({})
      const impactUnit = TestUtil.getGameUnit({
        unit: TestUtil.getUnit({}),
      })
      const game = TestUtil.getGame({
        players: [
          TestUtil.getGamePlayer({
            user: self,
            rounds: [
              TestUtil.getPlayerRound({
                moves: [
                  TestUtil.getMoveUnit({
                    unit: TestUtil.getGameUnit({
                      unit: TestUtil.getUnit({}),
                    }),
                  }),
                  TestUtil.getMoveUnit({
                    unit: TestUtil.getGameUnit({
                      unit: TestUtil.getUnit({}),
                    }),
                    target: TestUtil.getUser({}),
                    impacts: [
                      TestUtil.getImpact({
                        user: self,
                        unit: impactUnit,
                      }),
                    ],
                  }),
                  TestUtil.getMovePass({}),
                ],
              }),
            ],
          }),
        ],
      })
      testMaskSpiedHandUnits({
        game: game,
        userId: self.id,
        expected: {
          ...game,
          players: [
            {
              ...game.players[0],
              rounds: [
                {
                  ...game.players[0].rounds[0],
                  moves: [
                    game.players[0].rounds[0].moves[0],
                    {
                      ...game.players[0].rounds[0].moves[1],
                      impacts: [
                        {
                          ...(game.players[0].rounds[0].moves[1] as any).impacts[0],
                          unit: impactUnit,
                        },
                      ],
                    },
                    game.players[0].rounds[0].moves[2],
                  ],
                },
              ],
            },
          ],
        },
      })
    })
    it('masks single impact unit of opponent', () => {
      const self = TestUtil.getUser({})
      const game = TestUtil.getGame({
        players: [
          TestUtil.getGamePlayer({
            user: self,
            rounds: [
              TestUtil.getPlayerRound({
                moves: [
                  TestUtil.getMoveUnit({
                    unit: TestUtil.getGameUnit({
                      unit: TestUtil.getUnit({}),
                    }),
                    target: TestUtil.getUser({}),
                    impacts: [
                      TestUtil.getImpact({
                        user: TestUtil.getUser({}),
                        unit: TestUtil.getGameUnit({
                          unit: TestUtil.getUnit({}),
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      })
      testMaskSpiedHandUnits({
        game: game,
        userId: self.id,
        expected: {
          ...game,
          players: [
            {
              ...game.players[0],
              rounds: [
                {
                  ...game.players[0].rounds[0],
                  moves: [
                    {
                      ...game.players[0].rounds[0].moves[0],
                      impacts: [
                        {
                          ...(game.players[0].rounds[0].moves[0] as any).impacts[0],
                          unit: undefined,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      })
    })
    it('masks impact unit of opponent surrounded by other moves', () => {
      const self = TestUtil.getUser({})
      const game = TestUtil.getGame({
        players: [
          TestUtil.getGamePlayer({
            user: self,
            rounds: [
              TestUtil.getPlayerRound({
                moves: [
                  TestUtil.getMoveUnit({
                    unit: TestUtil.getGameUnit({
                      unit: TestUtil.getUnit({}),
                    }),
                  }),
                  TestUtil.getMoveUnit({
                    unit: TestUtil.getGameUnit({
                      unit: TestUtil.getUnit({}),
                    }),
                    target: TestUtil.getUser({}),
                    impacts: [
                      TestUtil.getImpact({
                        user: TestUtil.getUser({}),
                        unit: TestUtil.getGameUnit({
                          unit: TestUtil.getUnit({}),
                        }),
                      }),
                    ],
                  }),
                  TestUtil.getMovePass({}),
                ],
              }),
            ],
          }),
        ],
      })
      testMaskSpiedHandUnits({
        game: game,
        userId: self.id,
        expected: {
          ...game,
          players: [
            {
              ...game.players[0],
              rounds: [
                {
                  ...game.players[0].rounds[0],
                  moves: [
                    game.players[0].rounds[0].moves[0],
                    {
                      ...game.players[0].rounds[0].moves[1],
                      impacts: [
                        {
                          ...(game.players[0].rounds[0].moves[1] as any).impacts[0],
                          unit: undefined,
                        },
                      ],
                    },
                    game.players[0].rounds[0].moves[2],
                  ],
                },
              ],
            },
          ],
        },
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
  const resolveUsersAndUnitsSpy = jest.spyOn(ResolverUtil, 'resolveUsersAndUnits').mockResolvedValue({
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

  expect(resolveUsersAndUnitsSpy.mock.calls).toEqual([
    [
      {
        moves: game.players
          .map((player) => player.rounds)
          .flat()
          .map((round) => round.moves)
          .flat(),
        gameUnits: getGameUnits({
          rounds: game.players.map((player) => player.rounds).flat(),
        }),
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
  resolveUsersAndUnitsCalls = [],
}: {
  games: GameDbObject[]
  resolveUsersAndUnitsCalls?: any[][]
}) {
  const units = [TestUtil.getUnit({})]
  const users = [TestUtil.getUser({})]
  const resolveUsersAndUnitsSpy = jest.spyOn(ResolverUtil, 'resolveUsersAndUnits').mockResolvedValue({
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

  expect(resolveUsersAndUnitsSpy.mock.calls).toEqual(resolveUsersAndUnitsCalls)
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

function testMaskSpiedHandUnits({ game, userId, expected }: { game: Game; userId: ObjectId | string; expected: Game }) {
  expect(
    GameResolver.maskSpiedHandUnits({
      game,
      userId,
    })
  ).toEqual(expected)
}
