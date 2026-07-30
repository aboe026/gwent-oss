import { ObjectId } from 'mongodb'

import { DeckUnit } from '@gwent/graphql-schema/resolver-typings'
import DeckUnitResolver from '../../src/graphql/resolvers/types/deck-unit-resolver'
import {
  PlayersToDeckUnitDbObjects,
  PlayersToDeckUnits,
} from '../../src/graphql/resolvers/mutations/util/players-to-deck-units'
import PlayersToDeckUnitsResolver from '../../src/graphql/resolvers/types/players-to-deck-units-resolver'
import TestUtil from '../util/test-util'

describe('players-to-deck-units-resolver', () => {
  describe('fromObject', () => {
    it('throws error if cannot resolve deck unit', async () => {
      const playerId = new ObjectId().toString()
      const deckUnit = TestUtil.getDbDeckUnit({})
      const message = `Could not resolve player "${playerId}" DeckUnit "${deckUnit.unit}"`
      await testFromObject({
        playersToDeckUnitsDbObjects: {
          [playerId]: [deckUnit],
        },
        deckUnitsResponse: [],
        expected: Error(message),
        errorCalls: [[`${message}.`]],
      })
    })
    it('does not resolve anything if undefined', async () => {
      await testFromObject({
        playersToDeckUnitsDbObjects: undefined,
        expected: {},
      })
    })
    it('does not resolve anything if empty map', async () => {
      await testFromObject({
        playersToDeckUnitsDbObjects: {},
        deckUnitsResponse: [],
        expected: {},
      })
    })
    it('resolves single player with single unit', async () => {
      const playerId = new ObjectId().toString()
      const deckUnit = TestUtil.getDbDeckUnit({})
      const resolvedDeckUnit = TestUtil.getDeckUnitFromDbDeckUnit({
        deckUnit,
      })
      await testFromObject({
        playersToDeckUnitsDbObjects: {
          [playerId]: [deckUnit],
        },
        deckUnitsResponse: [resolvedDeckUnit],
        expected: {
          [playerId]: [resolvedDeckUnit],
        },
      })
    })
    it('resolves single player with multiple unit', async () => {
      const playerId = new ObjectId().toString()
      const deckUnit1 = TestUtil.getDbDeckUnit({})
      const deckUnit2 = TestUtil.getDbDeckUnit({})
      const resolvedDeckUnit1 = TestUtil.getDeckUnitFromDbDeckUnit({
        deckUnit: deckUnit1,
      })
      const resolvedDeckUnit2 = TestUtil.getDeckUnitFromDbDeckUnit({
        deckUnit: deckUnit2,
      })
      await testFromObject({
        playersToDeckUnitsDbObjects: {
          [playerId]: [deckUnit1, deckUnit2],
        },
        deckUnitsResponse: [resolvedDeckUnit1, resolvedDeckUnit2],
        expected: {
          [playerId]: [resolvedDeckUnit1, resolvedDeckUnit2],
        },
      })
    })
    it('resolves multiple players with single unit', async () => {
      const playerId1 = new ObjectId().toString()
      const playerId2 = new ObjectId().toString()
      const deckUnit1 = TestUtil.getDbDeckUnit({})
      const deckUnit2 = TestUtil.getDbDeckUnit({})
      const resolvedDeckUnit1 = TestUtil.getDeckUnitFromDbDeckUnit({
        deckUnit: deckUnit1,
      })
      const resolvedDeckUnit2 = TestUtil.getDeckUnitFromDbDeckUnit({
        deckUnit: deckUnit2,
      })
      await testFromObject({
        playersToDeckUnitsDbObjects: {
          [playerId1]: [deckUnit1],
          [playerId2]: [deckUnit2],
        },
        deckUnitsResponse: [resolvedDeckUnit1, resolvedDeckUnit2],
        expected: {
          [playerId1]: [resolvedDeckUnit1],
          [playerId2]: [resolvedDeckUnit2],
        },
      })
    })
    it('resolves multiple players with multiple units', async () => {
      const playerId1 = new ObjectId().toString()
      const playerId2 = new ObjectId().toString()
      const deckUnit1 = TestUtil.getDbDeckUnit({})
      const deckUnit2 = TestUtil.getDbDeckUnit({})
      const deckUnit3 = TestUtil.getDbDeckUnit({})
      const deckUnit4 = TestUtil.getDbDeckUnit({})
      const resolvedDeckUnit1 = TestUtil.getDeckUnitFromDbDeckUnit({
        deckUnit: deckUnit1,
      })
      const resolvedDeckUnit2 = TestUtil.getDeckUnitFromDbDeckUnit({
        deckUnit: deckUnit2,
      })
      const resolvedDeckUnit3 = TestUtil.getDeckUnitFromDbDeckUnit({
        deckUnit: deckUnit3,
      })
      const resolvedDeckUnit4 = TestUtil.getDeckUnitFromDbDeckUnit({
        deckUnit: deckUnit4,
      })
      await testFromObject({
        playersToDeckUnitsDbObjects: {
          [playerId1]: [deckUnit1, deckUnit3],
          [playerId2]: [deckUnit2, deckUnit4],
        },
        deckUnitsResponse: [resolvedDeckUnit1, resolvedDeckUnit2, resolvedDeckUnit3, resolvedDeckUnit4],
        expected: {
          [playerId1]: [resolvedDeckUnit1, resolvedDeckUnit3],
          [playerId2]: [resolvedDeckUnit2, resolvedDeckUnit4],
        },
      })
    })
  })
})

async function testFromObject({
  playersToDeckUnitsDbObjects,
  deckUnitsResponse,
  expected,
  errorCalls = [],
}: {
  playersToDeckUnitsDbObjects: PlayersToDeckUnitDbObjects | undefined
  deckUnitsResponse?: DeckUnit[]
  expected: PlayersToDeckUnits | Error
  errorCalls?: string[][]
}) {
  const deckUnitsSpy = jest.spyOn(DeckUnitResolver, 'fromArray')
  if (deckUnitsResponse) {
    deckUnitsSpy.mockResolvedValue(deckUnitsResponse)
  }
  const errorSpy = jest.fn().mockImplementation()
  PlayersToDeckUnitsResolver['logger'] = {
    error: errorSpy,
  } as any

  const promise = PlayersToDeckUnitsResolver.fromObject(playersToDeckUnitsDbObjects)
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(deckUnitsSpy.mock.calls).toEqual(
    deckUnitsResponse
      ? [
          [
            {
              deckUnits: Object.values(playersToDeckUnitsDbObjects || {}).flat(),
            },
          ],
        ]
      : []
  )
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
