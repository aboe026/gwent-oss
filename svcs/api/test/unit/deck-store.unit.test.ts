import { ObjectId } from 'mongodb'

import { DeckDbObject, UnitStats } from '@gwent/graphql-schema/database-typings'
import DeckStore, { AddDeckUnitInput } from '../../src/database/stores/deck-store'
import Store from '../../src/database/stores/store'

describe('deck-store', () => {
  describe('add', () => {
    it('calls out to create method with deck information', async () => {
      await testAdd({
        name: 'success',
        userId: new ObjectId(),
      })
    })
    it('throws special error if duplicate deck', async () => {
      const name = 'duplicate-error'
      const userId = new ObjectId()
      const error = `Deck with name "${name}" already exists for user "${userId}"`
      await testAdd({
        name,
        userId,
        error: Error(error),
        isMongoError: true,
        errorCalls: [[error]],
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
    it('logs to trace if enabled', async () => {
      await testAdd({
        name: 'success',
        userId: new ObjectId(),
        traceEnabled: true,
      })
    })
  })
  describe('get', () => {
    it('calls to read with user id string', async () => {
      const userId = new ObjectId().toString()
      const readSpy = jest.spyOn(DeckStore as any, 'read').mockResolvedValue([])

      await expect(DeckStore.get(userId)).resolves.toEqual([])

      expect(readSpy.mock.calls).toEqual([
        [
          {
            filter: {
              user: new ObjectId(userId),
            },
          },
        ],
      ])
    })
    it('calls to read with user id ObjectId', async () => {
      const userId = new ObjectId()
      const readSpy = jest.spyOn(DeckStore as any, 'read').mockResolvedValue([])

      await expect(DeckStore.get(userId)).resolves.toEqual([])

      expect(readSpy.mock.calls).toEqual([
        [
          {
            filter: {
              user: userId,
            },
          },
        ],
      ])
    })
  })
  describe('getByIds', () => {
    it('calls to read with empty array if ids empty', async () => {
      const readSpy = jest.spyOn(DeckStore as any, 'read').mockResolvedValue([])

      await expect(DeckStore.getByIds([])).resolves.toEqual([])

      expect(readSpy.mock.calls).toEqual([
        [
          {
            filter: {
              _id: {
                $in: [],
              },
            },
          },
        ],
      ])
    })
    it('calls to read with id string', async () => {
      const id = new ObjectId()

      const readSpy = jest.spyOn(DeckStore as any, 'read').mockResolvedValue([])

      await expect(DeckStore.getByIds([id.toString()])).resolves.toEqual([])

      expect(readSpy.mock.calls).toEqual([
        [
          {
            filter: {
              _id: {
                $in: [id],
              },
            },
          },
        ],
      ])
    })
    it('calls to read with id ObjectId', async () => {
      const id = new ObjectId()

      const readSpy = jest.spyOn(DeckStore as any, 'read').mockResolvedValue([])

      await expect(DeckStore.getByIds([id])).resolves.toEqual([])

      expect(readSpy.mock.calls).toEqual([
        [
          {
            filter: {
              _id: {
                $in: [id],
              },
            },
          },
        ],
      ])
    })
  })
})

async function testAdd({
  name,
  userId,
  error,
  traceEnabled,
  isMongoError = false,
  errorCalls = [],
}: {
  name: string
  userId: ObjectId
  error?: Error
  traceEnabled?: boolean
  isMongoError?: boolean
  errorCalls?: (string | Error)[][]
}) {
  const factionId = new ObjectId()
  const leaderId = new ObjectId()
  const stats: UnitStats = {
    agile: 1,
    avenger: 2,
    berserker: 3,
    bond: 4,
    close: 5,
    decoy: 6,
    heroes: 7,
    horn: 8,
    mardroeme: 9,
    medic: 10,
    morale: 11,
    muster: 12,
    ranged: 13,
    scorch: 14,
    siege: 15,
    specials: 16,
    spy: 17,
    strengthAverage: 18,
    strengths: 19,
    strengthTotal: 20,
    units: 21,
    weather: 22,
  }
  const deckUnit: AddDeckUnitInput = {
    artStyle: 1,
    unit: new ObjectId(),
  }
  const created = new Date()
  const expected: DeckDbObject = {
    _id: new ObjectId(),
    created,
    faction: factionId,
    leader: leaderId,
    name,
    stats,
    units: [deckUnit as any],
    user: userId,
  }
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => created)
  const createSpy = jest.spyOn(Store as any, 'create')
  if (error) {
    createSpy.mockRejectedValue(error)
  } else {
    createSpy.mockResolvedValue(expected)
  }
  const isMongoErrorSpy = jest.spyOn(DeckStore, 'isMongoError').mockReturnValue(isMongoError)
  const traceSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  DeckStore['logger'] = {
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
    error: errorSpy,
  } as any

  if (error) {
    await expect(
      DeckStore.add({
        factionId: factionId.toString(),
        leaderId: leaderId.toString(),
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
    ).rejects.toThrow(error)
  } else {
    await expect(
      DeckStore.add({
        factionId: factionId.toString(),
        leaderId: leaderId.toString(),
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
    ).resolves.toEqual(expected)
  }

  expect(dateSpy.mock.calls).toEqual([[]])
  expect(createSpy.mock.calls).toEqual([
    [
      {
        created,
        faction: factionId,
        leader: leaderId,
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
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [
          [
            `Adding deck: "${JSON.stringify({
              created,
              faction: factionId,
              leader: leaderId,
              name,
              stats,
              units: [deckUnit as any],
              user: userId,
            })}"`,
          ],
        ]
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
