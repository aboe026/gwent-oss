import AddGameValidation from '../../src/graphql/resolvers/mutations/add-game/add-game-validation'
import { Context } from '@gwent/graphql-schema/context'
import { MutationAddGameArgs, User } from '@gwent/graphql-schema/resolver-typings'
import { PLAYER_COUNTS } from '@gwent/constants'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'
import TestUtil from '../util/test-util'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserResolver from '../../src/graphql/resolvers/types/user-resolver'
import UserStore from '../../src/database/stores/user-store'

describe('add-game-validation', () => {
  const user = TestUtil.getDbUser({})
  const logPrefix = `addGame by "${user._id}"`
  it('throws error if getContextUser throws error', async () => {
    const message = 'getContextUserSpy error'
    await testAddGameValidation({
      getContextUserError: Error(message),
    })
  })
  it('throws error if duplicate opponentNames', async () => {
    const opponentNames = ['opponent-one', 'opponent-one']
    const message = `Opponent(s) ["${opponentNames[0]}"] are duplicates.`
    await testAddGameValidation({
      user,
      opponentNames,
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if opponentNames includes creator', async () => {
    const opponentNames = [user.name]
    const message = 'Opponents cannot include self.'
    await testAddGameValidation({
      user,
      opponentNames,
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if not enough opponents', async () => {
    const opponentNames: string[] = []
    const message = `Not enough opponents at "0", minimum is "${PLAYER_COUNTS.Min - 1}".`
    await testAddGameValidation({
      user,
      opponentNames,
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if too many opponents', async () => {
    const opponentNames = ['opponent-one', 'opponent-two']
    const message = `Excessive opponent count of "2", maximum is "${PLAYER_COUNTS.Max - 1}".`
    await testAddGameValidation({
      user,
      opponentNames,
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if opponent with name does not exist', async () => {
    const opponentNames = ['opponent-one']
    const message = `User with name "${opponentNames[0]}" does not exist.`
    await testAddGameValidation({
      user,
      opponentNames,
      opponents: [TestUtil.getDbUser({})],
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('returns objects if no errors', async () => {
    const opponentName = 'opponent-one'
    const opponent = TestUtil.getDbUser({
      name: opponentName,
    })
    await testAddGameValidation({
      user,
      opponentNames: [opponentName],
      opponents: [opponent],
      resolvedOpponents: [TestUtil.getUserFromDbUser(opponent)],
    })
  })
  it('logs to trace if enabled', async () => {
    const opponentName = 'opponent-one'
    const opponent = TestUtil.getDbUser({
      name: opponentName,
    })
    await testAddGameValidation({
      user,
      opponentNames: [opponentName],
      opponents: [opponent],
      resolvedOpponents: [TestUtil.getUserFromDbUser(opponent)],
      traceEnabled: true,
    })
  })
})

async function testAddGameValidation({
  user,
  opponentNames = [],
  opponents,
  resolvedOpponents,
  getContextUserError,
  expectedError,
  warnCalls = [],
  traceEnabled,
}: {
  user?: UserDbObject
  opponentNames?: string[]
  opponents?: UserDbObject[]
  resolvedOpponents?: User[]
  getContextUserError?: Error
  expectedError?: Error
  warnCalls?: string[][]
  traceEnabled?: boolean
}) {
  const logPrefix = `addGame by "${user?._id}"`
  const args: MutationAddGameArgs = {
    opponentNames,
  }
  const context: Context = {
    session: {
      user,
    },
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
  const userStoreGetByNamesSpy = jest.spyOn(UserStore, 'getByNames')
  if (opponents) {
    userStoreGetByNamesSpy.mockResolvedValue(opponents)
  }
  const userResolverFromObjectSpy = jest.spyOn(UserResolver, 'fromObject')
  if (resolvedOpponents) {
    for (const resolvedOpponent of resolvedOpponents) {
      userResolverFromObjectSpy.mockReturnValueOnce(resolvedOpponent)
    }
  }
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  AddGameValidation['logger'] = {
    warn: warnSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const error = expectedError || getContextUserError
  const promise = AddGameValidation.addGameValidation(args, context, null as any)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual({
      logPrefix,
      opponents: resolvedOpponents,
      userId: user?._id,
    })
  }

  expect(getContextUserSpy.mock.calls).toEqual([
    [
      {
        context,
        label: 'addGame mutation',
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
  expect(userStoreGetByNamesSpy.mock.calls).toEqual(opponents ? [[opponentNames]] : [])
  expect(userResolverFromObjectSpy.mock.calls).toEqual(resolvedOpponents ? [opponents] : [])
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`${logPrefix} opponents: "${JSON.stringify(opponents)}"`],
          [`${logPrefix} resolvedOpponents: "${JSON.stringify(resolvedOpponents)}"`],
        ]
      : []
  )
}
