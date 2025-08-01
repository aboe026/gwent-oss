import { ObjectId } from 'mongodb'

import { Faction, GamePlayer, Leader, User } from '@gwent/graphql-schema/resolver-typings'
import FactionResolver from '../../src/graphql/resolvers/types/faction-resolver'
import { GamePlayerDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import GamePlayerResolver from '../../src/graphql/resolvers/types/game-player-resolver'
import LeaderResolver from '../../src/graphql/resolvers/types/leader-resolver'
import TestUtil from '../util/test-util'
import UserResolver from '../../src/graphql/resolvers/types/user-resolver'

describe('game-player-resolver', () => {
  describe('fromObject', () => {
    it('throws error if user is not in users input', async () => {
      const user = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      const message = `Could not find user "${user.id}" in pre-resolved users`
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
      const user = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      const leader = TestUtil.getLeader({})
      await testResolveFromObject({
        gameStatus: GameStatus.Ordering,
        player: TestUtil.getDbGamePlayer({
          ready: true,
          user: user.id,
          deck: TestUtil.getDbGameDeck({
            from: TestUtil.getDbDeck({
              faction: faction.id,
              leader: leader.id,
            }),
          }),
        }),
        user,
        resolvedFaction: faction,
        resolvedLeader: leader,
        resolvedUsers: [user],
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
        userResolverCalls: [[[user.id]]],
      })
    })
  })
  describe('fromArray', () => {
    it('returns resolved objects if no deck chosen', async () => {
      const user1 = TestUtil.getUser({})
      const user2 = TestUtil.getUser({})
      const player1 = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({}),
        user: user1.id,
      })
      const player2 = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({}),
        user: user2.id,
      })
      await testResolveFromArray({
        gameStatus: GameStatus.Decking,
        players: [player1, player2],
        resolvedUsers: [user1, user2],
        resolvedGamePlayers: [
          TestUtil.getGamePlayer({
            user: user1,
          }),
          TestUtil.getGamePlayer({
            user: user2,
          }),
        ],
        userResolverCalls: [[[new ObjectId(user1.id), new ObjectId(user2.id)]]],
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
        gamePlayerResolverCalls: [
          [
            {
              player: player1,
              users: [user1, user2],
              faction: undefined,
              leader: undefined,
              gameStatus: GameStatus.Decking,
            },
          ],
          [
            {
              player: player2,
              users: [user1, user2],
              faction: undefined,
              leader: undefined,
              gameStatus: GameStatus.Decking,
            },
          ],
        ],
      })
    })
    it('returns resolved objects if none provided', async () => {
      const user1 = TestUtil.getUser({})
      const user2 = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      const leader = TestUtil.getLeader({
        faction,
      })
      const player1 = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({
            faction: faction.id,
            leader: leader.id,
            user: user1.id,
          }),
        }),
        user: user1.id,
      })
      const player2 = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({
            faction: faction.id,
            leader: leader.id,
            user: user1.id,
          }),
        }),
        user: user2.id,
      })
      await testResolveFromArray({
        gameStatus: GameStatus.Ordering,
        players: [player1, player2],
        resolvedUsers: [user1, user2],
        resolvedFactions: [faction],
        resolvedLeaders: [leader],
        resolvedGamePlayers: [
          TestUtil.getGamePlayer({
            user: user1,
          }),
          TestUtil.getGamePlayer({
            user: user2,
          }),
        ],
        userResolverCalls: [[[new ObjectId(user1.id), new ObjectId(user2.id)]]],
        factionResolverCalls: [
          [
            {
              ids: [new ObjectId(faction.id)],
            },
          ],
        ],
        leaderResolverCalls: [
          [
            {
              ids: [new ObjectId(leader.id)],
              resolvedFactions: [faction],
            },
          ],
        ],
        gamePlayerResolverCalls: [
          [
            {
              player: player1,
              users: [user1, user2],
              faction,
              leader,
              gameStatus: GameStatus.Ordering,
            },
          ],
          [
            {
              player: player2,
              users: [user1, user2],
              faction,
              leader,
              gameStatus: GameStatus.Ordering,
            },
          ],
        ],
      })
    })
    it('returns resolved objects if all provided', async () => {
      const user1 = TestUtil.getUser({})
      const user2 = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      const leader = TestUtil.getLeader({
        faction,
      })
      const player1 = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({
            faction: faction.id,
            leader: leader.id,
            user: user1.id,
          }),
        }),
        user: user1.id,
      })
      const player2 = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({
            faction: faction.id,
            leader: leader.id,
            user: user1.id,
          }),
        }),
        user: user2.id,
      })
      await testResolveFromArray({
        gameStatus: GameStatus.Ordering,
        players: [player1, player2],
        users: [user1, user2],
        resolvedFactions: [faction],
        resolvedLeaders: [leader],
        resolvedGamePlayers: [
          TestUtil.getGamePlayer({
            user: user1,
          }),
          TestUtil.getGamePlayer({
            user: user2,
          }),
        ],
        factionResolverCalls: [
          [
            {
              ids: [new ObjectId(faction.id)],
            },
          ],
        ],
        leaderResolverCalls: [
          [
            {
              ids: [new ObjectId(leader.id)],
              resolvedFactions: [faction],
            },
          ],
        ],
        gamePlayerResolverCalls: [
          [
            {
              player: player1,
              users: [user1, user2],
              faction,
              leader,
              gameStatus: GameStatus.Ordering,
            },
          ],
          [
            {
              player: player2,
              users: [user1, user2],
              faction,
              leader,
              gameStatus: GameStatus.Ordering,
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
  faction,
  leader,
  gameStatus,
  user,
  resolvedFaction,
  resolvedLeader,
  resolvedUsers,
  error,
  factionResolverCalls = [],
  leaderResolverCalls = [],
  userResolverCalls = [],
}: {
  player: GamePlayerDbObject
  users?: User[]
  faction?: Faction | undefined
  leader?: Leader | undefined
  gameStatus: GameStatus
  user?: User
  resolvedFaction?: Faction
  resolvedLeader?: Leader
  resolvedUsers?: User[]
  error?: string
  factionResolverCalls?: any[][]
  leaderResolverCalls?: any[][]
  userResolverCalls?: any[][]
}) {
  const factionResolverSpy = jest.spyOn(FactionResolver, 'fromId')
  if (resolvedFaction) {
    factionResolverSpy.mockResolvedValue(resolvedFaction)
  }
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'fromId')
  if (resolvedLeader) {
    leaderResolverSpy.mockResolvedValue(resolvedLeader)
  }
  const userResolverSpy = jest.spyOn(UserResolver, 'fromIds')
  if (resolvedUsers) {
    userResolverSpy.mockResolvedValue(resolvedUsers)
  }

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
      rounds: player.rounds,
      user,
    })
  }

  expect(factionResolverSpy.mock.calls).toEqual(factionResolverCalls)
  expect(leaderResolverSpy.mock.calls).toEqual(leaderResolverCalls)
  expect(userResolverSpy.mock.calls).toEqual(userResolverCalls)
}

async function testResolveFromArray({
  players,
  users,
  gameStatus,
  resolvedUsers = [],
  resolvedFactions = [],
  resolvedLeaders = [],
  resolvedGamePlayers = [],
  error,
  userResolverCalls = [],
  factionResolverCalls,
  leaderResolverCalls,
  gamePlayerResolverCalls = [],
}: {
  players: GamePlayerDbObject[]
  users?: User[]
  gameStatus: GameStatus
  resolvedUsers?: User[]
  resolvedFactions?: Faction[]
  resolvedLeaders?: Leader[]
  resolvedGamePlayers?: GamePlayer[]
  error?: string
  userResolverCalls?: any[][]
  factionResolverCalls?: any[][]
  leaderResolverCalls?: any[][]
  gamePlayerResolverCalls?: any[][]
}) {
  if (!factionResolverCalls) {
    factionResolverCalls = [
      [
        {
          ids: [],
        },
      ],
    ]
  }
  if (!leaderResolverCalls) {
    leaderResolverCalls = [
      [
        {
          ids: [],
          resolvedFactions,
        },
      ],
    ]
  }
  const userResolverSpy = jest.spyOn(UserResolver, 'fromIds').mockResolvedValue(resolvedUsers)
  const factionResolverSpy = jest.spyOn(FactionResolver, 'fromIds').mockResolvedValue(resolvedFactions)
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'fromIds').mockResolvedValue(resolvedLeaders)
  const gamePlayerResolveFromObjectSpy = jest.spyOn(GamePlayerResolver, 'fromObject')
  for (const resolvedGamePlayer of resolvedGamePlayers) {
    gamePlayerResolveFromObjectSpy.mockResolvedValueOnce(resolvedGamePlayer)
  }

  const promise = GamePlayerResolver.fromArray({
    gameStatus,
    players,
    users,
  })

  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual(resolvedGamePlayers)
  }

  expect(userResolverSpy.mock.calls).toEqual(userResolverCalls)
  expect(factionResolverSpy.mock.calls).toEqual(factionResolverCalls)
  expect(leaderResolverSpy.mock.calls).toEqual(leaderResolverCalls)
  expect(gamePlayerResolveFromObjectSpy.mock.calls).toEqual(gamePlayerResolverCalls)
}
