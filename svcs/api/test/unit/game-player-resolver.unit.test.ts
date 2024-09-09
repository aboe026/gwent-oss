import { Faction, GamePlayer, Leader, User } from '@gwent/graphql-schema/resolver-typings'
import FactionResolver from '../../src/graphql/resolvers/faction-resolver'
import LeaderResolver from '../../src/graphql/resolvers/leader-resolver'
import UserResolver from '../../src/graphql/resolvers/user-resolver'
import GamePlayerResolver from '../../src/graphql/resolvers/game-player-resolver'
import { GamePlayerDbObject } from '@gwent/graphql-schema/database-typings'
import { ObjectId } from 'mongodb'
import TestUtil from '../test-util'

describe('game-player-resolver', () => {
  describe('fromObject', () => {
    it('returns without faction, leader or counts if everybody not ready', async () => {
      const user = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      await testResolveFromObject({
        everyoneReady: false,
        player: TestUtil.getDbGamePlayer({
          ready: true,
          user: user.id,
        }),
        faction,
        leader: TestUtil.getLeader({
          faction,
        }),
        user,
      })
    })
    it('returns faction, leader and counts if everybody ready', async () => {
      const user = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      await testResolveFromObject({
        everyoneReady: true,
        player: TestUtil.getDbGamePlayer({
          ready: true,
          user: user.id,
        }),
        faction,
        leader: TestUtil.getLeader({
          faction,
        }),
        user,
      })
    })
    it('reaches out to resolvers if everybody ready but nothing provided', async () => {
      const user = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      const leader = TestUtil.getLeader({})
      await testResolveFromObject({
        everyoneReady: true,
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
        resolvedFaction: faction,
        resolvedLeader: leader,
        resolvedUser: user,
        factionResolverCalls: [
          [
            {
              id: new ObjectId(faction.id),
              neutrals: undefined,
            },
          ],
        ],
        leaderResolverCalls: [
          [
            {
              id: new ObjectId(leader.id),
              neutralStats: undefined,
            },
          ],
        ],
        userResolverCalls: [[new ObjectId(user.id)]],
      })
    })
  })
  describe('fromArray', () => {
    it('returns resolved objects if none provided', async () => {
      const user = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      const leader = TestUtil.getLeader({
        faction,
      })
      const player = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({
            faction: faction.id,
            leader: leader.id,
            user: user.id,
          }),
        }),
        user: user.id,
      })
      await testResolveFromArray({
        everyoneReady: false,
        players: [player],
        resolvedUsers: [user],
        resolvedFactions: [faction],
        resolvedLeaders: [leader],
        resolvedGamePlayers: [
          {
            ready: false,
            rounds: [],
            user,
          },
        ],
        userResolverCalls: [[[new ObjectId(user.id)]]],
        factionResolverCalls: [
          [
            {
              ids: [new ObjectId(faction.id)],
              neutralStats: undefined,
            },
          ],
        ],
        leaderResolverCalls: [
          [
            {
              ids: [new ObjectId(leader.id)],
              resolvedFactions: [faction],
              neutralStats: undefined,
            },
          ],
        ],
        gamePlayerResolverCalls: [
          [
            {
              player,
              user,
              faction,
              leader,
              neutralFactionStats: undefined,
              neutralLeaderStats: undefined,
              everyoneReady: false,
            },
          ],
        ],
      })
    })
    it('returns resolved objects if all provided', async () => {
      const user = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      const leader = TestUtil.getLeader({
        faction,
      })
      const player = TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: TestUtil.getDbDeck({
            faction: faction.id,
            leader: leader.id,
            user: user.id,
          }),
        }),
        user: user.id,
      })
      await testResolveFromArray({
        everyoneReady: false,
        players: [player],
        users: [user],
        resolvedFactions: [faction],
        resolvedLeaders: [leader],
        resolvedGamePlayers: [
          {
            ready: false,
            rounds: [],
            user,
          },
        ],
        factionResolverCalls: [
          [
            {
              ids: [new ObjectId(faction.id)],
              neutralStats: undefined,
            },
          ],
        ],
        leaderResolverCalls: [
          [
            {
              ids: [new ObjectId(leader.id)],
              resolvedFactions: [faction],
              neutralStats: undefined,
            },
          ],
        ],
        gamePlayerResolverCalls: [
          [
            {
              player,
              user,
              faction,
              leader,
              neutralFactionStats: undefined,
              neutralLeaderStats: undefined,
              everyoneReady: false,
            },
          ],
        ],
      })
    })
  })
})

async function testResolveFromObject({
  player,
  user,
  faction,
  leader,
  neutralFactionStats,
  neutralLeaderStats,
  everyoneReady,
  resolvedFaction,
  resolvedLeader,
  resolvedUser,
  error,
  factionResolverCalls = [],
  leaderResolverCalls = [],
  userResolverCalls = [],
}: {
  player: GamePlayerDbObject
  user?: User
  faction?: Faction | undefined
  leader?: Leader | undefined
  neutralFactionStats?: boolean
  neutralLeaderStats?: boolean
  everyoneReady: boolean
  resolvedFaction?: Faction
  resolvedLeader?: Leader
  resolvedUser?: User
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
  const userResolverSpy = jest.spyOn(UserResolver, 'fromId')
  if (resolvedUser) {
    userResolverSpy.mockResolvedValue(resolvedUser)
  }

  // TODO: change all other tests to create promise
  // for resolve/reject to avoid duplicate code
  const promise = GamePlayerResolver.fromObject({
    everyoneReady,
    player,
    faction,
    leader,
    neutralFactionStats,
    neutralLeaderStats,
    user,
  })

  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual({
      counts: everyoneReady
        ? {
            discard: player.deck.discard.length,
            hand: player.deck.hand.length,
            undrawn: player.deck.undrawn.length,
          }
        : undefined,
      faction: everyoneReady ? faction || resolvedFaction : undefined,
      leader: everyoneReady ? leader || resolvedLeader : undefined,
      ready: player.ready,
      rounds: player.rounds,
      user: user || resolvedUser,
    })
  }

  expect(factionResolverSpy.mock.calls).toEqual(factionResolverCalls)
  expect(leaderResolverSpy.mock.calls).toEqual(leaderResolverCalls)
  expect(userResolverSpy.mock.calls).toEqual(userResolverCalls)
}

async function testResolveFromArray({
  players,
  users,
  everyoneReady,
  neutralFactionStats,
  neutralLeaderStats,
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
  everyoneReady: boolean
  neutralFactionStats?: boolean
  neutralLeaderStats?: boolean
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
          neutralStats: neutralFactionStats,
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
          neutralStats: neutralLeaderStats,
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
    everyoneReady,
    players,
    neutralFactionStats,
    neutralLeaderStats,
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
