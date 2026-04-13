import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import {
  FieldUnitDbObject,
  GameDbObject,
  GameStatus,
  GameUnitOrigin,
  ImpactDbObject,
  MoveDbObject,
  MoveReasonType,
  WeatherUnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import { GraphQLResolveInfo } from 'graphql'
import { MoveType } from '@gwent/graphql-schema'
import PresentableError from '../../src/util/presentable-error'
import { REDACTED } from '@gwent/constants'
import ResolverUtil, { GamePlayerResponse, MoveUsersAndUnits } from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'
import { Unit, User } from '@gwent/graphql-schema/resolver-typings'
import UnitResolver from '../../src/graphql/resolvers/types/unit-resolver'
import UserResolver from '../../src/graphql/resolvers/types/user-resolver'

describe('resolver-util', () => {
  describe('verifyMongoIds', () => {
    const label = 'test'
    const logPrefix = 'prefix'
    it('does not throw error if empty array', () => {
      testVerifyMongoIds({
        ids: [],
        label,
      })
    })
    it('throws error if single invalid id', () => {
      const id = 'invalid'
      const message = `${label} "${id}" not a valid MongoDB ObjectId.`
      testVerifyMongoIds({
        ids: [id],
        label,
        logPrefix,
        expected: new PresentableError(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if multiple invalid ids', () => {
      const id = 'invalid'
      const message = `${label} "${id}" not a valid MongoDB ObjectId.`
      testVerifyMongoIds({
        ids: [id, id],
        label,
        logPrefix,
        expected: new PresentableError(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('throws error if invalid id among valid', () => {
      const id = 'invalid'
      const message = `${label} "${id}" not a valid MongoDB ObjectId.`
      testVerifyMongoIds({
        ids: [new ObjectId().toString(), id, new ObjectId().toString()],
        label,
        logPrefix,
        expected: new PresentableError(message),
        warnCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('does not throw error if single valid id', () => {
      testVerifyMongoIds({
        ids: [new ObjectId().toString()],
        label,
      })
    })
    it('does not throw error if multiple valid ids', () => {
      testVerifyMongoIds({
        ids: [new ObjectId().toString(), new ObjectId().toString()],
        label,
      })
    })
  })
  describe('logRequestInfo', () => {
    it('does not log to trace if not enabled', () => {
      testLogRequestInfo({
        traceEnabled: false,
      })
    })
    it('logs single non secure field', () => {
      testLogRequestInfo({
        traceEnabled: true,
        args: {
          foo: 'bar',
        },
        argsPrintout: {
          foo: 'bar',
        },
      })
    })
    it('logs multiple non secure fields', () => {
      testLogRequestInfo({
        traceEnabled: true,
        args: {
          foo: 'bar',
          hello: 'world',
        },
        argsPrintout: {
          foo: 'bar',
          hello: 'world',
        },
      })
    })
    it('redacts single secure field', () => {
      testLogRequestInfo({
        traceEnabled: true,
        args: {
          foo: 'bar',
        },
        argsPrintout: {
          foo: REDACTED,
        },
        secureKeys: ['foo'],
      })
    })
    it('redacts multiple secure fields with keys in order', () => {
      testLogRequestInfo({
        traceEnabled: true,
        args: {
          foo: 'bar',
          hello: 'world',
        },
        argsPrintout: {
          foo: REDACTED,
          hello: REDACTED,
        },
        secureKeys: ['foo', 'hello'],
      })
    })
    it('redacts multiple secure fields with keys out of order', () => {
      testLogRequestInfo({
        traceEnabled: true,
        args: {
          foo: 'bar',
          hello: 'world',
        },
        argsPrintout: {
          foo: REDACTED,
          hello: REDACTED,
        },
        secureKeys: ['hello', 'foo'],
      })
    })
    it('redacts single secure fields with non secure field first', () => {
      testLogRequestInfo({
        traceEnabled: true,
        args: {
          foo: 'bar',
          hello: 'world',
        },
        argsPrintout: {
          foo: 'bar',
          hello: REDACTED,
        },
        secureKeys: ['hello'],
      })
    })
    it('redacts single secure fields with non secure field last', () => {
      testLogRequestInfo({
        traceEnabled: true,
        args: {
          foo: 'bar',
          hello: 'world',
        },
        argsPrintout: {
          foo: REDACTED,
          hello: 'world',
        },
        secureKeys: ['foo'],
      })
    })
  })
  describe('validateGame', () => {
    const userId = new ObjectId()
    const logPrefix = `playUnit by "${userId}"`
    it('returns error if game is wrong status', () => {
      const label = 'do something'
      const requiredStatus = GameStatus.Playing
      const actualStatus = GameStatus.Decking
      const message = `Invalid game status "${actualStatus}": Can only ${label} for game with status "${requiredStatus}".`
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
        ],
      })
      testValidateGame({
        game,
        userId,
        logPrefix,
        label,
        status: requiredStatus,
        expected: new PresentableError(message),
        warnCalls: [[`${logPrefix} getGamePlayer failed: ${message}`]],
      })
    })
    it('returns error if it is not users turn when required', () => {
      const label = 'do something'
      const message = `Cannot ${label} when it is not your turn.`
      testValidateGame({
        game: TestUtil.getDbGame({
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
            }),
          ],
        }),
        userId,
        logPrefix,
        label,
        turn: true,
        expected: new PresentableError(message),
        warnCalls: [[`${logPrefix} getGamePlayer failed: ${message}`]],
      })
    })
    it('does not throw error if no errors and no status or turn specified', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
        ],
      })
      testValidateGame({
        game,
        userId,
        logPrefix,
        expected: {
          game,
          player: game.players[0],
        },
      })
    })
    it('does not throw error if no errors and status and turn specified', () => {
      const game = TestUtil.getDbGame({
        players: [
          TestUtil.getDbGamePlayer({
            user: userId,
          }),
        ],
        status: GameStatus.Playing,
        turn: userId,
      })
      testValidateGame({
        game,
        userId,
        turn: true,
        status: GameStatus.Playing,
        logPrefix,
        expected: {
          game,
          player: game.players[0],
        },
      })
    })
  })
  describe('resolveUsersAndUnits', () => {
    const units = [
      TestUtil.getDbUnit({}),
      TestUtil.getDbUnit({}),
      TestUtil.getDbUnit({}),
      TestUtil.getDbUnit({}),
      TestUtil.getDbUnit({}),
      TestUtil.getDbUnit({}),
    ]
    const users = [
      TestUtil.getDbUser({}),
      TestUtil.getDbUser({}),
      TestUtil.getDbUser({}),
      TestUtil.getDbUser({}),
      TestUtil.getDbUser({}),
      TestUtil.getDbUser({}),
    ]
    const moves = [
      TestUtil.getDbMove({
        type: MoveType.Unit,
        unit: TestUtil.getDbTacoUnit({
          id: units[2]._id,
        }),
        reason: {
          type: MoveReasonType.Deploy,
          unit: TestUtil.getDbDeckUnit({
            id: units[3]._id,
          }),
        },
        source: {
          origin: GameUnitOrigin.Hand,
          user: users[0]._id,
        },
        impacts: [
          {
            unit: TestUtil.getDbTacoUnit({
              id: units[4]._id,
            }),
            user: users[1]._id,
            source: {
              origin: GameUnitOrigin.Hand,
              user: users[2]._id,
            },
          },
          {
            unit: TestUtil.getDbTacoUnit({
              id: units[5]._id,
            }),
            user: users[3]._id,
          },
        ],
      }),
      TestUtil.getDbMove({
        type: MoveType.Unit,
        unit: TestUtil.getDbTacoUnit({
          id: units[2]._id,
        }),
        reason: {
          type: MoveReasonType.Deploy,
          unit: TestUtil.getDbDeckUnit({
            id: units[3]._id,
          }),
        },
        source: {
          origin: GameUnitOrigin.Hand,
          user: users[0]._id,
        },
        impacts: [
          {
            unit: TestUtil.getDbTacoUnit({
              id: units[4]._id,
            }),
            user: users[1]._id,
            source: {
              origin: GameUnitOrigin.Hand,
              user: users[2]._id,
            },
          },
          {
            unit: TestUtil.getDbTacoUnit({
              id: units[5]._id,
            }),
            user: users[3]._id,
          },
        ],
      }),
      TestUtil.getDbMove({
        type: MoveType.Unit,
        unit: TestUtil.getDbTacoUnit({
          id: units[1]._id,
        }),
        target: users[5]._id,
      }),
      TestUtil.getDbMove({
        type: MoveType.Unit,
        unit: TestUtil.getDbTacoUnit({
          id: units[1]._id,
        }),
        target: users[5]._id,
      }),
      TestUtil.getDbMove({
        type: MoveType.Leader,
      }),
    ]
    it('returns empty arrays if presolved are empty arrays', async () => {
      await testresolveUsersAndUnits({
        presolvedUnits: [],
        presolvedUsers: [],
        expected: {
          units: [],
          users: [],
        },
      })
    })
    it('returns single item arrays if presolved are single items', async () => {
      const presolvedUnits = [TestUtil.getUnit({})]
      const presolvedUsers = [TestUtil.getUser({})]
      await testresolveUsersAndUnits({
        presolvedUnits,
        presolvedUsers,
        expected: {
          units: presolvedUnits,
          users: presolvedUsers,
        },
      })
    })
    it('does not resolve units or users in impact if presolved provided', async () => {
      const presolvedUnits = [TestUtil.getUnit({})]
      const presolvedUsers = [TestUtil.getUser({})]
      await testresolveUsersAndUnits({
        presolvedUnits,
        presolvedUsers,
        impacts: [
          {
            unit: TestUtil.getDbTacoUnit({
              id: new ObjectId(),
            }),
            user: new ObjectId(),
            source: {
              origin: GameUnitOrigin.Hand,
              user: new ObjectId(),
            },
          },
        ],
        expected: {
          units: presolvedUnits,
          users: presolvedUsers,
        },
      })
    })
    it('does not resolve units in impact if no unit', async () => {
      const presolvedUsers = [TestUtil.getUser({})]
      await testresolveUsersAndUnits({
        presolvedUsers,
        impacts: [
          {
            user: new ObjectId(),
            source: {
              origin: GameUnitOrigin.Hand,
              user: new ObjectId(),
            },
          },
        ],
        expected: {
          units: [],
          users: presolvedUsers,
        },
        unitsFromIdsCalls: [
          [
            {
              ids: [],
            },
          ],
        ],
      })
    })
    it('returns multiple item arrays if presolved are multiple items', async () => {
      const presolvedUnits = [TestUtil.getUnit({}), TestUtil.getUnit({})]
      const presolvedUsers = [TestUtil.getUser({}), TestUtil.getUser({})]
      await testresolveUsersAndUnits({
        presolvedUnits,
        presolvedUsers,
        expected: {
          units: presolvedUnits,
          users: presolvedUsers,
        },
      })
    })
    it('reaches out to resolve units and users', async () => {
      const usersSubset = [users[0], users[5], users[1], users[2], users[3]]
      const resolvedUnits = units.map((dbUnit) =>
        TestUtil.getUnitFromDbUnit({
          unit: dbUnit,
        })
      )
      const resolvedUsers = usersSubset.map((dbUser) => TestUtil.getUserFromDbUser(dbUser))
      await testresolveUsersAndUnits({
        fieldUnits: [
          TestUtil.getDbFieldUnit({
            id: units[0]._id,
          }),
          TestUtil.getDbFieldUnit({
            id: units[0]._id,
          }),
        ],
        weatherUnits: [
          TestUtil.getDbWeatherUnit({
            id: units[1]._id,
          }),
          TestUtil.getDbWeatherUnit({
            id: units[1]._id,
          }),
        ],
        moves,
        resolvedUnits,
        resolvedUsers,
        expected: {
          units: resolvedUnits,
          users: resolvedUsers,
        },
        unitsFromIdsCalls: [
          [
            {
              ids: units.map((unit) => unit._id.toString()),
            },
          ],
        ],
        usersFromIdsCalls: [[usersSubset.map((user) => user._id.toString())]],
      })
    })
    it('resolves userIds only if provided', async () => {
      const usersSubset = [users[4]]
      const resolvedUnits = units.map((dbUnit) =>
        TestUtil.getUnitFromDbUnit({
          unit: dbUnit,
        })
      )
      const resolvedUsers = usersSubset.map((dbUser) => TestUtil.getUserFromDbUser(dbUser))
      await testresolveUsersAndUnits({
        userIds: [users[4]._id, users[4]._id],
        fieldUnits: [
          TestUtil.getDbFieldUnit({
            id: units[0]._id,
          }),
          TestUtil.getDbFieldUnit({
            id: units[0]._id,
          }),
        ],
        weatherUnits: [
          TestUtil.getDbWeatherUnit({
            id: units[1]._id,
          }),
          TestUtil.getDbWeatherUnit({
            id: units[1]._id,
          }),
        ],
        moves,
        resolvedUnits,
        resolvedUsers,
        expected: {
          units: resolvedUnits,
          users: resolvedUsers,
        },
        unitsFromIdsCalls: [
          [
            {
              ids: units.map((unit) => unit._id.toString()),
            },
          ],
        ],
        usersFromIdsCalls: [[usersSubset.map((user) => user._id.toString())]],
      })
    })
    it('only resolves users if units presolved', async () => {
      const usersSubset = [users[0], users[5], users[1], users[2], users[3]]
      const resolvedUnits = units.map((dbUnit) =>
        TestUtil.getUnitFromDbUnit({
          unit: dbUnit,
        })
      )
      const resolvedUsers = usersSubset.map((dbUser) => TestUtil.getUserFromDbUser(dbUser))
      await testresolveUsersAndUnits({
        presolvedUnits: resolvedUnits,
        fieldUnits: [
          TestUtil.getDbFieldUnit({
            id: units[0]._id,
          }),
          TestUtil.getDbFieldUnit({
            id: units[0]._id,
          }),
        ],
        weatherUnits: [
          TestUtil.getDbWeatherUnit({
            id: units[1]._id,
          }),
          TestUtil.getDbWeatherUnit({
            id: units[1]._id,
          }),
        ],
        moves,
        resolvedUnits,
        resolvedUsers,
        expected: {
          units: resolvedUnits,
          users: resolvedUsers,
        },
        usersFromIdsCalls: [[usersSubset.map((user) => user._id.toString())]],
      })
    })
    it('only resolves units if users presolved', async () => {
      const usersSubset = [users[0], users[1], users[2], users[3]]
      const resolvedUnits = units.map((dbUnit) =>
        TestUtil.getUnitFromDbUnit({
          unit: dbUnit,
        })
      )
      const resolvedUsers = usersSubset.map((dbUser) => TestUtil.getUserFromDbUser(dbUser))
      await testresolveUsersAndUnits({
        presolvedUsers: resolvedUsers,
        fieldUnits: [
          TestUtil.getDbFieldUnit({
            id: units[0]._id,
          }),
          TestUtil.getDbFieldUnit({
            id: units[0]._id,
          }),
        ],
        weatherUnits: [
          TestUtil.getDbWeatherUnit({
            id: units[1]._id,
          }),
          TestUtil.getDbWeatherUnit({
            id: units[1]._id,
          }),
        ],
        moves,
        resolvedUnits,
        resolvedUsers,
        expected: {
          units: resolvedUnits,
          users: resolvedUsers,
        },
        unitsFromIdsCalls: [
          [
            {
              ids: units.map((unit) => unit._id.toString()),
            },
          ],
        ],
      })
    })
  })
})

function testVerifyMongoIds({
  ids,
  label,
  expected,
  logPrefix,
  warnCalls = [],
}: {
  ids: string[]
  label: string
  expected?: Error
  logPrefix?: string
  warnCalls?: string[][]
}) {
  const logger = getLogger('test')
  const warnSpy = jest.spyOn(logger, 'warn').mockImplementation()
  const resolverUtil = new ResolverUtil({
    logger,
    logPrefix,
  })

  if (expected) {
    expect(() =>
      resolverUtil.verifyMongoIds({
        ids,
        label,
      })
    ).toThrow(expected)
  } else {
    expect(
      resolverUtil.verifyMongoIds({
        ids,
        label,
      })
    ).toEqual(expected)
  }

  expect(warnSpy.mock.calls).toEqual(warnCalls)
}

function testLogRequestInfo({
  args,
  secureKeys,
  argsPrintout,
  traceEnabled = false,
}: {
  args?: any
  secureKeys?: string[]
  argsPrintout?: any
  traceEnabled?: boolean
}) {
  const info: GraphQLResolveInfo = {} as GraphQLResolveInfo
  const logPrefix = 'prefix'
  const logger = getLogger('test')
  const traceSpy = jest.spyOn(logger, 'trace').mockImplementation()
  jest.spyOn(logger, 'isTraceEnabled').mockReturnValue(traceEnabled)
  const resolverUtil = new ResolverUtil({
    logger,
    logPrefix,
  })

  expect(
    resolverUtil.logRequestInfo({
      args,
      info,
      secureKeys,
    })
  ).toEqual(undefined)

  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} args: "${JSON.stringify(argsPrintout)}"`],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
        ]
      : []
  )
}

function testValidateGame({
  game,
  userId,
  status,
  logPrefix,
  label,
  turn,
  expected,
  warnCalls = [],
}: {
  game: GameDbObject
  userId: ObjectId
  logPrefix: string
  status?: GameStatus
  label?: string
  turn?: boolean
  getStatusResponse?: GameStatus
  expected: GamePlayerResponse | PresentableError
  warnCalls?: string[][]
}) {
  const logger = getLogger('test')
  const warnSpy = jest.spyOn(logger, 'warn').mockImplementation()
  const resolverUtil = new ResolverUtil({
    logger,
    logPrefix,
  })

  if (expected instanceof PresentableError) {
    expect(() =>
      resolverUtil.validateGame({
        game,
        userId,
        status,
        label,
        turn,
      })
    ).toThrow(expected)
  } else {
    expect(
      resolverUtil.validateGame({
        game,
        userId,
        status,
        label,
        turn,
      })
    ).toEqual(undefined)
  }

  expect(warnSpy.mock.calls).toEqual(warnCalls)
}

async function testresolveUsersAndUnits({
  moves,
  impacts,
  userIds,
  fieldUnits,
  weatherUnits,
  presolvedUsers,
  presolvedUnits,
  resolvedUnits,
  resolvedUsers,
  expected,
  unitsFromIdsCalls = [],
  usersFromIdsCalls = [],
}: {
  moves?: MoveDbObject[]
  impacts?: ImpactDbObject[]
  userIds?: (ObjectId | string)[]
  fieldUnits?: FieldUnitDbObject[]
  weatherUnits?: WeatherUnitDbObject[]
  presolvedUsers?: User[]
  presolvedUnits?: Unit[]
  resolvedUsers?: User[]
  resolvedUnits?: Unit[]
  expected: MoveUsersAndUnits
  unitsFromIdsCalls?: any[][]
  usersFromIdsCalls?: any[][]
}) {
  const unitsFromIdsSpy = jest.spyOn(UnitResolver, 'fromIds')
  if (resolvedUnits) {
    unitsFromIdsSpy.mockResolvedValue(resolvedUnits)
  }
  const usersFromIdsSpy = jest.spyOn(UserResolver, 'fromIds')
  if (resolvedUsers) {
    usersFromIdsSpy.mockResolvedValue(resolvedUsers)
  }

  await expect(
    ResolverUtil.resolveUsersAndUnits({
      fieldUnits,
      weatherUnits,
      impacts,
      moves,
      presolvedUnits,
      presolvedUsers,
      userIds,
    })
  ).resolves.toEqual(expected)

  expect(unitsFromIdsSpy.mock.calls).toEqual(unitsFromIdsCalls)
  expect(usersFromIdsSpy.mock.calls).toEqual(usersFromIdsCalls)
}
