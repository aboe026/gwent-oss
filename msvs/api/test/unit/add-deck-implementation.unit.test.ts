import { ObjectId } from 'mongodb'

import AddDeckImplementation from '../../src/graphql/resolvers/mutations/add-deck/add-deck-implementation'
import DeckStore from '../../src/database/stores/deck-store'
import TestUtil from '../util/test-util'
import * as utils from '@gwent/utils'
import { ValidatedAddDeck } from '../../src/graphql/resolvers/mutations/add-deck/add-deck-validation'

describe('add-deck-implementation', () => {
  const logPrefix = 'log-prefix'
  const name = 'deck-name'
  const userId = new ObjectId()
  it('throws error if name already exists', async () => {
    const message = `Deck with name "${name}" already exists.`
    await testAddDeckImplementation({
      name,
      userId,
      logPrefix,
      deckStoreAddError: Error(`Deck with name "${name}" already exists for user "${userId}"`),
      expectedError: Error(message),
      warnCalls: [[`${logPrefix} failed: ${message}`]],
    })
  })
  it('throws error if unknown error', async () => {
    const error = Error('connection timeout')
    await testAddDeckImplementation({
      name,
      userId,
      logPrefix,
      deckStoreAddError: error,
      expectedError: error,
      errorCalls: [[`${logPrefix} failed: ${error}`]],
    })
  })
  it('returns deck if no errors', async () => {
    await testAddDeckImplementation({
      name,
      userId,
      logPrefix,
    })
  })
  it('logs to trace if enabled', async () => {
    await testAddDeckImplementation({
      name,
      userId,
      logPrefix,
      traceEnabled: true,
    })
  })
})

async function testAddDeckImplementation({
  name,
  userId,
  logPrefix,
  deckStoreAddError,
  expectedError,
  errorCalls = [],
  warnCalls = [],
  traceEnabled,
}: {
  name: string
  userId: ObjectId
  logPrefix: string
  deckStoreAddError?: Error
  expectedError?: Error
  errorCalls?: string[][]
  warnCalls?: string[][]
  traceEnabled?: boolean
}) {
  const faction = TestUtil.getDbFaction({})
  const input: ValidatedAddDeck = {
    deckUnits: [TestUtil.getDeckUnit({}), TestUtil.getDeckUnit({})],
    faction,
    leader: TestUtil.getDbLeader({
      faction: faction._id,
    }),
    logPrefix,
    name,
    userId,
  }
  const deck = TestUtil.getDbDeck({
    faction: faction._id,
    leader: input.leader._id,
    name: input.name,
    units: [
      {
        unit: new ObjectId(input.deckUnits[0].unit.id),
        artStyle: input.deckUnits[0].artStyle,
      },
      {
        unit: new ObjectId(input.deckUnits[1].unit.id),
        artStyle: input.deckUnits[1].artStyle,
      },
    ],
    user: input.userId,
  })
  const addSpy = jest.spyOn(DeckStore, 'add')
  if (deckStoreAddError) {
    addSpy.mockRejectedValue(deckStoreAddError)
  } else {
    addSpy.mockResolvedValue(deck)
  }
  const statsSpy = jest.spyOn(utils, 'getDeckStats').mockReturnValue({} as any)
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  AddDeckImplementation['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  const promise = AddDeckImplementation.addDeckImplementation(input)
  if (deckStoreAddError) {
    await expect(promise).rejects.toThrow(expectedError)
  } else {
    await expect(promise).resolves.toEqual(deck)
  }

  expect(addSpy.mock.calls).toEqual([
    [
      {
        factionId: input.faction._id,
        leaderId: input.leader._id,
        name: input.name,
        stats: {},
        units: [
          {
            unit: input.deckUnits[0].unit.id,
            artStyle: input.deckUnits[0].artStyle,
          },
          {
            unit: input.deckUnits[1].unit.id,
            artStyle: input.deckUnits[1].artStyle,
          },
        ],
        userId: input.userId,
      },
    ],
  ])
  expect(statsSpy.mock.calls).toEqual([[input.deckUnits]])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`${logPrefix} deck: "${JSON.stringify(deck)}"`]] : [])
}
