import { ObjectId } from 'mongodb'

import AddDeckValidation from '../../src/graphql/resolvers/mutations/add-deck/add-deck-validation'
import { Context } from '@gwent/graphql-schema/context'
import { DeckUnit, FactionKey, MutationAddDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import { FactionDbObject, LeaderDbObject, UnitDbObject, UserDbObject } from '@gwent/graphql-schema/database-typings'
import FactionStore from '../../src/database/stores/faction-store'
import LeaderStore from '../../src/database/stores/leader-store'
import Permissions from '../../src/graphql/permissions'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'
import UnitStore from '../../src/database/stores/unit-store'
import { ValidateDeck } from '@gwent/validators'

describe('add-deck-validation', () => {
  const user = TestUtil.getDbUser({})
  const faction = TestUtil.getDbFaction({})
  const leader = TestUtil.getDbLeader({
    faction: faction._id,
  })
  const units = [
    TestUtil.getDbUnit({}),
    TestUtil.getDbUnit({
      images: ['unit-2-image-1', 'unit-2-image-2'],
    }),
  ]
  const deckUnits = [
    TestUtil.getDeckUnit({
      unit: TestUtil.getUnitFromDbUnit({
        unit: units[0],
      }),
      artStyle: 1,
    }),
    TestUtil.getDeckUnit({
      unit: TestUtil.getUnitFromDbUnit({
        unit: units[1],
      }),
      artStyle: 2,
    }),
  ]
  const logPrefix = `addDeck by "${user._id}"`
  const args: MutationAddDeckArgs = {
    faction: faction.key as FactionKey,
    leader: leader._id.toString(),
    name: 'deck-name',
    units: [
      {
        id: units[0]._id.toString(),
      },
      {
        id: units[1]._id.toString(),
        artStyle: deckUnits[1].artStyle,
      },
    ],
  }
  it('throws error if isAuthenticated throws error', async () => {
    const error = 'context user error'
    await testAddDeckValidation({
      args,
      isAuthenticatedResponse: Error(error),
      error: Error(error),
    })
  })
  it('throws error if verifyMongoIds throws error on leader id', async () => {
    const error = 'bad leader id'
    await testAddDeckValidation({
      args,
      isAuthenticatedResponse: user,
      verifyMongoIdsLeaderError: Error(error),
      error: Error(error),
    })
  })
  it('throws error if verifyMongoIds throws error on unit ids', async () => {
    const error = 'bad unit ids'
    await testAddDeckValidation({
      args,
      isAuthenticatedResponse: user,
      verifyMongoIdsUnitError: Error(error),
      error: Error(error),
    })
  })
  it('throws error if faction is NEUTRAL', async () => {
    const message = `Faction "${FactionKey.Neutral}" not allowed.`
    await testAddDeckValidation({
      args: {
        ...args,
        faction: FactionKey.Neutral,
      },
      isAuthenticatedResponse: user,
      error: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if FactionStore getByKey throws error', async () => {
    const message = 'error from FactionStore getByKey'
    await testAddDeckValidation({
      args,
      isAuthenticatedResponse: user,
      factionGetError: Error(message),
      error: Error(message),
    })
  })
  it('throws error if LeaderStore getById throws error', async () => {
    const message = 'error from LeaderStore getById'
    await testAddDeckValidation({
      args,
      isAuthenticatedResponse: user,
      faction,
      leaderGetError: Error(message),
      error: Error(message),
    })
  })
  it('throws error if leader faction does not match faction', async () => {
    const invalidFactionId = new ObjectId()
    const message = `Faction ID "${invalidFactionId}" for leader "${leader._id}" does not match deck faction ID "${faction._id}".`
    await testAddDeckValidation({
      args,
      isAuthenticatedResponse: user,
      faction,
      leader: {
        ...leader,
        faction: invalidFactionId,
      },
      error: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if first unit does not exist', async () => {
    const message = `Unit with ID "${units[0]._id}" does not exist.`
    await testAddDeckValidation({
      args,
      isAuthenticatedResponse: user,
      faction,
      leader,
      units: [units[1]],
      error: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if last unit does not exist', async () => {
    const message = `Unit with ID "${units[1]._id}" does not exist.`
    await testAddDeckValidation({
      args,
      isAuthenticatedResponse: user,
      faction,
      leader,
      units: [units[0]],
      error: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if no units exist', async () => {
    const message = `Unit with ID "${units[0]._id}" does not exist.\nUnit with ID "${units[1]._id}" does not exist.`
    await testAddDeckValidation({
      args,
      isAuthenticatedResponse: user,
      faction,
      leader,
      units: [],
      error: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if validateDeck throws single error', async () => {
    const message = 'validateDeck single error'
    await testAddDeckValidation({
      args,
      isAuthenticatedResponse: user,
      faction,
      leader,
      units,
      deckUnits,
      validateDeckResponse: [message],
      error: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('returns objects if no errors', async () => {
    await testAddDeckValidation({
      args,
      isAuthenticatedResponse: user,
      faction,
      leader,
      units,
      deckUnits,
    })
  })
  it('logs to trace if enabled', async () => {
    await testAddDeckValidation({
      args,
      isAuthenticatedResponse: user,
      faction,
      leader,
      units,
      deckUnits,
      traceEnabled: true,
      traceCalls: [
        [`${logPrefix} units: "${JSON.stringify(units)}"`],
        [`${logPrefix} deckUnits: "${JSON.stringify(deckUnits)}"`],
      ],
    })
  })
})

async function testAddDeckValidation({
  args,
  faction,
  leader,
  units,
  deckUnits,
  isAuthenticatedResponse = TestUtil.getDbUser({}),
  verifyMongoIdsLeaderError,
  verifyMongoIdsUnitError,
  factionGetError,
  leaderGetError,
  validateDeckResponse = [],
  error,
  warnCalls = [],
  traceCalls = [],
  traceEnabled,
}: {
  args: MutationAddDeckArgs
  faction?: FactionDbObject
  leader?: LeaderDbObject
  units?: UnitDbObject[]
  deckUnits?: DeckUnit[]
  isAuthenticatedResponse: UserDbObject | Error
  verifyMongoIdsLeaderError?: Error
  verifyMongoIdsUnitError?: Error
  factionGetError?: Error
  leaderGetError?: Error
  validateDeckResponse?: string[]
  error?: Error
  warnCalls?: string[][]
  traceCalls?: string[][]
  traceEnabled?: boolean
}) {
  const logPrefix = `addDeck by "${isAuthenticatedResponse instanceof Error ? '' : isAuthenticatedResponse._id}"`
  const name = 'deck-name'
  const context: Context = {
    session: {
      user: isAuthenticatedResponse instanceof Error ? undefined : isAuthenticatedResponse,
    },
  }
  const isAuthenticatedSpy = jest.spyOn(Permissions, 'isAuthenticated').mockImplementation(() => {
    if (isAuthenticatedResponse instanceof Error) {
      throw isAuthenticatedResponse
    } else {
      return isAuthenticatedResponse
    }
  })
  const logRequestInfoSpy = jest.spyOn(ResolverUtil.prototype, 'logRequestInfo').mockImplementation()
  const verifyMongoIdsSpy = jest.spyOn(ResolverUtil.prototype, 'verifyMongoIds')
  if (verifyMongoIdsLeaderError) {
    verifyMongoIdsSpy.mockImplementationOnce(() => {
      throw verifyMongoIdsLeaderError
    })
  } else {
    verifyMongoIdsSpy.mockReturnValueOnce()
  }
  if (verifyMongoIdsUnitError) {
    verifyMongoIdsSpy.mockImplementationOnce(() => {
      throw verifyMongoIdsUnitError
    })
  } else {
    verifyMongoIdsSpy.mockReturnValueOnce()
  }
  const factionSpy = jest.spyOn(FactionStore, 'getByKey')
  if (factionGetError) {
    factionSpy.mockRejectedValue(factionGetError)
  } else if (faction) {
    factionSpy.mockResolvedValue(faction)
  }
  const leaderSpy = jest.spyOn(LeaderStore, 'getById')
  if (leaderGetError) {
    leaderSpy.mockRejectedValue(leaderGetError)
  } else if (leader) {
    leaderSpy.mockResolvedValue(leader)
  }
  const unitSpy = jest.spyOn(UnitStore, 'get')
  if (units) {
    unitSpy.mockResolvedValue(units)
  }
  const deckUnitsSpy = jest.spyOn(DeckUnitResolver, 'fromArray')
  if (deckUnits) {
    deckUnitsSpy.mockResolvedValue(deckUnits)
  }
  const validateDeckSpy = jest.spyOn(ValidateDeck, 'fromDeckUnits').mockReturnValue(validateDeckResponse)
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  AddDeckValidation['logger'] = {
    warn: warnSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = AddDeckValidation.addDeckValidation(args, context, null as any)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual({
      deckUnits,
      faction,
      leader,
      logPrefix,
      name,
      userId: isAuthenticatedResponse instanceof Error ? '' : isAuthenticatedResponse._id,
    })
  }

  expect(isAuthenticatedSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'addDeck mutation',
      },
    ],
  ])
  const verifyMongoIdsCalls: any[][] = []
  if (!(isAuthenticatedResponse instanceof Error)) {
    verifyMongoIdsCalls.push([
      {
        ids: [args.leader],
        label: 'Leader ID',
      },
    ])
    if (!verifyMongoIdsLeaderError) {
      verifyMongoIdsCalls.push([
        {
          ids: args.units.map((unit) => unit.id),
          label: 'Unit ID',
        },
      ])
    }
  }
  expect(logRequestInfoSpy.mock.calls).toEqual(
    isAuthenticatedResponse instanceof Error
      ? []
      : [
          [
            {
              args,
              info: null,
            },
          ],
        ]
  )
  expect(verifyMongoIdsSpy.mock.calls).toEqual(verifyMongoIdsCalls)
  expect(factionSpy.mock.calls).toEqual(
    faction || factionGetError
      ? [
          [
            {
              key: args.faction,
              logPrefix,
            },
          ],
        ]
      : []
  )
  expect(leaderSpy.mock.calls).toEqual(
    leader || leaderGetError
      ? [
          [
            {
              id: args.leader,
              logPrefix,
            },
          ],
        ]
      : []
  )
  expect(unitSpy.mock.calls).toEqual(
    units
      ? [
          [
            {
              ids: args.units.map((unit) => unit.id),
            },
          ],
        ]
      : []
  )
  expect(deckUnitsSpy.mock.calls).toEqual(
    deckUnits
      ? [
          [
            {
              deckUnits: deckUnits.map((unit) => {
                return {
                  artStyle: unit.artStyle,
                  unit: new ObjectId(unit.unit.id),
                }
              }),
            },
          ],
        ]
      : []
  )
  expect(validateDeckSpy.mock.calls).toEqual(
    deckUnits
      ? [
          [
            {
              deckUnits,
              faction: faction?.key,
            },
          ],
        ]
      : []
  )
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(traceCalls)
}
