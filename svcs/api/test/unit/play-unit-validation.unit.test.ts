import { Combat, MutationPlayUnitArgs } from '@gwent/graphql-schema/resolver-typings'
import { Context } from '@gwent/graphql-schema/context'
import {
  DeckUnitDbObject,
  GameDbObject,
  GameStatus,
  UnitDbObject,
  UserDbObject,
} from '@gwent/graphql-schema/database-typings'
import PlayUnitValidation from '../../src/graphql/resolvers/mutations/play-unit/play-unit-validation'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'
import UnitStore from '../../src/database/stores/unit-store'

describe('play-unit-validation', () => {
  const user = TestUtil.getDbUser({})
  it('throws error if getContextUser throws error', async () => {
    const error = Error('getContextUser error')
    await testPlayUnitValidation({
      getContextUserError: error,
      expectedError: error,
    })
  })
  it('throws error if verifyMongoIds throws error', async () => {
    const error = Error('verifyMongoIds error')
    await testPlayUnitValidation({
      user,
      verifyMongoIdsError: error,
      expectedError: error,
    })
  })
  it('throws error if getGamePlayer throws error', async () => {
    const error = Error('getGamePlayer error')
    await testPlayUnitValidation({
      user,
      game: TestUtil.getDbGame({}),
      getGamePlayerError: error,
      expectedError: error,
    })
  })
  it('throws error if unit is not in hand', async () => {
    const deckUnit = TestUtil.getDbDeckUnit({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({}),
        }),
      ],
    })
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    const message = 'Unit not in hand.'
    await testPlayUnitValidation({
      user,
      game,
      unitId: deckUnit.unit.toString(),
      logPrefix,
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if unit is in hand more than once', async () => {
    const deckUnit = TestUtil.getDbDeckUnit({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            hand: [deckUnit, deckUnit],
          }),
        }),
      ],
    })
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    const message = `Found more than 1 unit with ID "${deckUnit.unit}"`
    await testPlayUnitValidation({
      user,
      game,
      unitId: deckUnit.unit.toString(),
      logPrefix,
      expectedError: Error(`${message}.`),
      errorCalls: [[`${logPrefix} failed: ${message}: "${JSON.stringify([deckUnit, deckUnit])}"`]],
    })
  })
  it('throws error if unit does not exist', async () => {
    const deckUnit = TestUtil.getDbDeckUnit({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            hand: [deckUnit],
          }),
        }),
      ],
    })
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    const message = 'Unit does not exist.'
    await testPlayUnitValidation({
      user,
      game,
      unitId: deckUnit.unit.toString(),
      units: [],
      logPrefix,
      expectedError: Error(message),
      errorCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if unit exists more than once', async () => {
    const deckUnit = TestUtil.getDbDeckUnit({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            hand: [deckUnit],
          }),
        }),
      ],
    })
    const unit = TestUtil.getDbUnit({
      id: deckUnit.unit,
    })
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    const message = `Found multiple units with ID "${deckUnit.unit}"`
    await testPlayUnitValidation({
      user,
      game,
      unitId: deckUnit.unit.toString(),
      units: [unit, unit],
      logPrefix,
      expectedError: Error(`${message}.`),
      errorCalls: [[`${logPrefix} failed: ${message}: "${JSON.stringify([unit, unit])}"`]],
    })
  })
  it('throws error if not combats specified and unit has multiple combats', async () => {
    const deckUnit = TestUtil.getDbDeckUnit({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            hand: [deckUnit],
          }),
        }),
      ],
    })
    const unit = TestUtil.getDbUnit({
      id: deckUnit.unit,
      combats: [Combat.Close, Combat.Ranged],
    })
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    const message = `Must specify combat: One of "${JSON.stringify(unit.combats)}".`
    await testPlayUnitValidation({
      user,
      game,
      unitId: deckUnit.unit.toString(),
      units: [unit],
      logPrefix,
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if combat specified does not match unit combats', async () => {
    const deckUnit = TestUtil.getDbDeckUnit({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            hand: [deckUnit],
          }),
        }),
      ],
    })
    const unit = TestUtil.getDbUnit({
      id: deckUnit.unit,
      combats: [Combat.Close, Combat.Ranged],
    })
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    const message = `Combat "${Combat.Siege}" does match unit combats of "${JSON.stringify(unit.combats)}".`
    await testPlayUnitValidation({
      user,
      game,
      unitId: deckUnit.unit.toString(),
      combat: Combat.Siege,
      units: [unit],
      logPrefix,
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if no combat specified and unit does not have combats', async () => {
    const deckUnit = TestUtil.getDbDeckUnit({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            hand: [deckUnit],
          }),
        }),
      ],
    })
    const unit = TestUtil.getDbUnit({
      id: deckUnit.unit,
    })
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    const message = 'Must specify combat.'
    await testPlayUnitValidation({
      user,
      game,
      unitId: deckUnit.unit.toString(),
      units: [unit],
      logPrefix,
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('returns objects if no errors and no combat specified for unit with single combat', async () => {
    const deckUnit = TestUtil.getDbDeckUnit({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            hand: [deckUnit],
          }),
        }),
      ],
    })
    const unit = TestUtil.getDbUnit({
      id: deckUnit.unit,
      combats: [Combat.Ranged],
    })
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    await testPlayUnitValidation({
      user,
      game,
      unitId: deckUnit.unit.toString(),
      units: [unit],
      logPrefix,
      expectedCombat: Combat.Ranged,
      expectedDeckUnit: deckUnit,
    })
  })
  it('returns objects if no errors and combat specified for unit with multiple combats', async () => {
    const deckUnit = TestUtil.getDbDeckUnit({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            hand: [deckUnit],
          }),
        }),
      ],
    })
    const unit = TestUtil.getDbUnit({
      id: deckUnit.unit,
      combats: [Combat.Ranged, Combat.Siege],
    })
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    await testPlayUnitValidation({
      user,
      game,
      unitId: deckUnit.unit.toString(),
      combat: Combat.Siege,
      units: [unit],
      logPrefix,
      expectedCombat: Combat.Siege,
      expectedDeckUnit: deckUnit,
    })
  })
  it('logs to trace if enabled', async () => {
    const deckUnit = TestUtil.getDbDeckUnit({})
    const game = TestUtil.getDbGame({
      players: [
        TestUtil.getDbGamePlayer({
          deck: TestUtil.getDbGameDeck({
            hand: [deckUnit],
          }),
        }),
      ],
    })
    const unit = TestUtil.getDbUnit({
      id: deckUnit.unit,
      combats: [Combat.Ranged],
    })
    const logPrefix = `playUnit by "${user._id}" for unit "${deckUnit.unit}" on game "${game._id}"`
    await testPlayUnitValidation({
      user,
      game,
      unitId: deckUnit.unit.toString(),
      units: [unit],
      logPrefix,
      expectedCombat: Combat.Ranged,
      expectedDeckUnit: deckUnit,
      traceEnabled: true,
    })
  })
})

async function testPlayUnitValidation({
  user,
  game,
  unitId = '',
  units,
  combat,
  logPrefix,
  getContextUserError,
  verifyMongoIdsError,
  getGamePlayerError,
  expectedError,
  expectedCombat,
  expectedDeckUnit,
  errorCalls = [],
  warnCalls = [],
  traceEnabled,
}: {
  user?: UserDbObject
  game?: GameDbObject
  unitId?: string
  units?: UnitDbObject[]
  combat?: Combat
  logPrefix?: string
  getContextUserError?: Error
  verifyMongoIdsError?: Error
  getGamePlayerError?: Error
  expectedError?: Error
  expectedCombat?: Combat
  expectedDeckUnit?: DeckUnitDbObject
  errorCalls?: string[][]
  warnCalls?: string[][]
  traceEnabled?: boolean
}) {
  const context: Context = {
    session: {
      user,
    },
  }
  const args: MutationPlayUnitArgs = {
    game: (game?._id || '').toString(),
    unit: unitId,
    combat,
  }
  const getContextUserSpy = jest.spyOn(ResolverUtil.prototype, 'getContextUser')
  if (getContextUserError) {
    getContextUserSpy.mockImplementation(() => {
      throw getContextUserError
    })
  } else if (user) {
    getContextUserSpy.mockReturnValue(user)
  }

  const logRequestInfoSpy = jest.spyOn(ResolverUtil.prototype, 'logRequestInfo').mockImplementation()
  const verifyMongoIdsSpy = jest.spyOn(ResolverUtil.prototype, 'verifyMongoIds')
  verifyMongoIdsSpy.mockImplementation(() => {
    if (verifyMongoIdsError) {
      throw verifyMongoIdsError
    }
  })
  const getGamePlayerSpy = jest.spyOn(ResolverUtil.prototype, 'getGamePlayer')
  if (getGamePlayerError) {
    getGamePlayerSpy.mockRejectedValue(getGamePlayerError)
  } else if (game) {
    getGamePlayerSpy.mockResolvedValue({
      game,
      player: game?.players[0],
    })
  }
  const unitStoreGetSpy = jest.spyOn(UnitStore, 'get')
  if (units) {
    unitStoreGetSpy.mockResolvedValue(units)
  }
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  PlayUnitValidation['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = PlayUnitValidation.playUnitValidation(args, context, null as any)
  if (expectedError) {
    await expect(promise).rejects.toThrow(expectedError)
  } else {
    await expect(promise).resolves.toEqual({
      combat: expectedCombat,
      deckUnit: expectedDeckUnit,
      game,
      logPrefix,
      unit: units && units[0],
    })
  }

  expect(getContextUserSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'playUnit mutation',
      },
    ],
  ])
  expect(logRequestInfoSpy.mock.calls).toEqual(
    getContextUserError
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
  expect(verifyMongoIdsSpy.mock.calls).toEqual(
    getContextUserError
      ? []
      : [
          [
            {
              ids: [unitId],
              label: 'Unit ID',
            },
          ],
        ]
  )
  expect(getGamePlayerSpy.mock.calls).toEqual(
    game || getGamePlayerError
      ? [
          [
            {
              gameId: game?._id.toString(),
              userId: user?._id,
              status: GameStatus.Playing,
              turn: true,
              label: 'play units',
            },
          ],
        ]
      : []
  )
  expect(unitStoreGetSpy.mock.calls).toEqual(
    units
      ? [
          [
            {
              ids: [unitId],
            },
          ],
        ]
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`${logPrefix} units: "${JSON.stringify(units)}"`]] : [])
}
