import { ObjectId } from 'mongodb'

import {
  DeckDbObject,
  FactionDbObject,
  GameDbObject,
  LeaderDbObject,
  UnitDbObject,
  UserDbObject,
} from '@gwent/graphql-schema/database-typings'
import DeckStore from '../../src/database/stores/deck-store'
import {
  Deck,
  DeckUnit,
  Faction,
  FactionKey,
  Game,
  GameStatus,
  Leader,
  User,
} from '@gwent/graphql-schema/resolver-typings'
import FactionStore from '../../src/database/stores/faction-store'
import * as gwentUtils from '@gwent/utils'
import LeaderStore from '../../src/database/stores/leader-store'
import MutationResolver from '../../src/graphql/resolvers/mutation-resolver'
import UnitStore from '../../src/database/stores/unit-store'
import UserStore from '../../src/database/stores/user-store'
import * as validateDeck from '@gwent/validators'
import DeckUnitResolver from '../../src/graphql/resolvers/deck-unit-resolver'
import FactionResolver from '../../src/graphql/resolvers/faction-resolver'
import LeaderResolver from '../../src/graphql/resolvers/leader-resolver'
import DeckResolver from '../../src/graphql/resolvers/deck-resolver'
import GameStore from '../../src/database/stores/game-store'
import { MAX_ROUNDS, PLAYER_COUNTS } from '@gwent/constants'
import GameResolver from '../../src/graphql/resolvers/game-resolver'

describe('mutation-resolver', () => {
  describe('addDeck', () => {
    it('returns error if faction is neutral', async () => {
      await testAddDeck({
        factionKey: FactionKey.Neutral,
        errorReturned: `Cannot create Deck with "${FactionKey.Neutral}" faction.`,
        factionGetCalls: [],
        leaderGetCalls: [],
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
      })
    })
    it('returns error if faction with key does not exist', async () => {
      await testAddDeck({
        factionGetResponse: [],
        errorReturned: `Faction with key "${FactionKey.Monsters}" not found.`,
        leaderGetCalls: [],
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
      })
    })
    it('returns error if leader does not exist', async () => {
      const leaderId = new ObjectId()
      await testAddDeck({
        leaderId,
        leaderGetResponse: [],
        errorReturned: `Invalid leader ID "${leaderId}": Does not exist.`,
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
      })
    })
    it('returns error if leader is of wrong faction', async () => {
      const factionId = new ObjectId()
      const leaderId = new ObjectId()
      await testAddDeck({
        factionKey: FactionKey.Monsters,
        factionGetResponse: [
          {
            _id: new ObjectId(),
            created: new Date(),
            image: 'faction-1-image',
            key: FactionKey.Monsters,
            name: 'faction-1-name',
            stats: {} as any,
          },
          {
            _id: factionId,
            created: new Date(),
            image: 'faction-2-image',
            key: FactionKey.NorthernRealms,
            name: 'faction-2-name',
            stats: {} as any,
          },
        ],
        leaderId,
        leaderGetResponse: [
          {
            _id: leaderId,
            ability: 'leader-ability',
            created: new Date(),
            faction: factionId,
            image: 'leader-image',
            name: 'leader-name',
            quote: 'leader-quote',
          },
        ],
        errorReturned: `Invalid leader ID "${leaderId}": Faction "${FactionKey.NorthernRealms}" does not match deck faction of "${FactionKey.Monsters}".`,
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
      })
    })
    it('returns error if single unit does not exist', async () => {
      const unitId = new ObjectId()
      await testAddDeck({
        unitIds: [unitId],
        unitGetResponse: [],
        errorReturned: `Invalid unit ID "${unitId}": Does not exist.`,
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
      })
    })
    it('returns errors if multiple units do not exist', async () => {
      const unitId1 = new ObjectId()
      const unitId2 = new ObjectId()
      await testAddDeck({
        unitIds: [unitId1, unitId2],
        unitGetResponse: [],
        errorReturned: [
          `Invalid unit ID "${unitId1}": Does not exist.`,
          `Invalid unit ID "${unitId2}": Does not exist.`,
        ].join('\n'),
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
      })
    })
    it('returns error if validateDeck returns single error', async () => {
      const error = 'too many specials'
      await testAddDeck({
        validateDeckResponse: [error],
        errorReturned: error,
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
      })
    })
    it('returns errors if validateDeck returns multiple errors', async () => {
      const error1 = 'too many specials'
      const error2 = 'not enough units'
      await testAddDeck({
        validateDeckResponse: [error1, error2],
        errorReturned: `${error1}\n${error2}`,
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
      })
    })
    it('returns error if deck with name already exists', async () => {
      const name = 'deck-name'
      const userId = new ObjectId()
      const error = `Deck with name "${name}" already exists for user "${userId}"`
      await testAddDeck({
        userId,
        name,
        deckAddError: error,
        errorReturned: `Deck with name "${name}" already exists`,
        postResolversCalled: false,
      })
    })
    it('throws error if addDeck throws error that is not duplicate name', async () => {
      const error = 'network error'
      await testAddDeck({
        deckAddError: error,
        errorThrown: error,
        postResolversCalled: false,
      })
    })
    it('undefined artstyle converted to 1', async () => {
      await testAddDeck({
        inputArtStyle: undefined,
        expectedArtStyle: 1,
      })
    })
    it('null artstyle converted to 1', async () => {
      await testAddDeck({
        inputArtStyle: null,
        expectedArtStyle: 1,
      })
    })
    it('explicit artStyle of 1', async () => {
      await testAddDeck({
        inputArtStyle: 1,
        expectedArtStyle: 1,
      })
    })
    it('explicit artStyle of 2', async () => {
      await testAddDeck({
        inputArtStyle: 2,
        expectedArtStyle: 2,
      })
    })
  })
  describe('addGame', () => {
    it('returns error if not enough opponents', async () => {
      await testAddGame({
        opponentNames: [],
        expected: Error(`Not enough opponents for game at "0", minimum is "${PLAYER_COUNTS.Min - 1}".`),
      })
    })
    it('returns error if too many opponents', async () => {
      await testAddGame({
        opponentNames: ['one', 'two'],
        expected: Error(`Excessive number of opponents for game at "2", maximum is "${PLAYER_COUNTS.Min - 1}".`),
      })
    })
  })
  describe('addUser', () => {
    it('returns error if user already exists', async () => {
      const args = {
        name: 'james.bond@mi6.com',
        password: 'secret',
      }
      const error = Error(`User "${args.name}" already exists`)
      const addSpy = jest.spyOn(UserStore, 'add').mockRejectedValue(error)

      await expect((MutationResolver.addUser as any)(null, args, null, null)).resolves.toEqual(error)

      expect(addSpy.mock.calls).toEqual([[args.name, args.password]])
    })
    it('throws error if not about user already existing', async () => {
      const args = {
        name: 'james.bond@mi6.com',
        password: 'secret',
      }
      const error = Error('Connection refused')
      const addSpy = jest.spyOn(UserStore, 'add').mockRejectedValue(error)

      await expect((MutationResolver.addUser as any)(null, args, null, null)).rejects.toThrow(error)

      expect(addSpy.mock.calls).toEqual([[args.name, args.password]])
    })
    it('returns user if no error', async () => {
      const args = {
        name: 'james.bond@mi6.com',
        password: 'secret',
      }
      const user: UserDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        name: args.name,
        password: '',
      }
      const addSpy = jest.spyOn(UserStore, 'add').mockResolvedValue(user)

      await expect((MutationResolver.addUser as any)(null, args, null, null)).resolves.toEqual({
        id: user._id.toString(),
        created: user.created,
        name: user.name,
      })

      expect(addSpy.mock.calls).toEqual([[args.name, args.password]])
    })
  })
  describe('login', () => {
    it('returns error if credentials invalid', async () => {
      const args = {
        name: 'james.bond@mi6.com',
        password: 'secret',
      }
      const context = undefined
      const error = Error(`Invalid credentials for user "${args.name}"`)
      const validateSpy = jest.spyOn(UserStore, 'validate').mockRejectedValue(error)

      await expect((MutationResolver.login as any)(null, args, context, null)).resolves.toEqual(error)

      expect(validateSpy.mock.calls).toEqual([[args.name, args.password]])
    })
    it('throws error if not invalid credentials', async () => {
      const args = {
        name: 'james.bond@mi6.com',
        password: 'secret',
      }
      const context = undefined
      const error = Error('Connection refused')
      const validateSpy = jest.spyOn(UserStore, 'validate').mockRejectedValue(error)

      await expect((MutationResolver.login as any)(null, args, context, null)).rejects.toThrow(error)

      expect(validateSpy.mock.calls).toEqual([[args.name, args.password]])
    })
    it('sets user on context if context undefined', async () => {
      const args = {
        name: 'james.bond@mi6.com',
        password: 'secret',
      }
      const context = undefined
      const user: UserDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        name: args.name,
        password: '',
      }
      const validateSpy = jest.spyOn(UserStore, 'validate').mockResolvedValue(user)

      await expect((MutationResolver.login as any)(null, args, context, null)).resolves.toEqual({
        id: user._id.toString(),
        created: user.created,
        name: user.name,
      })

      expect(validateSpy.mock.calls).toEqual([[args.name, args.password]])
    })
    it('sets user on context if context session undefined', async () => {
      const args = {
        name: 'james.bond@mi6.com',
        password: 'secret',
      }
      const context = {}
      const user: UserDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        name: args.name,
        password: '',
      }
      const validateSpy = jest.spyOn(UserStore, 'validate').mockResolvedValue(user)

      await expect((MutationResolver.login as any)(null, args, context, null)).resolves.toEqual({
        id: user._id.toString(),
        created: user.created,
        name: user.name,
      })

      expect(validateSpy.mock.calls).toEqual([[args.name, args.password]])
      expect(context).toEqual({
        session: {
          user,
        },
      })
    })
    it('sets user on context if context session does not have user', async () => {
      const args = {
        name: 'james.bond@mi6.com',
        password: 'secret',
      }
      const context = {
        session: {},
      }
      const user: UserDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        name: args.name,
        password: '',
      }
      const validateSpy = jest.spyOn(UserStore, 'validate').mockResolvedValue(user)

      await expect((MutationResolver.login as any)(null, args, context, null)).resolves.toEqual({
        id: user._id.toString(),
        created: user.created,
        name: user.name,
      })

      expect(validateSpy.mock.calls).toEqual([[args.name, args.password]])
      expect(context).toEqual({
        session: {
          user,
        },
      })
    })
    it('sets user on context if context session already has user', async () => {
      const args = {
        name: 'james.bond@mi6.com',
        password: 'secret',
      }
      const context = {
        session: {
          user: {
            _id: new ObjectId(),
            created: new Date(),
            name: 'existing',
          },
        },
      }
      const user = {
        _id: new ObjectId(),
        created: new Date(),
        name: args.name,
        password: '',
      }
      const validateSpy = jest.spyOn(UserStore, 'validate').mockResolvedValue(user)

      await expect((MutationResolver.login as any)(null, args, context, null)).resolves.toEqual({
        id: user._id.toString(),
        created: user.created,
        name: user.name,
      })

      expect(validateSpy.mock.calls).toEqual([[args.name, args.password]])
      expect(context).toEqual({
        session: {
          user,
        },
      })
    })
  })
  describe('logout', () => {
    it('removes user from session and returns true if user on session', () => {
      const context = {
        session: {
          user: {
            _id: new ObjectId(),
            created: new Date(),
            name: 'name',
          },
        },
      }

      expect((MutationResolver.logout as any)(null, null, context, null)).toEqual(true)

      expect(context.session.user).toEqual(undefined)
    })
    it('returns false if no user on session', () => {
      const context = {
        session: {},
      }

      expect((MutationResolver.logout as any)(null, null, context, null)).toEqual(false)

      expect(context.session).toEqual({})
    })
    it('returns false if no session on context', () => {
      const context = {}

      expect((MutationResolver.logout as any)(null, null, context, null)).toEqual(false)

      expect(context).toEqual({})
    })
    it('returns false if no context', () => {
      const context = undefined

      expect((MutationResolver.logout as any)(null, null, context, null)).toEqual(false)

      expect(context).toEqual(undefined)
    })
  })
})

async function testAddDeck({
  inputArtStyle = 1,
  expectedArtStyle = 1,
  factionKey = FactionKey.Monsters,
  leaderId,
  unitIds,
  name = 'deck-name',
  userId,
  factionGetResponse,
  leaderGetResponse,
  unitGetResponse,
  validateDeckResponse = [],
  deckAddResponse,
  deckAddError,
  errorReturned,
  errorThrown,
  factionGetCalls = [[{}]],
  leaderGetCalls,
  unitGetCalls,
  deckUnitCalls,
  validateDeckCalls,
  deckAddCalls,
  getDeckStatsCalls,
  postResolversCalled = true,
}: {
  inputArtStyle?: number | undefined | null
  expectedArtStyle?: number
  factionKey?: FactionKey
  leaderId?: ObjectId
  unitIds?: ObjectId[]
  name?: string
  userId?: ObjectId
  factionGetResponse?: FactionDbObject[]
  leaderGetResponse?: LeaderDbObject[]
  unitGetResponse?: UnitDbObject[]
  validateDeckResponse?: string[]
  deckAddResponse?: Deck
  deckAddError?: string
  errorReturned?: string
  errorThrown?: string
  factionGetCalls?: any[][]
  leaderGetCalls?: any[][]
  unitGetCalls?: any[][]
  deckUnitCalls?: any[][]
  validateDeckCalls?: any[][]
  deckAddCalls?: any[][]
  getDeckStatsCalls?: any[][]
  postResolversCalled?: boolean
}) {
  if (!unitIds) {
    unitIds = [new ObjectId()]
  }
  const args = {
    faction: factionKey,
    leader: leaderId ? leaderId.toString() : new ObjectId().toString(),
    units: unitIds.map((unitId) => {
      return {
        artStyle: inputArtStyle,
        id: unitId.toString(),
      }
    }),
    name,
  }
  if (!userId) {
    userId = new ObjectId()
  }
  const context = {
    session: {
      user: {
        _id: userId,
      },
    },
  }
  const resolvedUser: User = {
    id: userId.toString(),
    name: 'test-add-deck-user',
    created: new Date(),
  }
  const factionId = new ObjectId()
  const faction: FactionDbObject = {
    _id: factionId,
    created: new Date(),
    image: 'image',
    key: args.faction,
    name: 'name',
    stats: {} as any,
  }
  const resolvedFaction: Faction = {
    id: faction._id.toString(),
    created: faction.created,
    image: faction.image,
    key: factionKey,
    name: faction.name,
    stats: faction.stats,
  }
  const leader: LeaderDbObject = {
    _id: new ObjectId(args.leader),
    ability: 'ability',
    created: new Date(),
    faction: factionId,
    image: 'image',
    name: 'name',
    quote: 'quote',
  }
  const resolvedLeader: Leader = {
    id: leader._id.toString(),
    ability: leader.ability,
    created: leader.created,
    faction: resolvedFaction,
    image: leader.image,
    name: leader.name,
    quote: leader.quote,
  }
  const unit: UnitDbObject = {
    _id: unitIds[0],
    created: new Date(),
    deckable: true,
    faction: factionId,
    images: [],
    name: 'name',
    quote: 'quote',
  }
  const deckUnits: DeckUnit[] = [
    {
      artStyle: expectedArtStyle,
      unit: {
        ...unit,
        id: unitIds.toString(),
        combats: undefined,
        dlc: undefined,
        effects: [],
        scorchScope: undefined,
        faction: resolvedFaction,
      },
    },
  ]
  const deckStats = {} as any
  const deck: DeckDbObject = {
    _id: new ObjectId(),
    created: new Date(),
    faction: factionId,
    leader: new ObjectId(args.leader),
    name: args.name,
    stats: {} as any,
    units: [
      {
        artStyle: expectedArtStyle,
        unit: unitIds as any,
      },
    ],
    user: userId,
  }
  const resolvedDeck: Deck = {
    id: deck._id.toString(),
    created: deck.created,
    faction: resolvedFaction,
    leader: resolvedLeader,
    name: deck.name,
    stats: deck.stats,
    units: deckUnits,
    user: resolvedUser,
  }
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(factionGetResponse || [faction])
  const leaderGetSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue(leaderGetResponse || [leader])
  const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue(unitGetResponse || [unit])
  const deckUnitResolverSpy = jest.spyOn(DeckUnitResolver, 'resolveFromArray').mockResolvedValue(deckUnits)
  const validateDeckSpy = jest.spyOn(validateDeck, 'validateDeck').mockReturnValue(validateDeckResponse)
  const addDeckSpy = jest.spyOn(DeckStore, 'add')
  if (deckAddError) {
    addDeckSpy.mockRejectedValue(Error(deckAddError))
  } else {
    addDeckSpy.mockResolvedValue((deckAddResponse as any) || deck)
  }
  const getDeckStatsSpy = jest.spyOn(gwentUtils, 'getDeckStats').mockReturnValue(deckStats)
  const factionResolverSpy = jest.spyOn(FactionResolver, 'resolveFromObject').mockResolvedValue(resolvedFaction)
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'resolveFromObject').mockResolvedValue(resolvedLeader)
  const deckResolverSpy = jest.spyOn(DeckResolver, 'resolveFromObject').mockResolvedValue(resolvedDeck)

  if (errorThrown) {
    await expect((MutationResolver.addDeck as any)(null, args, context, null)).rejects.toEqual(Error(errorThrown))
  } else {
    await expect((MutationResolver.addDeck as any)(null, args, context, null)).resolves.toEqual(
      errorReturned ? Error(errorReturned) : resolvedDeck
    )
  }

  expect(factionGetSpy.mock.calls).toEqual(factionGetCalls)
  expect(leaderGetSpy.mock.calls).toEqual(
    leaderGetCalls || [
      [
        {
          ids: [args.leader],
        },
      ],
    ]
  )
  expect(unitGetSpy.mock.calls).toEqual(
    unitGetCalls || [
      [
        {
          ids: unitIds.map((unitId) => unitId.toString()),
        },
      ],
    ]
  )
  expect(deckUnitResolverSpy.mock.calls).toEqual(
    deckUnitCalls || [
      [
        {
          deckUnits: [
            {
              artStyle: expectedArtStyle,
              unit: unit._id,
            },
          ],
          neutralStats: undefined,
        },
      ],
    ]
  )
  expect(validateDeckSpy.mock.calls).toEqual(
    validateDeckCalls || [
      [
        {
          deckUnits: deckUnits,
          faction: args.faction,
        },
      ],
    ]
  )
  expect(addDeckSpy.mock.calls).toEqual(
    deckAddCalls || [
      [
        {
          factionId,
          leaderId: args.leader,
          name: args.name,
          stats: deckStats,
          units: [
            {
              artStyle: expectedArtStyle,
              unit: unitIds.toString(),
            },
          ],
          userId,
        },
      ],
    ]
  )
  expect(getDeckStatsSpy.mock.calls).toEqual(getDeckStatsCalls || [[deckUnits]])
  expect(factionResolverSpy.mock.calls).toEqual(
    postResolversCalled
      ? [
          [
            {
              faction,
              neutralStats: undefined,
            },
          ],
        ]
      : []
  )
  expect(leaderResolverSpy.mock.calls).toEqual(
    postResolversCalled
      ? [
          [
            {
              leader,
              faction: resolvedFaction,
              neutralStats: undefined,
            },
          ],
        ]
      : []
  )
  expect(deckResolverSpy.mock.calls).toEqual(
    postResolversCalled
      ? [
          [
            {
              deck,
              faction: resolvedFaction,
              leader: resolvedLeader,
              units: deckUnits,
              neutralDeckStats: undefined,
            },
          ],
        ]
      : []
  )
}

async function testAddGame({
  opponentNames,
  getUserByNameResponses,
  error,
  expected,
  addCalls = [],
  resolveFromObjectCalled,
}: {
  opponentNames: string[]
  getUserByNameResponses?: (UserDbObject | Error)[]
  error?: string
  expected?: Game | Error
  addCalls?: any[][]
  resolveFromObjectCalled?: boolean
}) {
  const userId = new ObjectId()
  const context = {
    session: {
      user: {
        _id: userId,
      },
    },
  }
  const args = {
    opponentNames,
  }
  const user: User = {
    created: new Date(),
    id: userId.toString(),
    name: 'user-name',
  }
  const game: GameDbObject = {
    _id: new ObjectId(),
    created: new Date(),
    creator: userId,
    players: [],
    round: {
      current: 0,
      maximum: MAX_ROUNDS,
    },
    updated: new Date(),
    victors: [],
  }
  const resolvedGame: Game = {
    created: game.created,
    creator: user,
    id: game._id.toString(),
    players: [],
    round: game.round,
    updated: game.updated,
    status: GameStatus.Decking,
    victors: [],
  }
  const getByNameSpy = jest.spyOn(UserStore, 'getByName')
  if (getUserByNameResponses) {
    for (const response of getUserByNameResponses) {
      if (response instanceof Error) {
        getByNameSpy.mockRejectedValueOnce(response)
      } else {
        getByNameSpy.mockResolvedValueOnce(response)
      }
    }
  }
  const addSpy = jest.spyOn(GameStore, 'add').mockResolvedValue(game)
  const resolveFromObjectSpy = jest.spyOn(GameResolver, 'resolveFromObject').mockResolvedValue(resolvedGame)

  if (error) {
    await expect((MutationResolver.addGame as any)(null, args, context, null)).rejects.toThrow(error)
  } else {
    await expect((MutationResolver.addGame as any)(null, args, context, null)).resolves.toEqual(
      expected || resolvedGame
    )
  }

  expect(addSpy.mock.calls).toEqual(addCalls)
  expect(resolveFromObjectSpy.mock.calls).toEqual(
    resolveFromObjectCalled
      ? [
          [
            {
              game: game._id,
              users: getUserByNameResponses,
              neutralFactionStats: undefined,
              neutralLeaderStats: undefined,
            },
          ],
        ]
      : []
  )
}
