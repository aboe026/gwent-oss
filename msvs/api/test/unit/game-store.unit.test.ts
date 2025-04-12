import { Document, Filter, FindOptions, ObjectId, UpdateFilter } from 'mongodb'

import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../src/database/stores/game-store'
import TestUtil from '../util/test-util'

describe('game-store', () => {
  describe('add', () => {
    it('calls out to create method with game information', async () => {
      await testAddGame({
        creatorId: new ObjectId(),
        opponentIds: [new ObjectId()],
      })
    })
    it('logs to trace if enabled', async () => {
      await testAddGame({
        creatorId: new ObjectId(),
        opponentIds: [new ObjectId()],
        traceEnabled: true,
      })
    })
  })
  describe('getById', () => {
    it('calls out to read method and returns undefined if no result', async () => {
      await testGetById({
        readResponse: undefined,
        expected: undefined,
      })
    })
    it('calls out to read method and returns undefined if empty result', async () => {
      await testGetById({
        readResponse: [],
        expected: undefined,
      })
    })
    it('calls out to read method and returns game if one exists', async () => {
      const game = TestUtil.getDbGame({})
      await testGetById({
        id: game._id,
        readResponse: [game],
        expected: game,
      })
    })
    it('calls out to read method with options', async () => {
      const game = TestUtil.getDbGame({})
      await testGetById({
        id: game._id,
        readResponse: [game],
        expected: game,
        options: {
          sort: {
            created: 1,
            _id: 1,
          },
        },
      })
    })
    it('calls out to read method and throws error if more than 1 game exists', async () => {
      const game = TestUtil.getDbGame({})
      await testGetById({
        id: game._id,
        readResponse: [game, game],
        error: `Multiple games with ID "${game._id}" found.`,
        errorCalls: [[`Multiple games with ID "${game._id}" found: "${JSON.stringify([game, game])}"`]],
      })
    })
    it('logs to trace if enabled', async () => {
      const game = TestUtil.getDbGame({})
      await testGetById({
        id: game._id,
        readResponse: [game],
        expected: game,
        traceEnabled: true,
      })
    })
  })
  describe('getByUserId', () => {
    it('calls out to read method and returns result if id string', async () => {
      await testGetByUserId({
        userId: new ObjectId().toString(),
      })
    })
    it('calls out to read method and returns result if id ObjectId', async () => {
      await testGetByUserId({
        userId: new ObjectId(),
      })
    })
    it('logs to trace if enabled', async () => {
      await testGetByUserId({
        userId: new ObjectId(),
        traceEnabled: true,
      })
    })
  })
  describe('save', () => {
    it('calls out to update with incremented updated field', async () => {
      await testSave({})
    })
    it('logs out info if trace enabled', async () => {
      await testSave({
        traceEnabled: true,
      })
    })
  })
})

async function testAddGame({
  creatorId,
  opponentIds,
  traceEnabled,
}: {
  creatorId: ObjectId | string
  opponentIds: (ObjectId | string)[]
  traceEnabled?: boolean
}) {
  const created = new Date()
  const expected = TestUtil.getDbGame({
    created,
    creator: creatorId,
    players: [creatorId, ...opponentIds].map((playerId) =>
      TestUtil.getDbGamePlayer({
        deck: TestUtil.getDbGameDeck({
          from: null as any,
        }),
        user: playerId,
      })
    ),
    updated: created,
  })
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GameStore['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => created)
  const createSpy = jest.spyOn(GameStore as any, 'create').mockResolvedValue(expected)

  await expect(
    GameStore.add({
      creatorId,
      opponentIds,
    })
  ).resolves.toEqual(expected)

  expect(dateSpy.mock.calls).toEqual([[]])
  const createExpected = {
    ...expected,
  } as any
  delete createExpected._id
  expect(createSpy.mock.calls).toEqual([[createExpected]])
  expect(debugSpy.mock.calls).toEqual([[`Adding game by creator "${creatorId}"`]])
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`Adding game: "${JSON.stringify(createExpected)}"`]] : [])
}

async function testGetById({
  id,
  options,
  readResponse,
  expected,
  error,
  errorCalls = [],
  traceEnabled,
}: {
  id?: ObjectId
  options?: FindOptions
  readResponse?: GameDbObject[]
  expected?: GameDbObject
  error?: string
  errorCalls?: any[][]
  traceEnabled?: boolean
}) {
  if (!id) {
    id = new ObjectId()
  }
  const readSpy = jest.spyOn(GameStore as any, 'read').mockResolvedValue(readResponse)
  const errorSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GameStore['logger'] = {
    error: errorSpy,
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  const promise = GameStore.getById({
    id,
    options,
  })
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }
  const filter: Filter<Document> = {
    _id: id,
  }

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter,
        options,
      },
    ],
  ])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual([[`Getting game by ID "${id}"`]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`getById filter for ID "${id}": "${JSON.stringify(filter)}"`],
          [`getById options for ID "${id}": "${JSON.stringify(options)}"`],
        ]
      : []
  )
}

async function testGetByUserId({ userId, traceEnabled }: { userId: ObjectId | string; traceEnabled?: boolean }) {
  const game = TestUtil.getDbGame({})
  const readSpy = jest.spyOn(GameStore as any, 'read').mockResolvedValue([game])
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  GameStore['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any
  const filter: Filter<Document> = {
    'players.user': new ObjectId(userId),
  }

  await expect(GameStore.getByUserId(userId)).resolves.toEqual([game])

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter,
      },
    ],
  ])
  expect(debugSpy.mock.calls).toEqual([[`Getting games for userId "${userId}"`]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled ? [[`getByUserId filter for userId "${userId}": "${JSON.stringify(filter)}"`]] : []
  )
}

async function testSave({ traceEnabled }: { traceEnabled?: boolean }) {
  const game = TestUtil.getDbGame({})
  const updated = new Date()
  const udatedGame: GameDbObject = {
    ...game,
    updated,
  }
  const traceSpy = jest.fn().mockImplementation()
  GameStore['logger'] = {
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => updated)
  const updateSpy = jest.spyOn(GameStore as any, 'update').mockResolvedValue(udatedGame)
  const filter: Filter<Document> = {
    _id: new ObjectId(game._id),
    updated: game.updated,
  }
  const update: UpdateFilter<Document> = {
    $set: {
      ...game,
      updated,
    },
  }

  await expect(GameStore.save(game)).resolves.toEqual(udatedGame)

  expect(updateSpy.mock.calls).toEqual([
    [
      {
        filter,
        update,
        verifyExistence: false,
      },
    ],
  ])
  expect(dateSpy.mock.calls).toEqual([[]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [`save on game "${game._id}" filter: "${JSON.stringify(filter)}"`],
          [`save on game "${game._id}" update: "${JSON.stringify(update)}"`],
        ]
      : []
  )
}
