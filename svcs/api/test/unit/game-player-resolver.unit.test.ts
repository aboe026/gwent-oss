import { ObjectId } from 'mongodb'

import { Faction, GamePlayer, Leader, User } from '@gwent/graphql-schema/resolver-typings'
import FactionResolver from '../../src/graphql/resolvers/types/faction-resolver'
import { GamePlayerDbObject } from '@gwent/graphql-schema/database-typings'
import GamePlayerResolver from '../../src/graphql/resolvers/types/game-player-resolver'
import LeaderResolver from '../../src/graphql/resolvers/types/leader-resolver'
import TestUtil from '../test-util'
import UserResolver from '../../src/graphql/resolvers/types/user-resolver'

describe('game-player-resolver', () => {
  describe('fromObject', () => {
    it('returns without faction, leader or counts if not all decks chosen', async () => {
      const user = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      await testResolveFromObject({
        allDecksChosen: false,
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
    it('returns faction, leader and counts if all decks chosen', async () => {
      const user = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      await testResolveFromObject({
        allDecksChosen: true,
        player: TestUtil.getDbGamePlayer({
          ready: true,
          user: user.id,
          order: 1,
        }),
        faction,
        leader: TestUtil.getLeader({
          faction,
        }),
        user,
      })
    })
    it('reaches out to resolvers if all decks chosen but nothing provided', async () => {
      const user = TestUtil.getUser({})
      const faction = TestUtil.getFaction({})
      const leader = TestUtil.getLeader({})
      await testResolveFromObject({
        allDecksChosen: true,
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
        allDecksChosen: false,
        players: [player],
        resolvedUsers: [user],
        resolvedFactions: [faction],
        resolvedLeaders: [leader],
        resolvedGamePlayers: [
          TestUtil.getGamePlayer({
            user,
          }),
        ],
        userResolverCalls: [[[new ObjectId(user.id)]]],
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
              player,
              user,
              faction,
              leader,
              neutralFactionStats: undefined,
              neutralLeaderStats: undefined,
              allDecksChosen: false,
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
        allDecksChosen: false,
        players: [player],
        users: [user],
        resolvedFactions: [faction],
        resolvedLeaders: [leader],
        resolvedGamePlayers: [
          TestUtil.getGamePlayer({
            user,
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
              player,
              user,
              faction,
              leader,
              neutralFactionStats: undefined,
              neutralLeaderStats: undefined,
              allDecksChosen: false,
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
  allDecksChosen,
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
  allDecksChosen: boolean
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

  const promise = GamePlayerResolver.fromObject({
    allDecksChosen,
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
      counts: allDecksChosen
        ? {
            discard: player.deck.discard.length,
            hand: player.deck.hand.length,
            undrawn: player.deck.undrawn.length,
          }
        : undefined,
      faction: allDecksChosen ? faction || resolvedFaction : undefined,
      leader: allDecksChosen ? leader || resolvedLeader : undefined,
      order: player.order,
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
  allDecksChosen,
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
  allDecksChosen: boolean
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
    allDecksChosen,
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
