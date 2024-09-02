import { Faction, FactionKey, GamePlayer, Leader, User } from '@gwent/graphql-schema/resolver-typings'
import FactionResolver from '../../src/graphql/resolvers/faction-resolver'
import LeaderResolver from '../../src/graphql/resolvers/leader-resolver'
import UserResolver from '../../src/graphql/resolvers/user-resolver'
import GamePlayerResolver from '../../src/graphql/resolvers/game-player-resolver'
import { DeckDbObject, GamePlayerDbObject } from '@gwent/graphql-schema/database-typings'
import { ObjectId } from 'mongodb'
import TestUtil from '../test-util'

describe('game-player-resolver', () => {
  describe('resolveFromObject', () => {
    it('throws error if faction unresolveable', async () => {
      const userId = new ObjectId()
      const factionId = new ObjectId()
      await testResolveFromObject({
        everyoneReady: true,
        player: {
          deck: {
            from: {
              faction: factionId,
            } as DeckDbObject,
            discard: [],
            hand: [],
            redraws: [],
            undrawn: [],
          },
          ready: true,
          rounds: [],
          user: userId,
        },
        error: `Could not resolve faction "${factionId}" for game player "${userId}".`,
        factionResolverCalls: [
          [
            {
              id: factionId,
              neutrals: undefined,
            },
          ],
        ],
      })
    })
    it('throws error if leader unresolveable', async () => {
      const userId = new ObjectId()
      const factionId = new ObjectId()
      const leaderId = new ObjectId()
      await testResolveFromObject({
        everyoneReady: true,
        player: {
          deck: {
            from: {
              faction: factionId,
              leader: leaderId,
            } as DeckDbObject,
            discard: [],
            hand: [],
            redraws: [],
            undrawn: [],
          },
          ready: true,
          rounds: [],
          user: userId,
        },
        faction: {
          created: new Date(),
          id: factionId.toString(),
          image: 'faction-image',
          key: FactionKey.Monsters,
          name: 'faction-name',
          stats: TestUtil.getStats(),
        },
        error: `Could not resolve leader "${leaderId}" for game player "${userId}".`,
        leaderResolverCalls: [
          [
            {
              id: leaderId,
              neutralStats: undefined,
            },
          ],
        ],
      })
    })
    it('throws error if user unresolveable', async () => {
      const userId = new ObjectId()
      await testResolveFromObject({
        everyoneReady: false,
        player: {
          deck: {
            discard: [],
            hand: [],
            redraws: [],
            undrawn: [],
          },
          ready: true,
          rounds: [],
          user: userId,
        },
        resolvedUser: undefined,
        error: `Could not resolve user "${userId}" as game player.`,
        userResolverCalls: [[userId]],
      })
    })
    it('returns without faction, leader or counts if everybody not ready', async () => {
      const user: User = {
        created: new Date(),
        id: new ObjectId().toString(),
        name: 'user-name',
      }
      const faction: Faction = {
        created: new Date(),
        id: new ObjectId().toString(),
        image: 'faction-image',
        key: FactionKey.Monsters,
        name: 'faction-name',
        stats: TestUtil.getStats(),
      }
      await testResolveFromObject({
        everyoneReady: false,
        player: {
          deck: {
            discard: [],
            hand: [],
            redraws: [],
            undrawn: [],
          },
          ready: true,
          rounds: [],
          user: new ObjectId(user.id),
        },
        faction,
        leader: {
          ability: 'leader-ability',
          created: new Date(),
          faction,
          id: new ObjectId().toString(),
          image: 'leader-image',
          name: 'leader-name',
          quote: 'leader-quote',
        },
        user,
      })
    })
    it('returns faction, leader and counts if everybody ready', async () => {
      const user: User = {
        created: new Date(),
        id: new ObjectId().toString(),
        name: 'user-name',
      }
      const faction: Faction = {
        created: new Date(),
        id: new ObjectId().toString(),
        image: 'faction-image',
        key: FactionKey.Monsters,
        name: 'faction-name',
        stats: TestUtil.getStats(),
      }
      await testResolveFromObject({
        everyoneReady: true,
        player: {
          deck: {
            discard: [],
            hand: [],
            redraws: [],
            undrawn: [],
          },
          ready: true,
          rounds: [],
          user: new ObjectId(user.id),
        },
        faction,
        leader: {
          ability: 'leader-ability',
          created: new Date(),
          faction,
          id: new ObjectId().toString(),
          image: 'leader-image',
          name: 'leader-name',
          quote: 'leader-quote',
        },
        user,
      })
    })
  })
  describe('resolveFromArray', () => {
    it('throws error if user not found', async () => {
      const userId = new ObjectId()
      await testResolveFromArray({
        everyoneReady: false,
        players: [
          {
            deck: {
              discard: [],
              hand: [],
              redraws: [],
              undrawn: [],
            },
            ready: false,
            rounds: [],
            user: userId,
          },
        ],
        resolvedUsers: [],
        error: `Could not resolve user "${userId}" as game player in array.`,
        userResolverCalls: [[[userId]]],
      })
    })
    it('throws error if faction not found', async () => {
      const user: User = {
        created: new ObjectId(),
        id: new ObjectId().toString(),
        name: 'user-name',
      }
      const factionId = new ObjectId()
      const leaderId = new ObjectId()
      await testResolveFromArray({
        everyoneReady: false,
        players: [
          {
            deck: {
              from: {
                _id: new ObjectId(),
                created: new Date(),
                faction: factionId,
                leader: leaderId,
                name: 'deck-name',
                stats: TestUtil.getStats(),
                units: [],
                user: new ObjectId(user.id),
              },
              discard: [],
              hand: [],
              redraws: [],
              undrawn: [],
            },
            ready: false,
            rounds: [],
            user: new ObjectId(user.id),
          },
        ],
        resolvedUsers: [user],
        resolvedFactions: [],
        error: `Could not resolve faction "${factionId}" for game player "${user.id}" in array.`,
        userResolverCalls: [[[new ObjectId(user.id)]]],
        factionResolverCalls: [
          [
            {
              ids: [factionId],
              neutralStats: undefined,
            },
          ],
        ],
        leaderResolverCalls: [
          [
            {
              ids: [leaderId],
              resolvedFactions: [],
              neutralStats: undefined,
            },
          ],
        ],
      })
    })
    it('throws error if leader not found', async () => {
      const user: User = {
        created: new ObjectId(),
        id: new ObjectId().toString(),
        name: 'user-name',
      }
      const faction: Faction = {
        created: new Date(),
        id: new ObjectId().toString(),
        image: 'faction-image',
        key: FactionKey.Monsters,
        name: 'faction-name',
        stats: TestUtil.getStats(),
      }
      const leaderId = new ObjectId()
      await testResolveFromArray({
        everyoneReady: false,
        players: [
          {
            deck: {
              from: {
                _id: new ObjectId(),
                created: new Date(),
                faction: new ObjectId(faction.id),
                leader: leaderId,
                name: 'deck-name',
                stats: TestUtil.getStats(),
                units: [],
                user: new ObjectId(user.id),
              },
              discard: [],
              hand: [],
              redraws: [],
              undrawn: [],
            },
            ready: false,
            rounds: [],
            user: new ObjectId(user.id),
          },
        ],
        resolvedUsers: [user],
        resolvedFactions: [faction],
        error: `Could not resolve leader "${leaderId}" for game player "${user.id}" in array.`,
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
              ids: [leaderId],
              resolvedFactions: [faction],
              neutralStats: undefined,
            },
          ],
        ],
      })
    })
    it('returns resolved objects if none provided', async () => {
      const user: User = {
        created: new ObjectId(),
        id: new ObjectId().toString(),
        name: 'user-name',
      }
      const faction: Faction = {
        created: new Date(),
        id: new ObjectId().toString(),
        image: 'faction-image',
        key: FactionKey.Monsters,
        name: 'faction-name',
        stats: TestUtil.getStats(),
      }
      const leader: Leader = {
        ability: 'leader-ability',
        created: new Date(),
        faction: faction,
        id: new ObjectId().toString(),
        image: 'leader-image',
        name: 'leader-name',
        quote: 'leader-quote',
      }
      const player: GamePlayerDbObject = {
        deck: {
          from: {
            _id: new ObjectId(),
            created: new Date(),
            faction: new ObjectId(faction.id),
            leader: new ObjectId(leader.id),
            name: 'deck-name',
            stats: TestUtil.getStats(),
            units: [],
            user: new ObjectId(user.id),
          },
          discard: [],
          hand: [],
          redraws: [],
          undrawn: [],
        },
        ready: false,
        rounds: [],
        user: new ObjectId(user.id),
      }
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
      const user: User = {
        created: new ObjectId(),
        id: new ObjectId().toString(),
        name: 'user-name',
      }
      const faction: Faction = {
        created: new Date(),
        id: new ObjectId().toString(),
        image: 'faction-image',
        key: FactionKey.Monsters,
        name: 'faction-name',
        stats: TestUtil.getStats(),
      }
      const leader: Leader = {
        ability: 'leader-ability',
        created: new Date(),
        faction: faction,
        id: new ObjectId().toString(),
        image: 'leader-image',
        name: 'leader-name',
        quote: 'leader-quote',
      }
      const player: GamePlayerDbObject = {
        deck: {
          from: {
            _id: new ObjectId(),
            created: new Date(),
            faction: new ObjectId(faction.id),
            leader: new ObjectId(leader.id),
            name: 'deck-name',
            stats: TestUtil.getStats(),
            units: [],
            user: new ObjectId(user.id),
          },
          discard: [],
          hand: [],
          redraws: [],
          undrawn: [],
        },
        ready: false,
        rounds: [],
        user: new ObjectId(user.id),
      }
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
  const factionResolverSpy = jest.spyOn(FactionResolver, 'resolveFromId').mockResolvedValue(resolvedFaction)
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'resolveFromId').mockResolvedValue(resolvedLeader)
  const userresolverSpy = jest.spyOn(UserResolver, 'resolveById').mockResolvedValue(resolvedUser)

  // TODO: change all other tests to create promise
  // for resolve/reject to avoid duplicate code
  const promise = GamePlayerResolver.resolveFromObject({
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
  expect(userresolverSpy.mock.calls).toEqual(userResolverCalls)
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
  const userResolverSpy = jest.spyOn(UserResolver, 'resolveByIds').mockResolvedValue(resolvedUsers)
  const factionResolverSpy = jest.spyOn(FactionResolver, 'resolveFromIds').mockResolvedValue(resolvedFactions)
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'resolveFromIds').mockResolvedValue(resolvedLeaders)
  const gamePlayerResolveFromObjectSpy = jest.spyOn(GamePlayerResolver, 'resolveFromObject')
  for (const resolvedGamePlayer of resolvedGamePlayers) {
    gamePlayerResolveFromObjectSpy.mockResolvedValueOnce(resolvedGamePlayer)
  }

  const promise = GamePlayerResolver.resolveFromArray({
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
