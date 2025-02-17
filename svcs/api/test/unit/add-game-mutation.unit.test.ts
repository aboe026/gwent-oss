import { ObjectId } from 'mongodb'

import AddGameMutation from '../../src/graphql/resolvers/mutations/add-game-mutation'
import { Context } from '@gwent/graphql-schema/context'
import EventManager from '../../src/graphql/event-manager'
import { MutationAddGameArgs } from '@gwent/graphql-schema/resolver-typings'
import GameResolver from '../../src/graphql/resolvers/types/game-resolver'
import GameStore from '../../src/database/stores/game-store'
import { PLAYER_COUNTS, PubSubEvents } from '@gwent/constants'
import TestUtil from '../test-util'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserStore from '../../src/database/stores/user-store'

describe('add-game-mutation', () => {
  describe('addGame', () => {
    const userId = new ObjectId()
    const logPrefix = `addGame by "${userId}"`
    it('throws error if duplicate opponents', async () => {
      const error = 'Opponent(s) ["test"] are duplicates.'
      await testAddGame({
        creatorId: userId,
        opponentNames: ['test', 'test'],
        exception: Error(error),
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if creator listed with opponents', async () => {
      const error = 'Opponents cannot include self.'
      const creatorName = 'creator-name'
      await testAddGame({
        creatorId: userId,
        creatorName,
        opponentNames: [creatorName, 'test'],
        exception: Error(error),
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if not enough opponents', async () => {
      const error = `Not enough opponents at "0", minimum is "${PLAYER_COUNTS.Min - 1}".`
      await testAddGame({
        creatorId: userId,
        opponentNames: [],
        exception: Error(error),
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if too many opponents', async () => {
      const error = `Excessive opponent count of "2", maximum is "${PLAYER_COUNTS.Min - 1}".`
      await testAddGame({
        creatorId: userId,
        opponentNames: ['one', 'two'],
        exception: Error(error),
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('throws error if opponent does not exist', async () => {
      const opponent = 'opponent'
      const error = `User with name "${opponent}" does not exist.`
      await testAddGame({
        creatorId: userId,
        opponentNames: [opponent],
        exception: Error(error),
        getByNamesCalls: [[[opponent]]],
        warnCalls: [[`${logPrefix} failed: ${error}`]],
      })
    })
    it('returns resolved game if opponent exists', async () => {
      const creatorId = new ObjectId()
      const opponent = 'opponent'
      const user = TestUtil.getDbUser({
        name: 'opponent',
      })
      await testAddGame({
        creatorId,
        opponentNames: [user.name],
        getUserByNamesResponse: [user],
        addCalls: [
          [
            {
              creatorId,
              opponentIds: [user._id.toString()],
            },
          ],
        ],
        fromObjectCalled: true,
        getByNamesCalls: [[[opponent]]],
      })
    })
    it('logs to trace if enabled', async () => {
      const opponent = 'opponent'
      const user = TestUtil.getDbUser({
        name: 'opponent',
      })
      await testAddGame({
        creatorId: userId,
        opponentNames: [user.name],
        getUserByNamesResponse: [user],
        addCalls: [
          [
            {
              creatorId: userId,
              opponentIds: [user._id.toString()],
            },
          ],
        ],
        fromObjectCalled: true,
        getByNamesCalls: [[[opponent]]],
        logPrefix,
        traceEnabled: true,
      })
    })
  })
})

async function testAddGame({
  creatorId,
  creatorName,
  opponentNames,
  getUserByNamesResponse = [],
  exception,
  addCalls = [],
  fromObjectCalled,
  getByNamesCalls = [],
  logPrefix,
  traceEnabled,
  warnCalls = [],
  errorCalls = [],
}: {
  creatorId?: ObjectId
  creatorName?: string
  opponentNames: string[]
  getUserByNamesResponse?: UserDbObject[]
  exception?: Error
  addCalls?: any[][]
  fromObjectCalled?: boolean
  getByNamesCalls?: any[][]
  logPrefix?: string
  traceEnabled?: boolean
  warnCalls?: any[][]
  errorCalls?: any[][]
}) {
  const user = TestUtil.getUser({
    id: creatorId,
    name: creatorName,
  })
  const context: Context = {
    session: {},
  }
  if (creatorId && context.session) {
    context.session.user = TestUtil.getDbUser({
      id: creatorId,
      name: creatorName,
    })
  }
  const args: MutationAddGameArgs = {
    opponentNames,
  }
  const game = TestUtil.getDbGame({
    creator: creatorId,
  })
  const resolvedGame = TestUtil.getGameFromDbGame({
    game,
    creator: user,
  })
  const getByNamesSpy = jest.spyOn(UserStore, 'getByNames').mockResolvedValue(getUserByNamesResponse)
  const addSpy = jest.spyOn(GameStore, 'add').mockResolvedValue(game)
  const fromObjectSpy = jest.spyOn(GameResolver, 'fromObject').mockResolvedValue(resolvedGame)
  const publishSpy = jest.spyOn(EventManager.pubsub, 'publish').mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  AddGameMutation['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  const promise = AddGameMutation.addGame(args, context, null as any)
  if (exception) {
    await expect(promise).rejects.toThrow(exception)
  } else {
    await expect(promise).resolves.toEqual(resolvedGame)
  }

  expect(getByNamesSpy.mock.calls).toEqual(getByNamesCalls)
  expect(addSpy.mock.calls).toEqual(addCalls)
  expect(fromObjectSpy.mock.calls).toEqual(
    fromObjectCalled
      ? [
          [
            {
              game: game,
              users: getUserByNamesResponse.map((dbUser) => TestUtil.getUserFromDbUser(dbUser)),
            },
          ],
        ]
      : []
  )
  expect(publishSpy.mock.calls).toEqual(
    fromObjectCalled
      ? [
          [
            PubSubEvents.GameAdded,
            {
              gameAdded: resolvedGame,
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
              opponentNames,
            })}"`,
          ],
          [`${logPrefix} requested fields: "[]"`],
          [`${logPrefix} requested arguments: "[]"`],
          [`${logPrefix} opponents: "${JSON.stringify(getUserByNamesResponse)}"`],
          [
            `${logPrefix} resolvedOpponents: "${JSON.stringify(
              getUserByNamesResponse.map((opponent) => TestUtil.getUserFromDbUser(opponent))
            )}"`,
          ],
          [`${logPrefix} game: "${JSON.stringify(game)}"`],
        ]
      : []
  )
}
