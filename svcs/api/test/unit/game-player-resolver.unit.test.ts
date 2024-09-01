import { Faction, FactionKey, Leader, User } from '@gwent/graphql-schema/resolver-typings'
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
      faction: everyoneReady ? resolvedFaction : undefined,
      leader: everyoneReady ? resolvedLeader : undefined,
      ready: player.ready,
      rounds: player.rounds,
      user: resolvedUser,
    })
  }

  expect(factionResolverSpy.mock.calls).toEqual(factionResolverCalls)
  expect(leaderResolverSpy.mock.calls).toEqual(leaderResolverCalls)
  expect(userresolverSpy.mock.calls).toEqual(userResolverCalls)
}
