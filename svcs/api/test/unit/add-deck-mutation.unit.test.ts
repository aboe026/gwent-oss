import { ObjectId } from 'mongodb'

import AddDeckMutation from '../../src/graphql/resolvers/mutations/add-deck-mutation'
import { Context } from '@gwent/graphql-schema/context'
import { Deck, DeckUnit, FactionKey, MutationAddDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import DeckResolver from '../../src/graphql/resolvers/types/deck-resolver'
import DeckStore from '../../src/database/stores/deck-store'
import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import EventManager from '../../src/graphql/event-manager'
import { FactionDbObject, LeaderDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import FactionResolver from '../../src/graphql/resolvers/types/faction-resolver'
import FactionStore from '../../src/database/stores/faction-store'
import * as gwentUtils from '@gwent/utils'
import LeaderResolver from '../../src/graphql/resolvers/types/leader-resolver'
import LeaderStore from '../../src/database/stores/leader-store'
import { NOT_AUTHENTICATED_MESSAGE, PubSubEvents } from '@gwent/constants'
import TestUtil from '../test-util'
import UnitStore from '../../src/database/stores/unit-store'
import * as validateDeck from '@gwent/validators'

describe('add-deck-mutation', () => {
  describe('addDeck', () => {
    const userId = new ObjectId()
    const logPrefix = `addDeck by "${userId}"`
    it('returns error if no user on context', async () => {
      await testAddDeck({
        factionKey: FactionKey.Skellige,
        errorReturned: NOT_AUTHENTICATED_MESSAGE,
        factionGetCalls: [],
        leaderGetCalls: [],
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        errorCalls: [[`No user on context for addDeck mutation: "${JSON.stringify({})}".`]],
      })
    })
    it('returns error if invalid leader ID', async () => {
      const leaderId = 'invalid'
      const error = `Leader ID "${leaderId}" is not a valid MongoDB ObjectId.`
      await testAddDeck({
        userId,
        factionKey: FactionKey.Monsters,
        leaderId,
        errorReturned: error,
        factionGetCalls: [],
        leaderGetCalls: [],
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if invalid unit ID', async () => {
      const unitId = 'invalid'
      const error = `Unit ID "${unitId}" is not a valid MongoDB ObjectId.`
      await testAddDeck({
        userId,
        factionKey: FactionKey.Monsters,
        leaderId: new ObjectId(),
        unitIds: [unitId],
        errorReturned: error,
        factionGetCalls: [],
        leaderGetCalls: [],
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if faction is neutral', async () => {
      const error = `Cannot create Deck with "${FactionKey.Neutral}" faction.`
      await testAddDeck({
        userId,
        factionKey: FactionKey.Neutral,
        errorReturned: error,
        factionGetCalls: [],
        leaderGetCalls: [],
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if faction with key does not exist', async () => {
      const error = `Faction with key "${FactionKey.Monsters}" does not exist.`
      await testAddDeck({
        userId,
        factionGetResponse: [],
        errorReturned: error,
        leaderGetCalls: [],
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        errorCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if more than 1 faction with key exists', async () => {
      const factionKey = FactionKey.Monsters
      const factions = [
        TestUtil.getDbFaction({
          key: factionKey,
        }),
        TestUtil.getDbFaction({
          key: factionKey,
        }),
      ]
      await testAddDeck({
        userId,
        factionGetResponse: factions,
        errorReturned: `Found more than 1 Faction with key "${factionKey}".`,
        leaderGetCalls: [],
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        errorCalls: [
          [`${logPrefix} failed: Found more than 1 Faction with key "${factionKey}": "${JSON.stringify(factions)}"`],
        ],
      })
    })
    it('returns error if leader does not exist', async () => {
      const leaderId = new ObjectId()
      const error = `Leader with ID "${leaderId}" does not exist.`
      await testAddDeck({
        userId,
        leaderId,
        leaderGetResponse: [],
        errorReturned: error,
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if more than 1 leader exist', async () => {
      const leaderId = new ObjectId()
      const leaders = [TestUtil.getDbLeader({ id: leaderId }), TestUtil.getDbLeader({ id: leaderId })]
      await testAddDeck({
        userId,
        leaderId,
        leaderGetResponse: leaders,
        errorReturned: `Found more than 1 Leader with ID "${leaderId}".`,
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        errorCalls: [
          [`${logPrefix} failed: Found more than 1 Leader with ID "${leaderId}": "${JSON.stringify(leaders)}"`],
        ],
      })
    })
    it('returns error if leader is of wrong faction', async () => {
      const factionId = new ObjectId()
      const leaderId = new ObjectId()
      const leaderFactionId = new ObjectId()
      const error = `Faction ID "${leaderFactionId}" for leader "${leaderId}" does not match deck faction ID "${factionId}".`
      await testAddDeck({
        userId,
        factionKey: FactionKey.Monsters,
        factionGetResponse: [
          TestUtil.getDbFaction({
            id: factionId,
            key: FactionKey.Monsters,
          }),
          TestUtil.getDbFaction({
            id: leaderFactionId,
            key: FactionKey.NorthernRealms,
          }),
        ],
        leaderId,
        leaderGetResponse: [
          TestUtil.getDbLeader({
            id: leaderId,
            faction: leaderFactionId,
          }),
        ],
        errorReturned: error,
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if single unit does not exist', async () => {
      const unitId = new ObjectId()
      const error = `Unit with ID "${unitId}" does not exist.`
      await testAddDeck({
        userId,
        unitIds: [unitId],
        unitGetResponse: [],
        errorReturned: error,
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns errors if multiple units do not exist', async () => {
      const unitId1 = new ObjectId()
      const unitId2 = new ObjectId()
      const error = [`Unit with ID "${unitId1}" does not exist.`, `Unit with ID "${unitId2}" does not exist.`].join(
        '\n'
      )
      await testAddDeck({
        userId,
        unitIds: [unitId1, unitId2],
        unitGetResponse: [],
        errorReturned: error,
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns error if validateDeck returns single error', async () => {
      const error = 'too many specials'
      await testAddDeck({
        userId,
        validateDeckResponse: [error],
        errorReturned: error,
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns errors if validateDeck returns multiple errors', async () => {
      const error1 = 'too many specials'
      const error2 = 'not enough units'
      await testAddDeck({
        userId,
        validateDeckResponse: [error1, error2],
        errorReturned: `${error1}\n${error2}`,
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        warnCalls: [[`${logPrefix} failed: ${error1}\n${error2}`]],
      })
    })
    it('returns error if deck with name already exists', async () => {
      const name = 'deck-name'
      const error = `Deck with name "${name}" already exists for user "${userId}"`
      await testAddDeck({
        userId,
        name,
        deckAddError: error,
        errorReturned: `Deck with name "${name}" already exists.`,
        postResolversCalled: false,
        warnCalls: [[`${logPrefix} failed: Deck with name "${name}" already exists.`]],
      })
    })
    it('throws error if addDeck throws error that is not duplicate name', async () => {
      const error = 'network error'
      await testAddDeck({
        userId,
        deckAddError: error,
        errorThrown: error,
        postResolversCalled: false,
        errorCalls: [[Error(`${logPrefix} failed: ${Error(error)}`)]],
      })
    })
    it('undefined artstyle converted to 1', async () => {
      await testAddDeck({
        userId,
        inputArtStyle: undefined,
        expectedArtStyle: 1,
      })
    })
    it('null artstyle converted to 1', async () => {
      await testAddDeck({
        userId,
        inputArtStyle: null,
        expectedArtStyle: 1,
      })
    })
    it('explicit artStyle of 1', async () => {
      await testAddDeck({
        userId,
        inputArtStyle: 1,
        expectedArtStyle: 1,
      })
    })
    it('explicit artStyle of 2', async () => {
      await testAddDeck({
        userId,
        inputArtStyle: 2,
        expectedArtStyle: 2,
      })
    })
    it('logs to trace if enabled', async () => {
      await testAddDeck({
        userId,
        traceEnabled: true,
        logPrefix,
      })
    })
  })
})

async function testAddDeck({
  inputArtStyle = 1,
  expectedArtStyle = 1,
  factionKey = FactionKey.Monsters,
  leaderId = new ObjectId(),
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
  traceEnabled,
  factionGetCalls,
  leaderGetCalls,
  unitGetCalls,
  deckUnitCalls,
  validateDeckCalls,
  deckAddCalls,
  getDeckStatsCalls,
  postResolversCalled = true,
  logPrefix,
  errorCalls = [],
  warnCalls = [],
}: {
  inputArtStyle?: number | undefined | null
  expectedArtStyle?: number
  factionKey?: FactionKey
  leaderId?: ObjectId | string
  unitIds?: (ObjectId | string)[]
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
  traceEnabled?: boolean
  factionGetCalls?: any[][]
  leaderGetCalls?: any[][]
  unitGetCalls?: any[][]
  deckUnitCalls?: any[][]
  validateDeckCalls?: any[][]
  deckAddCalls?: any[][]
  getDeckStatsCalls?: any[][]
  postResolversCalled?: boolean
  logPrefix?: string
  errorCalls?: any[][]
  warnCalls?: any[][]
}) {
  if (!unitIds) {
    unitIds = [new ObjectId()]
  }
  const args: MutationAddDeckArgs = {
    faction: factionKey,
    leader: leaderId.toString(),
    units: unitIds.map((unitId) => {
      return {
        artStyle: inputArtStyle,
        id: unitId.toString(),
      }
    }),
    name,
  }
  const context: Context = {
    session: {},
  }
  if (userId && context.session) {
    context.session.user = TestUtil.getDbUser({
      id: userId,
    })
  }
  const resolvedUser = TestUtil.getUser({
    id: userId,
  })
  const faction = TestUtil.getDbFaction({
    key: factionKey,
  })
  const resolvedFaction = TestUtil.getFactionFromDbFaction(faction)
  const leader = TestUtil.getDbLeader({
    faction: faction._id,
    id: ObjectId.isValid(args.leader) ? args.leader : '',
  })
  const resolvedLeader = TestUtil.getLeaderFromDbLeader(leader)
  const unit = TestUtil.getDbUnit({
    id: ObjectId.isValid(unitIds[0]) ? unitIds[0] : '',
    faction: faction._id,
  })
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
  const deckStats = TestUtil.getStats()
  const deck = TestUtil.getDbDeck({
    faction: faction._id,
    leader: ObjectId.isValid(args.leader) ? args.leader : '',
    name: args.name,
    units: unitIds.map((unitId) =>
      TestUtil.getDbDeckUnit({
        artStyle: expectedArtStyle,
        id: ObjectId.isValid(unitId) ? unitId : '',
      })
    ),
    user: userId,
  })
  const resolvedDeck = TestUtil.getDeckFromDbDeck({
    deck,
    user: resolvedUser,
  })
  const factionGetSpy = jest.spyOn(FactionStore, 'get').mockResolvedValue(factionGetResponse || [faction])
  const leaderGetSpy = jest.spyOn(LeaderStore, 'get').mockResolvedValue(leaderGetResponse || [leader])
  const unitGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue(unitGetResponse || [unit])
  const deckUnitResolverSpy = jest.spyOn(DeckUnitResolver, 'fromArray').mockResolvedValue(deckUnits)
  const validateDeckSpy = jest.spyOn(validateDeck, 'validateDeck').mockReturnValue(validateDeckResponse)
  const addDeckSpy = jest.spyOn(DeckStore, 'add')
  if (deckAddError) {
    addDeckSpy.mockRejectedValue(Error(deckAddError))
  } else {
    addDeckSpy.mockResolvedValue((deckAddResponse as any) || deck)
  }
  const getDeckStatsSpy = jest.spyOn(gwentUtils, 'getDeckStats').mockReturnValue(deckStats)
  const factionResolverSpy = jest.spyOn(FactionResolver, 'fromObject').mockResolvedValue(resolvedFaction)
  const leaderResolverSpy = jest.spyOn(LeaderResolver, 'fromObject').mockResolvedValue(resolvedLeader)
  const deckResolverSpy = jest.spyOn(DeckResolver, 'fromObject').mockResolvedValue(resolvedDeck)
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  AddDeckMutation['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  const promise = AddDeckMutation.addDeck(args, context, null as any)
  if (errorThrown) {
    await expect(promise).rejects.toEqual(Error(errorThrown))
  } else {
    await expect(promise).resolves.toEqual(errorReturned ? Error(errorReturned) : resolvedDeck)
  }

  expect(factionGetSpy.mock.calls).toEqual(
    factionGetCalls || [
      [
        {
          keys: [factionKey],
        },
      ],
    ]
  )
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
          factionId: faction._id,
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
  expect(publishSpy.mock.calls).toEqual(
    postResolversCalled
      ? [
          [
            PubSubEvents.DeckAdded,
            {
              deckAdded: resolvedDeck,
            },
          ],
        ]
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `${logPrefix} args: "${JSON.stringify({
              faction: factionKey.toString(),
              leader: leaderId.toString(),
              units: unitIds.map((unitId) => {
                return {
                  artStyle: 1,
                  id: unitId.toString(),
                }
              }),
              name,
            })}"`,
          ],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} factions: "${JSON.stringify([faction])}"`],
          [`${logPrefix} leaders: "${JSON.stringify([leader])}"`],
          [`${logPrefix} units: "${JSON.stringify([unit])}"`],
          [`${logPrefix} deckUnits: "${JSON.stringify(deckUnits)}"`],
          [`${logPrefix} deck: "${JSON.stringify(deck)}"`],
          [`${logPrefix} resolvedFaction: "${JSON.stringify(resolvedFaction)}"`],
        ]
      : []
  )
}
