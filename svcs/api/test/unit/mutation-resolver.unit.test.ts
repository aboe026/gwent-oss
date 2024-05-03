import { ObjectId } from 'mongodb'

import { DeckDbObject, UserDbObject } from '@gwent/graphql-schema/database-typings'
import DeckStore from '../../src/database/stores/deck-store'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import FactionStore from '../../src/database/stores/faction-store'
import * as gwentUtils from '@gwent/utils'
import LeaderStore from '../../src/database/stores/leader-store'
import MutationResolver from '../../src/graphql/resolvers/mutation-resolver'
import UnitStore from '../../src/database/stores/unit-store'
import UserStore from '../../src/database/stores/user-store'
import * as validateDeck from '@gwent/validators'

describe('mutation-resolver', () => {
  describe('addDeck', () => {
    it('returns error if faction is neutral', async () => {
      const args = {
        faction: FactionKey.Neutral,
      }

      await expect((MutationResolver.addDeck as any)(null, args, null, null)).resolves.toEqual(
        Error(`Cannot create Deck with "${FactionKey.Neutral}" faction.`)
      )
    })
    it('returns error if faction with key does not exist', async () => {
      const args = {
        faction: FactionKey.Monsters,
      }
      const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([])

      await expect((MutationResolver.addDeck as any)(null, args, null, null)).resolves.toEqual(
        Error(`Faction with key "${FactionKey.Monsters}" not found.`)
      )

      expect(factionGetSpy.mock.calls).toEqual([[{}]])
    })
    it('returns error if leader does not exist', async () => {
      const args = {
        faction: FactionKey.Monsters,
        leader: new ObjectId().toString(),
      }
      const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([
        {
          _id: new ObjectId(),
          created: new Date(),
          image: 'image',
          key: args.faction,
          name: 'name',
          stats: {} as any,
        },
      ])
      const leaderGetSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue([])

      await expect((MutationResolver.addDeck as any)(null, args, null, null)).resolves.toEqual(
        Error(`Invalid leader ID "${args.leader}": Does not exist.`)
      )

      expect(factionGetSpy.mock.calls).toEqual([[{}]])
      expect(leaderGetSpy.mock.calls).toEqual([
        [
          {
            ids: [args.leader],
          },
        ],
      ])
    })
    it('returns error if leader is of wrong faction', async () => {
      const args = {
        faction: FactionKey.Monsters,
        leader: new ObjectId().toString(),
      }
      const faction2Id = new ObjectId()
      const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([
        {
          _id: new ObjectId(),
          created: new Date(),
          image: 'image',
          key: args.faction,
          name: 'name',
          stats: {} as any,
        },
        {
          _id: faction2Id,
          created: new Date(),
          image: 'image',
          key: FactionKey.NorthernRealms,
          name: 'name',
          stats: {} as any,
        },
      ])
      const leaderGetSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue([
        {
          _id: new ObjectId(args.leader),
          ability: 'ability',
          created: new Date(),
          faction: faction2Id,
          image: 'image',
          name: 'name',
          quote: 'quote',
        },
      ])

      await expect((MutationResolver.addDeck as any)(null, args, null, null)).resolves.toEqual(
        Error(
          `Invalid leader ID "${args.leader}": Faction "${FactionKey.NorthernRealms}" does not match deck faction of "${args.faction}".`
        )
      )

      expect(factionGetSpy.mock.calls).toEqual([[{}]])
      expect(leaderGetSpy.mock.calls).toEqual([
        [
          {
            ids: [args.leader],
          },
        ],
      ])
    })
    it('returns errors if units do not exist', async () => {
      const unitId1 = new ObjectId()
      const unitId2 = new ObjectId()
      const unitId3 = new ObjectId()
      const args = {
        faction: FactionKey.Monsters,
        leader: new ObjectId().toString(),
        units: [
          {
            id: unitId1.toString(),
          },
          {
            id: unitId2.toString(),
          },
          {
            id: unitId3.toString(),
          },
        ],
      }
      const factionId = new ObjectId()
      const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([
        {
          _id: factionId,
          created: new Date(),
          image: 'image',
          key: args.faction,
          name: 'name',
          stats: {} as any,
        },
      ])
      const leaderGetSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue([
        {
          _id: new ObjectId(args.leader),
          ability: 'ability',
          created: new Date(),
          faction: factionId,
          image: 'image',
          name: 'name',
          quote: 'quote',
        },
      ])
      const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue([
        {
          _id: unitId2,
          created: new Date(),
          deckable: true,
          faction: factionId,
          images: [],
          name: 'name',
          quote: 'quote',
        },
      ])

      await expect((MutationResolver.addDeck as any)(null, args, null, null)).resolves.toEqual(
        Error(`Invalid unit ID "${unitId1}": Does not exist.\nInvalid unit ID "${unitId3}": Does not exist.`)
      )

      expect(factionGetSpy.mock.calls).toEqual([[{}]])
      expect(leaderGetSpy.mock.calls).toEqual([
        [
          {
            ids: [args.leader],
          },
        ],
      ])
      expect(unitGetSpy.mock.calls).toEqual([
        [
          {
            ids: [unitId1.toString(), unitId2.toString(), unitId3.toString()],
          },
        ],
      ])
    })
    it('returns errors if validateDeck returns errors', async () => {
      const unitId = new ObjectId()
      const args = {
        faction: FactionKey.Monsters,
        leader: new ObjectId().toString(),
        units: [
          {
            id: unitId.toString(),
          },
        ],
      }
      const factionId = new ObjectId()
      const unit = {
        _id: unitId,
        created: new Date(),
        deckable: true,
        faction: factionId,
        images: [],
        name: 'name',
        quote: 'quote',
      }
      const faction = {
        _id: factionId,
        created: new Date(),
        image: 'image',
        key: args.faction,
        name: 'name',
        stats: {} as any,
      }
      const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([faction])
      const leaderGetSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue([
        {
          _id: new ObjectId(args.leader),
          ability: 'ability',
          created: new Date(),
          faction: factionId,
          image: 'image',
          name: 'name',
          quote: 'quote',
        },
      ])
      const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue([unit])
      const validateDeckSpy = jest.spyOn(validateDeck, 'validateDeck').mockReturnValue(['error1', 'error2'])

      await expect((MutationResolver.addDeck as any)(null, args, null, null)).resolves.toEqual(Error('error1\nerror2'))

      expect(factionGetSpy.mock.calls).toEqual([[{}]])
      expect(leaderGetSpy.mock.calls).toEqual([
        [
          {
            ids: [args.leader],
          },
        ],
      ])
      expect(unitGetSpy.mock.calls).toEqual([
        [
          {
            ids: [unitId.toString()],
          },
        ],
      ])
      expect(validateDeckSpy.mock.calls).toEqual([
        [
          {
            deckUnits: [
              {
                artStyle: 1,
                unit: {
                  ...unit,
                  id: unitId.toString(),
                  combats: undefined,
                  dlc: undefined,
                  effects: [],
                  scorchScope: undefined,
                  faction,
                },
              },
            ],
            faction: args.faction,
          },
        ],
      ])
    })
    it('returns error if deck with name already exists', async () => {
      const args = {
        faction: FactionKey.Monsters,
        leader: new ObjectId().toString(),
        units: [],
        name: 'name',
      }
      const userId = new ObjectId()
      const context = {
        session: {
          user: {
            _id: userId,
          },
        },
      }
      const factionId = new ObjectId()
      const faction = {
        _id: factionId,
        created: new Date(),
        image: 'image',
        key: args.faction,
        name: 'name',
        stats: {} as any,
      }
      const deckStats = {} as any
      const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([faction])
      const leaderGetSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue([
        {
          _id: new ObjectId(args.leader),
          ability: 'ability',
          created: new Date(),
          faction: factionId,
          image: 'image',
          name: 'name',
          quote: 'quote',
        },
      ])
      const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue([])
      const validateDeckSpy = jest.spyOn(validateDeck, 'validateDeck').mockReturnValue([])
      const addDeckSpy = jest
        .spyOn(DeckStore, 'add')
        .mockRejectedValue(Error(`Deck with name "${args.name}" already exists for user "${userId}"`))
      const getDeckStatsSpy = jest.spyOn(gwentUtils, 'getDeckStats').mockReturnValue(deckStats)

      await expect((MutationResolver.addDeck as any)(null, args, context, null)).resolves.toEqual(
        Error(`Deck with name "${args.name}" already exists`)
      )

      expect(factionGetSpy.mock.calls).toEqual([[{}]])
      expect(leaderGetSpy.mock.calls).toEqual([
        [
          {
            ids: [args.leader],
          },
        ],
      ])
      expect(unitGetSpy.mock.calls).toEqual([
        [
          {
            ids: [],
          },
        ],
      ])
      expect(validateDeckSpy.mock.calls).toEqual([
        [
          {
            deckUnits: [],
            faction: args.faction,
          },
        ],
      ])
      expect(addDeckSpy.mock.calls).toEqual([
        [
          {
            factionId,
            leaderId: args.leader,
            name: args.name,
            stats: deckStats,
            units: [],
            userId,
          },
        ],
      ])
      expect(getDeckStatsSpy.mock.calls).toEqual([[[]]])
    })
    it('throws error if addDeck throws error that is not duplicate name', async () => {
      const args = {
        faction: FactionKey.Monsters,
        leader: new ObjectId().toString(),
        units: [],
        name: 'name',
      }
      const userId = new ObjectId()
      const context = {
        session: {
          user: {
            _id: userId,
          },
        },
      }
      const factionId = new ObjectId()
      const faction = {
        _id: factionId,
        created: new Date(),
        image: 'image',
        key: args.faction,
        name: 'name',
        stats: {} as any,
      }
      const deckStats = {} as any
      const error = 'Network Error'
      const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([faction])
      const leaderGetSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue([
        {
          _id: new ObjectId(args.leader),
          ability: 'ability',
          created: new Date(),
          faction: factionId,
          image: 'image',
          name: 'name',
          quote: 'quote',
        },
      ])
      const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue([])
      const validateDeckSpy = jest.spyOn(validateDeck, 'validateDeck').mockReturnValue([])
      const addDeckSpy = jest.spyOn(DeckStore, 'add').mockRejectedValue(Error(error))
      const getDeckStatsSpy = jest.spyOn(gwentUtils, 'getDeckStats').mockReturnValue(deckStats)

      await expect((MutationResolver.addDeck as any)(null, args, context, null)).rejects.toThrow(Error(error))

      expect(factionGetSpy.mock.calls).toEqual([[{}]])
      expect(leaderGetSpy.mock.calls).toEqual([
        [
          {
            ids: [args.leader],
          },
        ],
      ])
      expect(unitGetSpy.mock.calls).toEqual([
        [
          {
            ids: [],
          },
        ],
      ])
      expect(validateDeckSpy.mock.calls).toEqual([
        [
          {
            deckUnits: [],
            faction: args.faction,
          },
        ],
      ])
      expect(addDeckSpy.mock.calls).toEqual([
        [
          {
            factionId,
            leaderId: args.leader,
            name: args.name,
            stats: deckStats,
            units: [],
            userId,
          },
        ],
      ])
      expect(getDeckStatsSpy.mock.calls).toEqual([[[]]])
    })
    it('returns deck database dock if no errors', async () => {
      const args = {
        faction: FactionKey.Monsters,
        leader: new ObjectId().toString(),
        units: [],
        name: 'name',
      }
      const userId = new ObjectId()
      const context = {
        session: {
          user: {
            _id: userId,
          },
        },
      }
      const factionId = new ObjectId()
      const faction = {
        _id: factionId,
        created: new Date(),
        image: 'image',
        key: args.faction,
        name: 'name',
        stats: {} as any,
      }
      const deckStats = {} as any
      const deck: DeckDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        faction: factionId,
        leader: new ObjectId(args.leader),
        name: args.name,
        stats: {} as any,
        units: [],
        user: userId,
      }
      const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([faction])
      const leaderGetSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue([
        {
          _id: new ObjectId(args.leader),
          ability: 'ability',
          created: new Date(),
          faction: factionId,
          image: 'image',
          name: 'name',
          quote: 'quote',
        },
      ])
      const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue([])
      const validateDeckSpy = jest.spyOn(validateDeck, 'validateDeck').mockReturnValue([])
      const addDeckSpy = jest.spyOn(DeckStore, 'add').mockResolvedValue(deck)
      const getDeckStatsSpy = jest.spyOn(gwentUtils, 'getDeckStats').mockReturnValue(deckStats)

      await expect((MutationResolver.addDeck as any)(null, args, context, null)).resolves.toEqual(deck)

      expect(factionGetSpy.mock.calls).toEqual([[{}]])
      expect(leaderGetSpy.mock.calls).toEqual([
        [
          {
            ids: [args.leader],
          },
        ],
      ])
      expect(unitGetSpy.mock.calls).toEqual([
        [
          {
            ids: [],
          },
        ],
      ])
      expect(validateDeckSpy.mock.calls).toEqual([
        [
          {
            deckUnits: [],
            faction: args.faction,
          },
        ],
      ])
      expect(addDeckSpy.mock.calls).toEqual([
        [
          {
            factionId,
            leaderId: args.leader,
            name: args.name,
            stats: deckStats,
            units: [],
            userId,
          },
        ],
      ])
      expect(getDeckStatsSpy.mock.calls).toEqual([[[]]])
    })
    it('undefined artstyle converted to 1', async () => {
      await testAddDeckWithArtStyle({
        input: undefined,
        expected: 1,
      })
    })
    it('null artstyle converted to 1', async () => {
      await testAddDeckWithArtStyle({
        input: null,
        expected: 1,
      })
    })
    it('explicit artStyle of 1', async () => {
      await testAddDeckWithArtStyle({
        input: 1,
        expected: 1,
      })
    })
    it('explicit artStyle of 2', async () => {
      await testAddDeckWithArtStyle({
        input: 2,
        expected: 2,
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
      }
      const addSpy = jest.spyOn(UserStore, 'add').mockResolvedValue(user)

      await expect((MutationResolver.addUser as any)(null, args, null, null)).resolves.toEqual(user)

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
      }
      const validateSpy = jest.spyOn(UserStore, 'validate').mockResolvedValue(user)

      await expect((MutationResolver.login as any)(null, args, context, null)).resolves.toEqual(user)

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
      }
      const validateSpy = jest.spyOn(UserStore, 'validate').mockResolvedValue(user)

      await expect((MutationResolver.login as any)(null, args, context, null)).resolves.toEqual(user)

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
      }
      const validateSpy = jest.spyOn(UserStore, 'validate').mockResolvedValue(user)

      await expect((MutationResolver.login as any)(null, args, context, null)).resolves.toEqual(user)

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
      const user: UserDbObject = {
        _id: new ObjectId(),
        created: new Date(),
        name: args.name,
      }
      const validateSpy = jest.spyOn(UserStore, 'validate').mockResolvedValue(user)

      await expect((MutationResolver.login as any)(null, args, context, null)).resolves.toEqual(user)

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

async function testAddDeckWithArtStyle({ input, expected }: { input: any; expected: number }) {
  const unitId = new ObjectId()
  const args = {
    faction: FactionKey.Monsters,
    leader: new ObjectId().toString(),
    units: [
      {
        artStyle: input,
        id: unitId.toString(),
      },
    ],
    name: 'name',
  }
  const userId = new ObjectId()
  const context = {
    session: {
      user: {
        _id: userId,
      },
    },
  }
  const factionId = new ObjectId()
  const faction = {
    _id: factionId,
    created: new Date(),
    image: 'image',
    key: args.faction,
    name: 'name',
    stats: {} as any,
  }
  const unit = {
    _id: unitId,
    created: new Date(),
    deckable: true,
    faction: factionId,
    images: [],
    name: 'name',
    quote: 'quote',
  }
  const deckUnits = [
    {
      artStyle: expected,
      unit: {
        ...unit,
        id: unitId.toString(),
        combats: undefined,
        dlc: undefined,
        effects: [],
        scorchScope: undefined,
        faction,
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
        artStyle: expected,
        unit: unitId as any,
      },
    ],
    user: userId,
  }
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue([faction])
  const leaderGetSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue([
    {
      _id: new ObjectId(args.leader),
      ability: 'ability',
      created: new Date(),
      faction: factionId,
      image: 'image',
      name: 'name',
      quote: 'quote',
    },
  ])
  const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue([unit])
  const validateDeckSpy = jest.spyOn(validateDeck, 'validateDeck').mockReturnValue([])
  const addDeckSpy = jest.spyOn(DeckStore, 'add').mockResolvedValue(deck)
  const getDeckStatsSpy = jest.spyOn(gwentUtils, 'getDeckStats').mockReturnValue(deckStats)

  await expect((MutationResolver.addDeck as any)(null, args, context, null)).resolves.toEqual(deck)

  expect(factionGetSpy.mock.calls).toEqual([[{}]])
  expect(leaderGetSpy.mock.calls).toEqual([
    [
      {
        ids: [args.leader],
      },
    ],
  ])
  expect(unitGetSpy.mock.calls).toEqual([
    [
      {
        ids: [unitId.toString()],
      },
    ],
  ])
  expect(validateDeckSpy.mock.calls).toEqual([
    [
      {
        deckUnits: deckUnits,
        faction: args.faction,
      },
    ],
  ])
  expect(addDeckSpy.mock.calls).toEqual([
    [
      {
        factionId,
        leaderId: args.leader,
        name: args.name,
        stats: deckStats,
        units: [
          {
            artStyle: expected,
            id: unitId.toString(),
          },
        ],
        userId,
      },
    ],
  ])
  expect(getDeckStatsSpy.mock.calls).toEqual([[deckUnits]])
}
