import { FindOptions, ObjectId } from 'mongodb'

import { DeckDbObject } from '@gwent/graphql-schema/database-typings'
import DeckStore, { AddDeckUnitInput } from '../../src/database/stores/deck-store'
import Store from '../../src/database/stores/store'
import TestUtil from '../util/test-util'

describe('deck-store', () => {
  describe('add', () => {
    it('throws special error if duplicate deck', async () => {
      const name = 'duplicate-error'
      const userId = new ObjectId()
      const error = `Deck with name "${name}" already exists for user "${userId}"`
      await testAdd({
        name,
        userId,
        error: Error(error),
        isMongoError: true,
        warnCalls: [[error]],
      })
    })
    it('throws error if not duplicate', async () => {
      const name = 'non-duplicate-error'
      const userId = new ObjectId()
      const error = 'Network timeout'
      await testAdd({
        name,
        userId,
        error: Error(error),
        isMongoError: false,
        errorCalls: [[`Error adding deck for user "${userId}": ${Error(error)}`]],
      })
    })
    it('calls out to create method with deck information if no error', async () => {
      await testAdd({})
    })
    it('logs to trace if enabled', async () => {
      await testAdd({
        traceEnabled: true,
      })
    })
  })
  describe('get', () => {
    it('calls to read with user id string', async () => {
      const userId = new ObjectId().toString()
      await testGet({
        userId,
        deckReadResponse: [
          TestUtil.getDbDeck({
            user: userId,
          }),
        ],
      })
    })
    it('calls to read with user id ObjectId', async () => {
      const userId = new ObjectId()
      await testGet({
        userId,
        deckReadResponse: [
          TestUtil.getDbDeck({
            user: userId,
          }),
        ],
      })
    })
    it('logs to trace if enabled', async () => {
      const userId = new ObjectId()
      await testGet({
        userId,
        deckReadResponse: [
          TestUtil.getDbDeck({
            user: userId,
          }),
        ],
        traceEnabled: true,
      })
    })
  })
  describe('getById', () => {
    it('throws error if multiple decks found', async () => {
      const deckId = new ObjectId()
      const decks: DeckDbObject[] = [
        TestUtil.getDbDeck({
          id: deckId,
        }),
        TestUtil.getDbDeck({
          id: deckId,
        }),
      ]
      await testGetById({
        id: deckId,
        deckReadResponse: decks,
        expected: Error(`Multiple decks with ID "${deckId}" found.`),
        errorCalls: [[`Multiple decks with ID "${deckId}" found: "${JSON.stringify(decks)}"`]],
      })
    })
    it('returns undefined if deck not found', async () => {
      await testGetById({
        deckReadResponse: [],
        expected: undefined,
      })
    })
    it('returns deck if found with ObjectId', async () => {
      const deck = TestUtil.getDbDeck({})
      await testGetById({
        id: deck._id,
        deckReadResponse: [deck],
        expected: deck,
      })
    })
    it('returns deck if found with string', async () => {
      const deck = TestUtil.getDbDeck({})
      await testGetById({
        id: deck._id.toString(),
        deckReadResponse: [deck],
        expected: deck,
      })
    })
    it('logs to trace if enabled', async () => {
      const deck = TestUtil.getDbDeck({})
      await testGetById({
        id: deck._id.toString(),
        deckReadResponse: [deck],
        expected: deck,
        traceEnabled: true,
      })
    })
  })
})

async function testAdd({
  name = 'deck-name',
  userId = new ObjectId(),
  error,
  traceEnabled,
  isMongoError = false,
  warnCalls = [],
  errorCalls = [],
}: {
  name?: string
  userId?: ObjectId
  error?: Error
  traceEnabled?: boolean
  isMongoError?: boolean
  warnCalls?: (string | Error)[][]
  errorCalls?: (string | Error)[][]
}) {
  const deck = TestUtil.getDbDeck({
    user: userId,
  })
  const stats = TestUtil.getStats()
  const deckUnit: AddDeckUnitInput = {
    artStyle: 1,
    unit: new ObjectId(),
  }
  const created = new Date()
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => created)
  const createSpy = jest.spyOn(Store as any, 'create')
  if (error) {
    createSpy.mockRejectedValue(error)
  } else {
    createSpy.mockResolvedValue(deck)
  }
  const isMongoErrorSpy = jest.spyOn(DeckStore, 'isMongoError').mockReturnValue(isMongoError)
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  DeckStore['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  const promise = DeckStore.add({
    factionId: deck.faction.toString(),
    leaderId: deck.leader.toString(),
    name,
    stats,
    units: [
      {
        artStyle: deckUnit.artStyle,
        unit: deckUnit.unit.toString(),
      },
    ],
    userId: userId.toString(),
  })
  if (error) {
    await expect(promise).rejects.toThrow(
      new Error(
        error.message,
        isMongoError
          ? {
              cause: error,
            }
          : undefined
      )
    )
  } else {
    await expect(promise).resolves.toEqual(deck)
  }

  expect(dateSpy.mock.calls).toEqual([[]])
  expect(createSpy.mock.calls).toEqual([
    [
      {
        created,
        faction: deck.faction,
        leader: deck.leader,
        name,
        stats,
        units: [deckUnit as any],
        user: userId,
      },
    ],
  ])
  expect(isMongoErrorSpy.mock.calls).toEqual(
    error
      ? [
          [
            {
              error,
              code: 11000,
            },
          ],
        ]
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(debugSpy.mock.calls).toEqual([[`Adding deck named "${name}" for user "${userId}"`]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `Adding deck: "${JSON.stringify({
              created,
              faction: deck.faction,
              leader: deck.leader,
              name,
              stats,
              units: [deckUnit as any],
              user: userId,
            })}"`,
          ],
        ]
      : []
  )
}

async function testGet({
  userId,
  deckReadResponse = [],
  traceEnabled,
}: {
  userId: string | ObjectId
  deckReadResponse?: DeckDbObject[]
  traceEnabled?: boolean
}) {
  const readSpy = jest.spyOn(DeckStore as any, 'read').mockResolvedValue(deckReadResponse)
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  DeckStore['logger'] = {
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(DeckStore.get(userId)).resolves.toEqual(deckReadResponse)

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter: {
          user: new ObjectId(userId),
        },
      },
    ],
  ])
  expect(debugSpy.mock.calls).toEqual([[`Getting decks for user "${userId}"`]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `get filter: "${JSON.stringify({
              user: new ObjectId(userId),
            })}"`,
          ],
        ]
      : []
  )
}

async function testGetById({
  id = new ObjectId(),
  options,
  deckReadResponse = [],
  expected,
  errorCalls = [],
  traceEnabled,
}: {
  id?: ObjectId | string
  options?: FindOptions
  deckReadResponse?: DeckDbObject[]
  expected: Error | DeckDbObject | undefined
  errorCalls?: any[][]
  traceEnabled?: boolean
}) {
  const deckReadSpy = jest.spyOn(DeckStore as any, 'read').mockResolvedValue(deckReadResponse)
  const errorSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  DeckStore['logger'] = {
    error: errorSpy,
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  const promise = DeckStore.getById({
    id,
    options,
  })
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(deckReadSpy.mock.calls).toEqual([
    [
      {
        filter: {
          _id: new ObjectId(id),
        },
        options,
      },
    ],
  ])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(debugSpy.mock.calls).toEqual([[`Getting deck with ID "${id}"`]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `getById filter for ID "${id}": "${JSON.stringify({
              _id: new ObjectId(id),
            })}"`,
          ],
          [`getById options for ID "${id}": "${JSON.stringify(undefined)}"`],
        ]
      : []
  )
}
