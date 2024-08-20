import { ObjectId } from 'mongodb'

import AppInfo from '../../src/app-info'
import DeckStore from '../../src/database/stores/deck-store'
import * as env from '../../src/env'
import {
  Faction,
  FactionKey,
  Game,
  GameDeck,
  GameStatus,
  Leader,
  SettingKey,
  SettingType,
  User,
} from '@gwent/graphql-schema/resolver-typings'
import FactionStore from '../../src/database/stores/faction-store'
import LeaderStore from '../../src/database/stores/leader-store'
import QueryResolver from '../../src/graphql/resolvers/query-resolver'
import UnitStore from '../../src/database/stores/unit-store'
import { version } from '../../package.json'
import UnitResolver from '../../src/graphql/resolvers/unit-resolver'
import {
  DeckDbObject,
  FactionDbObject,
  GameDbObject,
  GameDeckDbObject,
  LeaderDbObject,
  UnitDbObject,
  UnitStats,
} from '@gwent/graphql-schema/database-typings'
import LeaderResolver from '../../src/graphql/resolvers/leader-resolver'
import UserResolver from '../../src/graphql/resolvers/user-resolver'
import FactionResolver from '../../src/graphql/resolvers/faction-resolver'
import DeckResolver from '../../src/graphql/resolvers/deck-resolver'
import GameResolver from '../../src/graphql/resolvers/game-resolver'
import { MAX_ROUNDS } from '@gwent/constants'
import GameStore from '../../src/database/stores/game-store'
import GameDeckResolver from '../../src/graphql/resolvers/game-deck-resolver'

describe('query-resolver', () => {
  describe('application', () => {
    it('calls out to AppInfo to get build number', async () => {
      const build = 3
      const getBuildNumberSpy = jest.spyOn(AppInfo, 'getBuildNumber').mockResolvedValue(build)

      await expect((QueryResolver.application as any)()).resolves.toEqual({
        build,
        version,
      })

      expect(getBuildNumberSpy.mock.calls).toEqual([[]])
    })
  })
  describe('currentUser', () => {
    it('throws error if context undefined', () => {
      testCurrentUser({
        context: undefined,
        error: 'No user on session',
      })
    })
    it('throws error if session undefined', () => {
      testCurrentUser({
        context: {},
        error: 'No user on session',
      })
    })
    it('throws error if user undefined', () => {
      testCurrentUser({
        context: {
          session: {},
        },
        error: 'No user on session',
      })
    })
    it('returns user if defined on session', () => {
      const userId = new ObjectId()
      const created = new Date()
      const name = 'user-name'
      testCurrentUser({
        context: {
          session: {
            user: {
              _id: userId,
              created,
              name,
            },
          },
        },
        userResolverResponse: {
          created,
          id: userId.toString(),
          name,
        },
        userResolverCalls: [
          [
            {
              created,
              _id: userId,
              name,
            },
          ],
        ],
      })
    })
  })
  describe('decks', () => {
    it('reaches out to DeckStore with user on session', async () => {
      const context = {
        session: {
          user: {
            _id: new ObjectId(),
          },
        },
      }
      const deck: DeckDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        faction: new ObjectId(),
        leader: new ObjectId(),
        name: 'deck-name',
        stats: {} as any,
        units: [],
        user: new ObjectId(),
      }
      const getSpy = jest.spyOn(DeckStore, 'get').mockResolvedValue([deck])
      const deckResolverSpy = jest.spyOn(DeckResolver, 'resolveFromArray').mockResolvedValue([])

      await expect((QueryResolver.decks as any)(null, null, context, null)).resolves.toEqual([])

      expect(getSpy.mock.calls).toEqual([[context.session.user._id]])
      expect(deckResolverSpy.mock.calls).toEqual([
        [
          {
            decks: [deck],
            neutralDeckStats: undefined,
            neutralLeaderStats: undefined,
            neutralUnitStats: undefined,
          },
        ],
      ])
    })
  })
  describe('factions', () => {
    it('reaches out to FactionStore', async () => {
      const faction: FactionDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        image: 'faction-image',
        key: FactionKey.NorthernRealms,
        name: 'faction-name',
        stats: {} as any,
      }
      const resolvedFaction: Faction = {
        created: faction.created,
        id: faction._id.toString(),
        image: faction.image,
        key: FactionKey.NorthernRealms,
        name: faction.name,
        stats: faction.stats,
      }
      const getSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([faction])
      const factionResolverSpy = jest.spyOn(FactionResolver, 'resolveFromArray').mockResolvedValue([resolvedFaction])

      await expect((QueryResolver.factions as any)(null, null, null, null)).resolves.toEqual([resolvedFaction])

      expect(getSpy.mock.calls).toEqual([[{}]])
      expect(factionResolverSpy.mock.calls).toEqual([
        [
          {
            factions: [faction],
            neutrals: undefined,
          },
        ],
      ])
    })
  })
  describe('game', () => {
    it('throws error if game cannot be resolved', async () => {
      const gameId = new ObjectId().toString()
      const resolveByIdSpy = jest.spyOn(GameResolver, 'resolveById').mockResolvedValue(undefined)

      await expect(
        (QueryResolver.game as any)(
          null,
          {
            id: gameId,
          },
          null,
          null
        )
      ).rejects.toThrow(Error('Game does not exist'))

      expect(resolveByIdSpy.mock.calls).toEqual([[gameId]])
    })
    it('returns resolved game if found', async () => {
      const gameId = new ObjectId().toString()
      const game: Game = {
        created: new Date(),
        creator: {
          created: new Date(),
          id: new ObjectId().toString(),
          name: 'user-name',
        },
        id: new ObjectId().toString(),
        players: [],
        round: {
          current: 0,
          maximum: MAX_ROUNDS,
        },
        status: GameStatus.Decking,
        updated: new Date(),
        victors: [],
      }
      const resolveByIdSpy = jest.spyOn(GameResolver, 'resolveById').mockResolvedValue(game)

      await expect(
        (QueryResolver.game as any)(
          null,
          {
            id: gameId,
          },
          null,
          null
        )
      ).resolves.toEqual(game)

      expect(resolveByIdSpy.mock.calls).toEqual([[gameId]])
    })
  })
  describe('gameDeck', () => {
    it('throws error if game does not exist', async () => {
      const gameId = new ObjectId().toString()
      await testGameDeck({
        gameId,
        gameResponse: undefined,
        error: `Game with ID "${gameId}" does not exist`,
      })
    })
    it('throws error if user is not a player', async () => {
      const userId = new ObjectId()
      const gameId = new ObjectId()
      await testGameDeck({
        userId: userId,
        gameId: gameId.toString(),
        gameResponse: {
          _id: gameId,
          created: new Date(),
          creator: new ObjectId(),
          players: [],
          round: {
            current: 0,
            maximum: MAX_ROUNDS,
          },
          updated: new Date(),
          victors: [],
        },
        error: `Not a player for game with ID "${gameId}"`,
      })
    })
    it('returns undefined if player deck not set', async () => {
      const userId = new ObjectId()
      const gameId = new ObjectId()
      await testGameDeck({
        userId: userId,
        gameId: gameId.toString(),
        gameResponse: {
          _id: gameId,
          created: new Date(),
          creator: userId,
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
          round: {
            current: 0,
            maximum: MAX_ROUNDS,
          },
          updated: new Date(),
          victors: [],
        },
        expected: null,
      })
    })
    it('returns game deck if player deck is set', async () => {
      const userId = new ObjectId()
      const gameId = new ObjectId()
      const deck: DeckDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        faction: new ObjectId(),
        leader: new ObjectId(),
        name: 'deck-name',
        stats: {} as UnitStats,
        units: [],
        user: userId,
      }
      const playerDeck: GameDeckDbObject = {
        discard: [],
        hand: [],
        redraws: [],
        undrawn: [],
        from: deck,
      }
      const gameDeck: GameDeck = {
        discard: [],
        hand: [],
        redraws: [],
        undrawn: [],
        from: {
          created: deck.created,
          faction: {
            id: deck.faction.toString(),
          } as Faction,
          id: deck._id.toString(),
          leader: {
            id: deck.leader.toString(),
          } as Leader,
          name: deck.name,
          stats: deck.stats,
          units: [],
          user: {
            created: new Date(),
            id: userId.toString(),
            name: 'user-name',
          },
        },
      }
      await testGameDeck({
        userId: userId,
        gameId: gameId.toString(),
        gameResponse: {
          _id: gameId,
          created: new Date(),
          creator: userId,
          players: [
            {
              deck: playerDeck,
              ready: false,
              rounds: [],
              user: userId,
            },
          ],
          round: {
            current: 0,
            maximum: MAX_ROUNDS,
          },
          updated: new Date(),
          victors: [],
        },
        expected: gameDeck,
        gameDeckResolverCalls: [
          [
            {
              gameDeck: playerDeck,
              neutralDeckStats: undefined,
              neutralLeaderStats: undefined,
              neutralUnitStats: undefined,
            },
          ],
        ],
      })
    })
  })
  describe('games', () => {
    it('calls out to GameResolver resolveFromArray', async () => {
      const userId = new ObjectId()
      const context = {
        session: {
          user: {
            _id: userId,
          },
        },
      }
      const getByUserIdSpy = jest.spyOn(GameStore, 'getByUserId').mockResolvedValue([])
      const resolveFromArraySpy = jest.spyOn(GameResolver, 'resolveFromArray').mockResolvedValue([])

      await expect((QueryResolver.games as any)(null, null, context, null))

      expect(getByUserIdSpy.mock.calls).toEqual([[userId]])
      expect(resolveFromArraySpy.mock.calls).toEqual([[[]]])
    })
  })
  describe('leaders', () => {
    it('does not reach out to FactionStore if no factions in args', async () => {
      await testLeaders({
        leaderGetCalls: [
          [
            {
              factionIds: undefined,
            },
          ],
        ],
      })
    })
    it('reaches out to get faction ids if single faction in args', async () => {
      const factionKey = FactionKey.Monsters
      const factionId = new ObjectId()
      await testLeaders({
        factionKeys: [factionKey],
        factionGetCalls: [
          [
            {
              keys: [factionKey],
            },
          ],
        ],
        factionGetResponse: [
          {
            _id: factionId,
            created: new Date(),
            image: 'faction-image',
            key: factionKey,
            name: 'faction-name',
            stats: {} as any,
          },
        ],
        leaderGetCalls: [
          [
            {
              factionIds: [factionId.toString()],
            },
          ],
        ],
      })
    })
  })
  describe('settings', () => {
    it('returns settings with values from env', () => {
      const sessionTimeout = 30
      jest.spyOn(env, 'default').mockReturnValue({
        SESSION_TIMEOUT_SECONDS: sessionTimeout,
      } as any)

      expect((QueryResolver.settings as any)()).toEqual([
        {
          key: SettingKey.SessionTimeoutSeconds,
          type: SettingType.Number,
          label: 'Session Timeout (seconds)',
          value: sessionTimeout.toString(),
        },
      ])
    })
  })
  describe('units', () => {
    it('does not call out to FactionStore if no factions in args', async () => {
      await testUnits({
        factionKeys: undefined,
        factionGetCalls: [],
        factionGetResponse: undefined,
        unitGetCalls: [
          [
            {
              deckable: undefined,
              factionIds: undefined,
            },
          ],
        ],
      })
    })
    it('calls out to FactionStore if factions in args', async () => {
      const factionKey = FactionKey.Monsters
      const factionId = new ObjectId()
      await testUnits({
        factionKeys: [factionKey],
        factionGetCalls: [
          [
            {
              keys: [factionKey],
            },
          ],
        ],
        factionGetResponse: [
          {
            _id: factionId,
            created: new Date(),
            image: 'faction-image',
            key: factionKey,
            name: 'faction-name',
            stats: {} as any,
          },
        ],
        unitGetCalls: [
          [
            {
              deckable: undefined,
              factionIds: [factionId.toString()],
            },
          ],
        ],
      })
    })
    it('passes deckable false to UnitStore if explicitly defined in args', async () => {
      await testUnits({
        deckable: false,
        unitGetCalls: [
          [
            {
              deckable: false,
              factionIds: undefined,
            },
          ],
        ],
      })
    })
    it('passes deckable true to UnitStore if explicitly defined in args', async () => {
      await testUnits({
        deckable: true,
        unitGetCalls: [
          [
            {
              deckable: true,
              factionIds: undefined,
            },
          ],
        ],
      })
    })
  })
})

function testCurrentUser({
  context,
  error,
  userResolverResponse,
  userResolverCalls = [],
}: {
  context: any
  error?: string
  userResolverResponse?: User
  userResolverCalls?: any[][]
}) {
  const userResolverSpy = jest.spyOn(UserResolver, 'resolveByObject')
  if (userResolverResponse) {
    userResolverSpy.mockReturnValue(userResolverResponse)
  }

  if (error) {
    expect(() => (QueryResolver.currentUser as any)(null, null, context, null)).toThrow(Error(error))
  } else {
    expect((QueryResolver.currentUser as any)(null, null, context, null)).toEqual(userResolverResponse)
  }

  expect(userResolverSpy.mock.calls).toEqual(userResolverCalls)
}

async function testGameDeck({
  userId,
  gameId,
  gameResponse,
  error,
  expected,
  gameDeckResolverCalls = [],
}: {
  userId?: ObjectId
  gameId?: string
  gameResponse?: GameDbObject
  error?: string
  expected?: GameDeck | null
  gameDeckResolverCalls?: any[][]
}) {
  const context = {
    session: {
      user: {
        _id: userId,
      },
    },
  }
  const args = {
    game: gameId,
  }
  const getByIdSpy = jest.spyOn(GameStore, 'getById').mockResolvedValue(gameResponse)
  const resolveFromObjectSpy = jest
    .spyOn(GameDeckResolver, 'resolveFromObject')
    .mockResolvedValue(expected as any as GameDeck)

  if (error) {
    await expect((QueryResolver.gameDeck as any)(null, args, context, null)).rejects.toThrow(error)
  } else {
    await expect((QueryResolver.gameDeck as any)(null, args, context, null)).resolves.toEqual(expected)
  }

  expect(getByIdSpy.mock.calls).toEqual([
    [
      {
        id: gameId,
      },
    ],
  ])
  expect(resolveFromObjectSpy.mock.calls).toEqual(gameDeckResolverCalls)
}

async function testLeaders({
  factionKeys,
  factionGetResponse,
  factionGetCalls = [],
  leaderGetCalls,
}: {
  factionKeys?: FactionKey[]
  factionGetResponse?: FactionDbObject[]
  factionGetCalls?: any[][]
  leaderGetCalls: any[][]
}) {
  const args = {
    factions: factionKeys,
  }
  const leaders: LeaderDbObject[] = [
    {
      _id: new ObjectId(),
      ability: 'leader-ability',
      created: new Date(),
      faction: new ObjectId(),
      image: 'leader-image',
      name: 'leader-name',
      quote: 'leader-quote',
    },
  ]
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(factionGetResponse || [])
  const leaderGetSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue(leaders)
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'resolveFromArray').mockResolvedValue([])

  await expect((QueryResolver.leaders as any)(null, args, null, null)).resolves.toEqual([])

  expect(factionGetSpy.mock.calls).toEqual(factionGetCalls)
  expect(leaderGetSpy.mock.calls).toEqual(leaderGetCalls)
  expect(leaderResolverSpy.mock.calls).toEqual([
    [
      {
        factions: factionGetResponse,
        leaders,
        neutralStats: undefined,
      },
    ],
  ])
}

async function testUnits({
  factionKeys,
  deckable,
  factionGetResponse,
  factionGetCalls = [],
  unitGetCalls,
}: {
  factionKeys?: FactionKey[]
  deckable?: boolean
  factionGetResponse?: FactionDbObject[]
  factionGetCalls?: any[][]
  unitGetCalls: any[][]
}) {
  const args = {
    factions: factionKeys,
    deckable,
  }
  const units: UnitDbObject[] = [
    {
      _id: new ObjectId(),
      created: new Date(),
      deckable: true,
      faction: factionGetResponse ? factionGetResponse[0]._id : new ObjectId(),
      images: ['unit-image'],
      name: 'unit-name',
      quote: 'unit-quote',
    },
  ]
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(factionGetResponse || [])
  const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue(units)
  const unitResolverSpy = jest.spyOn(UnitResolver, 'resolveFromArray').mockResolvedValue([])

  await expect((QueryResolver.units as any)(null, args, null, null)).resolves.toEqual([])

  expect(factionGetSpy.mock.calls).toEqual(factionGetCalls)
  expect(unitGetSpy.mock.calls).toEqual(unitGetCalls)
  expect(unitResolverSpy.mock.calls).toEqual([
    [
      {
        factions: factionGetResponse,
        units,
        neutralStats: undefined,
      },
    ],
  ])
}
