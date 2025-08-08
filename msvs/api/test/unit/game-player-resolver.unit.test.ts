import { ObjectId } from 'mongodb'

import { Faction, GamePlayer, Leader, Unit, User } from '@gwent/graphql-schema/resolver-typings'
import FactionResolver from '../../src/graphql/resolvers/types/faction-resolver'
import { GamePlayerDbObject, GameStatus, GameUnitOrigin } from '@gwent/graphql-schema/database-typings'
import GamePlayerResolver from '../../src/graphql/resolvers/types/game-player-resolver'
import LeaderResolver from '../../src/graphql/resolvers/types/leader-resolver'
import { MoveType } from '@gwent/graphql-schema'
import PlayerRoundResolver from '../../src/graphql/resolvers/types/player-round-resolver'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'

describe('game-player-resolver', () => {
  describe('fromObject', () => {
    it('throws error if user is not in users input', async () => {
      const user = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      const message = `Could not find user "${user.id}"`
      await testResolveFromObject({
        gameStatus: GameStatus.Decking,
        player: TestUtil.getDbGamePlayer({
          ready: true,
          user: user.id,
        }),
        faction,
        leader: TestUtil.getLeader({
          faction,
        }),
        users: [],
        error: `${message}.`,
        errorCalls: [[`${message}, resolvedUsers: "[]"`]],
      })
    })
    it('throws error if user is not in resolved users', async () => {
      const user = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      const message = `Could not find user "${user.id}"`
      await testResolveFromObject({
        gameStatus: GameStatus.Decking,
        player: TestUtil.getDbGamePlayer({
          ready: true,
          user: user.id,
        }),
        faction,
        leader: TestUtil.getLeader({
          faction,
        }),
        resolvedUsers: [],
        error: `${message}.`,
        errorCalls: [[`${message}, resolvedUsers: "[]"`]],
      })
    })
    it('returns without faction, leader or counts if status decking', async () => {
      const user = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      await testResolveFromObject({
        gameStatus: GameStatus.Decking,
        player: TestUtil.getDbGamePlayer({
          ready: true,
          user: user.id,
        }),
        faction,
        leader: TestUtil.getLeader({
          faction,
        }),
        users: [user],
        user,
      })
    })
    it('returns faction, leader and counts if status not decking', async () => {
      const user = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      await testResolveFromObject({
        gameStatus: GameStatus.Ordering,
        player: TestUtil.getDbGamePlayer({
          ready: true,
          user: user.id,
          order: 1,
        }),
        faction,
        leader: TestUtil.getLeader({
          faction,
        }),
        users: [user],
        user,
      })
    })
    it('reaches out to resolvers if status not decking chosen but nothing provided', async () => {
      const user1 = TestUtil.getUser({})
      const user2 = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      const leader = TestUtil.getLeader({})
      await testResolveFromObject({
        gameStatus: GameStatus.Ordering,
        player: TestUtil.getDbGamePlayer({
          ready: true,
          user: user1.id,
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({
              faction: faction.id,
              leader: leader.id,
            }),
          }),
          rounds: [
            TestUtil.getDbPlayerRound({
              moves: [
                TestUtil.getDbMove({
                  type: MoveType.Unit,
                  source: {
                    origin: GameUnitOrigin.Hand,
                    user: new ObjectId(user1.id),
                  },
                }),
                TestUtil.getDbMove({
                  type: MoveType.Unit,
                  source: {
                    origin: GameUnitOrigin.Hand,
                    user: new ObjectId(user2.id),
                  },
                }),
                TestUtil.getDbMove({
                  type: MoveType.Unit,
                }),
                TestUtil.getDbMove({
                  type: MoveType.Leader,
                  leaderId: new ObjectId(),
                }),
              ],
            }),
          ],
        }),
        user: user1,
        resolvedFaction: faction,
        resolvedLeader: leader,
        resolvedUsers: [user1, user2],
        factionResolverCalls: [
          [
            {
              id: new ObjectId(faction.id),
            },
          ],
        ],
        leaderResolverCalls: [
          [
            {
              id: new ObjectId(leader.id),
            },
          ],
        ],
      })
    })
    it('reaches out to resolvers if status not decking chosen and everything provided', async () => {
      const user1 = TestUtil.getUser({})
      const user2 = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      const leader = TestUtil.getLeader({})
      await testResolveFromObject({
        gameStatus: GameStatus.Ordering,
        player: TestUtil.getDbGamePlayer({
          ready: true,
          user: user1.id,
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({
              faction: faction.id,
              leader: leader.id,
            }),
          }),
          rounds: [
            TestUtil.getDbPlayerRound({
              moves: [
                TestUtil.getDbMove({
                  type: MoveType.Unit,
                  source: {
                    origin: GameUnitOrigin.Hand,
                    user: new ObjectId(user1.id),
                  },
                }),
                TestUtil.getDbMove({
                  type: MoveType.Unit,
                  source: {
                    origin: GameUnitOrigin.Hand,
                    user: new ObjectId(user2.id),
                  },
                }),
                TestUtil.getDbMove({
                  type: MoveType.Unit,
                }),
                TestUtil.getDbMove({
                  type: MoveType.Leader,
                  leaderId: new ObjectId(),
                }),
              ],
            }),
          ],
        }),
        user: user1,
        faction,
        leader,
        users: [user1, user2],
        factionResolverCalls: [],
        leaderResolverCalls: [],
      })
    })
  })
  describe('fromArray', () => {
    const players = [
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
    ]
    it('throws error if faction not found', async () => {
      const factionId = new ObjectId()
      const leaderId = new ObjectId()
      await testResolveFromArray({
        players: [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({
                faction: factionId,
                leader: leaderId,
              }),
            }),
          }),
        ],
        gameStatus: GameStatus.Playing,
        error: `Could not find faction "${factionId}" in resolved factions`,
        factionResolverCalls: [
          [
            {
              ids: [factionId],
            },
          ],
        ],
        leaderResolverCalls: [
          [
            {
              ids: [leaderId],
              resolvedFactions: [],
            },
          ],
        ],
      })
    })
    it('throws error if leader not found', async () => {
      const factionId = new ObjectId()
      const leaderId = new ObjectId()
      const faction = TestUtil.getFaction({
        id: factionId,
      })
      await testResolveFromArray({
        players: [
          TestUtil.getDbGamePlayer({
            deck: TestUtil.getDbGameDeck({
              from: TestUtil.getDbDeck({
                faction: factionId,
                leader: leaderId,
              }),
            }),
          }),
        ],
        gameStatus: GameStatus.Playing,
        resolvedFactions: [faction],
        error: `Could not find leader "${leaderId}" in resolved leaders`,
        factionResolverCalls: [
          [
            {
              ids: [factionId],
            },
          ],
        ],
        leaderResolverCalls: [
          [
            {
              ids: [leaderId],
              resolvedFactions: [faction],
            },
          ],
        ],
      })
    })
    it('returns empty array if given one', async () => {
      await testResolveFromArray({
        players: [],
        gameStatus: GameStatus.Decking,
      })
    })
    it('returns single object if no deck from', async () => {
      const player = TestUtil.getDbGamePlayer({})
      const users = [
        TestUtil.getUser({
          id: player.user,
        }),
      ]
      const units = [TestUtil.getUnit({})]

      await testResolveFromArray({
        players: [player],
        gameStatus: GameStatus.Playing,
        resolvedUsers: users,
        resolvedUnits: units,
        factionResolverCalls: [
          [
            {
              ids: [],
            },
          ],
        ],
        leaderResolverCalls: [
          [
            {
              ids: [],
              resolvedFactions: [],
            },
          ],
        ],
        gamePlayerFromObjectCalls: [
          [
            {
              player,
              users,
              units,
              faction: undefined,
              leader: undefined,
              gameStatus: GameStatus.Playing,
            },
          ],
        ],
      })
    })
    it('returns single object if deck from', async () => {
      const factionId = new ObjectId()
      const leaderId = new ObjectId()
      const faction = TestUtil.getFaction({
        id: factionId,
      })
      const leader = TestUtil.getLeader({
        id: leaderId,
      })
      const player = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({
            faction: factionId,
            leader: leaderId,
          }),
        }),
      })
      const users = [
        TestUtil.getUser({
          id: player.user,
        }),
      ]
      const units = [TestUtil.getUnit({})]

      await testResolveFromArray({
        players: [player],
        gameStatus: GameStatus.Playing,
        resolvedUsers: users,
        resolvedUnits: units,
        resolvedFactions: [faction],
        resolvedLeaders: [leader],
        factionResolverCalls: [
          [
            {
              ids: [factionId],
            },
          ],
        ],
        leaderResolverCalls: [
          [
            {
              ids: [leaderId],
              resolvedFactions: [faction],
            },
          ],
        ],
        gamePlayerFromObjectCalls: [
          [
            {
              player,
              users,
              units,
              faction,
              leader,
              gameStatus: GameStatus.Playing,
            },
          ],
        ],
      })
    })
    it('returns multiple players with presolved inputs', async () => {
      const users = [
        TestUtil.getUser({
          id: players[0].user,
        }),
        TestUtil.getUser({
          id: players[1].user,
        }),
      ]
      const units = [TestUtil.getUnit({})]
      await testResolveFromArray({
        players,
        gameStatus: GameStatus.Playing,
        units,
        users,
        factionResolverCalls: [
          [
            {
              ids: [],
            },
          ],
        ],
        leaderResolverCalls: [
          [
            {
              ids: [],
              resolvedFactions: [],
            },
          ],
        ],
        gamePlayerFromObjectCalls: [
          [
            {
              player: players[0],
              users,
              units,
              faction: undefined,
              leader: undefined,
              gameStatus: GameStatus.Playing,
            },
          ],
          [
            {
              player: players[1],
              users,
              units,
              faction: undefined,
              leader: undefined,
              gameStatus: GameStatus.Playing,
            },
          ],
        ],
      })
    })
    it('returns multiple players with no presolved inputs', async () => {
      const users = [
        TestUtil.getUser({
          id: players[0].user,
        }),
        TestUtil.getUser({
          id: players[1].user,
        }),
      ]
      const units = [TestUtil.getUnit({})]
      await testResolveFromArray({
        players,
        gameStatus: GameStatus.Playing,
        resolvedUnits: units,
        resolvedUsers: users,
        factionResolverCalls: [
          [
            {
              ids: [],
            },
          ],
        ],
        leaderResolverCalls: [
          [
            {
              ids: [],
              resolvedFactions: [],
            },
          ],
        ],
        gamePlayerFromObjectCalls: [
          [
            {
              player: players[0],
              users,
              units,
              faction: undefined,
              leader: undefined,
              gameStatus: GameStatus.Playing,
            },
          ],
          [
            {
              player: players[1],
              users,
              units,
              faction: undefined,
              leader: undefined,
              gameStatus: GameStatus.Playing,
            },
          ],
        ],
      })
    })
  })
})

async function testResolveFromObject({
  player,
  users,
  units,
  faction,
  leader,
  gameStatus,
  user,
  resolvedFaction,
  resolvedLeader,
  resolvedUsers = [],
  resolvedUnits = [TestUtil.getUnit({})],
  error,
  factionResolverCalls = [],
  leaderResolverCalls = [],
  errorCalls = [],
}: {
  player: GamePlayerDbObject
  users?: User[]
  units?: Unit[]
  faction?: Faction | undefined
  leader?: Leader | undefined
  gameStatus: GameStatus
  user?: User
  resolvedFaction?: Faction
  resolvedLeader?: Leader
  resolvedUsers?: User[]
  resolvedUnits?: Unit[]
  error?: string
  factionResolverCalls?: any[][]
  leaderResolverCalls?: any[][]
  errorCalls?: any[][]
}) {
  const factionResolverSpy = jest.spyOn(FactionResolver, 'fromId')
  if (resolvedFaction) {
    factionResolverSpy.mockResolvedValue(resolvedFaction)
  }
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'fromId')
  if (resolvedLeader) {
    leaderResolverSpy.mockResolvedValue(resolvedLeader)
  }
  const resolveUsersAndUnitsSpy = jest.spyOn(ResolverUtil, 'resolveUsersAndUnits').mockResolvedValue({
    units: units || resolvedUnits,
    users: users || resolvedUsers,
  })
  const playerRoundsFromArraySpy = jest.spyOn(PlayerRoundResolver, 'fromArray').mockResolvedValue([])
  const errorSpy = jest.fn().mockImplementation()
  GamePlayerResolver['logger'] = {
    error: errorSpy,
  } as any

  const promise = GamePlayerResolver.fromObject({
    gameStatus,
    player,
    faction,
    leader,
    users,
  })

  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual({
      counts:
        gameStatus !== GameStatus.Decking
          ? {
              discard: player.deck.discard.length,
              hand: player.deck.hand.length,
              undrawn: player.deck.undrawn.length,
            }
          : undefined,
      faction: gameStatus === GameStatus.Decking ? undefined : faction || resolvedFaction,
      leader: gameStatus === GameStatus.Decking ? undefined : leader || resolvedLeader,
      order: player.order,
      ready: player.ready,
      rounds: [],
      user,
    })
  }

  expect(factionResolverSpy.mock.calls).toEqual(factionResolverCalls)
  expect(leaderResolverSpy.mock.calls).toEqual(leaderResolverCalls)
  expect(resolveUsersAndUnitsSpy.mock.calls).toEqual([
    [
      {
        moves: player.rounds
          .flat()
          .map((round) => round.moves)
          .flat(),
        gameUnits: player.rounds
          .flat()
          .map((round) => [...round.close.units, ...round.ranged.units, ...round.siege.units])
          .flat(),
        presolvedUsers: users,
        presolvedUnits: units,
      },
    ],
  ])
  expect(playerRoundsFromArraySpy.mock.calls).toEqual(
    error
      ? []
      : [
          [
            {
              rounds: player.rounds,
              users: users || resolvedUsers,
              units: units || resolvedUnits,
            },
          ],
        ]
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}

async function testResolveFromArray({
  players,
  users,
  units,
  gameStatus,
  resolvedUnits = [],
  resolvedUsers = [],
  resolvedFactions = [],
  resolvedLeaders = [],
  error,
  factionResolverCalls = [],
  leaderResolverCalls = [],
  gamePlayerFromObjectCalls = [],
}: {
  players: GamePlayerDbObject[]
  users?: User[]
  units?: Unit[]
  gameStatus: GameStatus
  resolvedUsers?: User[]
  resolvedUnits?: Unit[]
  resolvedFactions?: Faction[]
  resolvedLeaders?: Leader[]
  error?: string
  factionResolverCalls?: any[][]
  leaderResolverCalls?: any[][]
  gamePlayerFromObjectCalls?: any[][]
}) {
  const resolveUsersAndUnitsSpy = jest.spyOn(ResolverUtil, 'resolveUsersAndUnits').mockResolvedValue({
    units: units || resolvedUnits,
    users: users || resolvedUsers,
  })
  const factionResolverSpy = jest.spyOn(FactionResolver, 'fromIds').mockResolvedValue(resolvedFactions)
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'fromIds').mockResolvedValue(resolvedLeaders)
  const gamePlayerResolveFromObjectSpy = jest.spyOn(GamePlayerResolver, 'fromObject')
  const resolvedGamePlayers: GamePlayer[] = []
  for (const player of players) {
    const resolvedGamePlayer = TestUtil.getGamePlayer({
      faction: player.deck.from?.faction
        ? TestUtil.getFaction({
            id: player.deck.from?.faction,
          })
        : undefined,
      leader: player.deck.from?.leader
        ? TestUtil.getLeader({
            id: player.deck.from?.leader,
          })
        : undefined,
    })
    gamePlayerResolveFromObjectSpy.mockResolvedValueOnce(resolvedGamePlayer)
    resolvedGamePlayers.push(resolvedGamePlayer)
  }

  const promise = GamePlayerResolver.fromArray({
    gameStatus,
    players,
    users,
    units,
  })
  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual(resolvedGamePlayers)
  }

  expect(resolveUsersAndUnitsSpy.mock.calls).toEqual(
    players.length === 0
      ? []
      : [
          [
            {
              moves: players
                .flat()
                .map((player) => player.rounds)
                .flat()
                .map((round) => round.moves)
                .flat(),
              gameUnits: players
                .flat()
                .map((player) => player.rounds)
                .flat()
                .map((round) => [...round.close.units, ...round.ranged.units, ...round.siege.units])
                .flat(),
              presolvedUsers: users,
              presolvedUnits: units,
            },
          ],
        ]
  )
  expect(factionResolverSpy.mock.calls).toEqual(factionResolverCalls)
  expect(leaderResolverSpy.mock.calls).toEqual(leaderResolverCalls)
  expect(gamePlayerResolveFromObjectSpy.mock.calls).toEqual(gamePlayerFromObjectCalls)
}
