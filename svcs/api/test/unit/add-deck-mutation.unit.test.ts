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
import { PubSubEvents } from '@gwent/constants'
import TestUtil from '../test-util'
import UnitStore from '../../src/database/stores/unit-store'
import * as validateDeck from '@gwent/validators'

describe('add-deck-mutation', () => {
  describe('addDeck', () => {
    const userId = new ObjectId()
    const logPrefix = `addDeck by "${userId}"`
    it('throws error if faction is neutral', async () => {
      const error = `Faction "${FactionKey.Neutral}" not allowed.`
      await testAddDeck({
        userId,
        factionKey: FactionKey.Neutral,
        exception: Error(error),
        factionGetCalls: [],
        leaderGetCalls: [],
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
        logPrefix,
      })
    })
    it('throws error if leader is of wrong faction', async () => {
      const factionId = new ObjectId()
      const leaderId = new ObjectId()
      const leaderFactionId = new ObjectId()
      const error = `Faction ID "${leaderFactionId}" for leader "${leaderId}" does not match deck faction ID "${factionId}".`
      await testAddDeck({
        userId,
        factionKey: FactionKey.Monsters,
        factionGetResponse: TestUtil.getDbFaction({
          id: factionId,
          key: FactionKey.Monsters,
        }),
        leaderId,
        leaderGetResponse: TestUtil.getDbLeader({
          id: leaderId,
          faction: leaderFactionId,
        }),
        exception: Error(error),
        unitGetCalls: [],
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
        logPrefix,
      })
    })
    it('throws error if single unit does not exist', async () => {
      const unitId = new ObjectId()
      const error = `Unit with ID "${unitId}" does not exist.`
      await testAddDeck({
        userId,
        unitIds: [unitId],
        unitGetResponse: [],
        exception: Error(error),
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
        logPrefix,
      })
    })
    it('throws errors if multiple units do not exist', async () => {
      const unitId1 = new ObjectId()
      const unitId2 = new ObjectId()
      const error = [`Unit with ID "${unitId1}" does not exist.`, `Unit with ID "${unitId2}" does not exist.`].join(
        '\n'
      )
      await testAddDeck({
        userId,
        unitIds: [unitId1, unitId2],
        unitGetResponse: [],
        exception: Error(error),
        deckUnitCalls: [],
        validateDeckCalls: [],
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
        logPrefix,
      })
    })
    it('throws error if validateDeck returns single error', async () => {
      const error = 'too many specials'
      await testAddDeck({
        userId,
        validateDeckResponse: [error],
        exception: Error(error),
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        warnCalls: [[`${logPrefix} failed: ${error}`]],
        logPrefix,
      })
    })
    it('throws errors if validateDeck returns multiple errors', async () => {
      const error1 = 'too many specials'
      const error2 = 'not enough units'
      await testAddDeck({
        userId,
        validateDeckResponse: [error1, error2],
        exception: Error(`${error1}\n${error2}`),
        deckAddCalls: [],
        getDeckStatsCalls: [],
        postResolversCalled: false,
        warnCalls: [[`${logPrefix} failed: ${error1}\n${error2}`]],
        logPrefix,
      })
    })
    it('throws error if deck with name already exists', async () => {
      const name = 'deck-name'
      const error = `Deck with name "${name}" already exists for user "${userId}"`
      await testAddDeck({
        userId,
        name,
        deckAddError: error,
        exception: Error(`Deck with name "${name}" already exists.`),
        postResolversCalled: false,
        warnCalls: [[`${logPrefix} failed: Deck with name "${name}" already exists.`]],
        logPrefix,
      })
    })
    it('throws error if addDeck throws error that is not duplicate name', async () => {
      const error = 'network error'
      await testAddDeck({
        userId,
        deckAddError: error,
        exception: Error(error),
        postResolversCalled: false,
        errorCalls: [[Error(`${logPrefix} failed: ${Error(error)}`)]],
        logPrefix,
      })
    })
    it('undefined artstyle converted to 1', async () => {
      await testAddDeck({
        userId,
        inputArtStyle: undefined,
        expectedArtStyle: 1,
        logPrefix,
      })
    })
    it('null artstyle converted to 1', async () => {
      await testAddDeck({
        userId,
        inputArtStyle: null,
        expectedArtStyle: 1,
        logPrefix,
      })
    })
    it('explicit artStyle of 1', async () => {
      await testAddDeck({
        userId,
        inputArtStyle: 1,
        expectedArtStyle: 1,
        logPrefix,
      })
    })
    it('explicit artStyle of 2', async () => {
      await testAddDeck({
        userId,
        inputArtStyle: 2,
        expectedArtStyle: 2,
        logPrefix,
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
  exception,
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
  factionGetResponse?: FactionDbObject
  leaderGetResponse?: LeaderDbObject
  unitGetResponse?: UnitDbObject[]
  validateDeckResponse?: string[]
  deckAddResponse?: Deck
  deckAddError?: string
  exception?: Error
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
  const factionGetSpy = jest.spyOn(FactionStore, 'getByKey').mockResolvedValue(factionGetResponse || faction)
  const leaderGetSpy = jest.spyOn(LeaderStore, 'getById').mockResolvedValue(leaderGetResponse || leader)
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
  if (exception) {
    await expect(promise).rejects.toEqual(exception)
  } else {
    await expect(promise).resolves.toEqual(resolvedDeck)
  }

  expect(factionGetSpy.mock.calls).toEqual(
    factionGetCalls || [
      [
        {
          key: factionKey,
          logPrefix,
        },
      ],
    ]
  )
  expect(leaderGetSpy.mock.calls).toEqual(
    leaderGetCalls || [
      [
        {
          id: args.leader,
          logPrefix,
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
          [`${logPrefix} units: "${JSON.stringify([unit])}"`],
          [`${logPrefix} deckUnits: "${JSON.stringify(deckUnits)}"`],
          [`${logPrefix} deck: "${JSON.stringify(deck)}"`],
          [`${logPrefix} resolvedFaction: "${JSON.stringify(resolvedFaction)}"`],
        ]
      : []
  )
}
