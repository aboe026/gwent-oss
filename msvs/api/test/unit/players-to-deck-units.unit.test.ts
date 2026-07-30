import { ObjectId } from 'mongodb'

import {
  mergePlayersToDeckUnitDbObjects,
  PlayersToDeckUnitDbObjects,
} from '../../src/graphql/resolvers/mutations/util/players-to-deck-units'
import TestUtil from '../util/test-util'

describe('players-to-deck-units', () => {
  describe('mergePlayersToDeckUnitDbObjects', () => {
    it('returns empty map if empty array', () => {
      testMergePlayersToDeckUnitDbObjects({
        playersToDeckUnitDbObjectsArray: [],
        expected: {},
      })
    })
    it('returns empty map if array with empty map', () => {
      testMergePlayersToDeckUnitDbObjects({
        playersToDeckUnitDbObjectsArray: [{}],
        expected: {},
      })
    })
    it('returns empty map if array with empty maps', () => {
      testMergePlayersToDeckUnitDbObjects({
        playersToDeckUnitDbObjectsArray: [{}, {}],
        expected: {},
      })
    })
    it('does not merge if single player with single DeckUnit in single map', () => {
      const playerId = new ObjectId().toString()
      const deckUnit = TestUtil.getDbDeckUnit({})
      testMergePlayersToDeckUnitDbObjects({
        playersToDeckUnitDbObjectsArray: [
          {
            [playerId]: [deckUnit],
          },
        ],
        expected: {
          [playerId]: [deckUnit],
        },
      })
    })
    it('does not merge if single player with multiple DeckUnits in single map', () => {
      const playerId = new ObjectId().toString()
      const deckUnit1 = TestUtil.getDbDeckUnit({})
      const deckUnit2 = TestUtil.getDbDeckUnit({})
      testMergePlayersToDeckUnitDbObjects({
        playersToDeckUnitDbObjectsArray: [
          {
            [playerId]: [deckUnit1, deckUnit2],
          },
        ],
        expected: {
          [playerId]: [deckUnit1, deckUnit2],
        },
      })
    })
    it('does not merge if multiple players with different DeckUnits in single map', () => {
      const playerId1 = new ObjectId().toString()
      const playerId2 = new ObjectId().toString()
      const deckUnit1 = TestUtil.getDbDeckUnit({})
      const deckUnit2 = TestUtil.getDbDeckUnit({})
      testMergePlayersToDeckUnitDbObjects({
        playersToDeckUnitDbObjectsArray: [
          {
            [playerId1]: [deckUnit1],
            [playerId2]: [deckUnit2],
          },
        ],
        expected: {
          [playerId1]: [deckUnit1],
          [playerId2]: [deckUnit2],
        },
      })
    })
    it('merges if single player with single DeckUnits in different maps', () => {
      const playerId = new ObjectId().toString()
      const deckUnit1 = TestUtil.getDbDeckUnit({})
      const deckUnit2 = TestUtil.getDbDeckUnit({})
      testMergePlayersToDeckUnitDbObjects({
        playersToDeckUnitDbObjectsArray: [
          {
            [playerId]: [deckUnit1],
          },
          {
            [playerId]: [deckUnit2],
          },
        ],
        expected: {
          [playerId]: [deckUnit1, deckUnit2],
        },
      })
    })
    it('merges if single player with multiple DeckUnits in different maps', () => {
      const playerId = new ObjectId().toString()
      const deckUnit1 = TestUtil.getDbDeckUnit({})
      const deckUnit2 = TestUtil.getDbDeckUnit({})
      const deckUnit3 = TestUtil.getDbDeckUnit({})
      const deckUnit4 = TestUtil.getDbDeckUnit({})
      testMergePlayersToDeckUnitDbObjects({
        playersToDeckUnitDbObjectsArray: [
          {
            [playerId]: [deckUnit1, deckUnit2],
          },
          {
            [playerId]: [deckUnit3, deckUnit4],
          },
        ],
        expected: {
          [playerId]: [deckUnit1, deckUnit2, deckUnit3, deckUnit4],
        },
      })
    })
    it('merges if multiple players with single DeckUnits in different maps', () => {
      const playerId1 = new ObjectId().toString()
      const playerId2 = new ObjectId().toString()
      const deckUnit1 = TestUtil.getDbDeckUnit({})
      const deckUnit2 = TestUtil.getDbDeckUnit({})
      const deckUnit3 = TestUtil.getDbDeckUnit({})
      const deckUnit4 = TestUtil.getDbDeckUnit({})
      testMergePlayersToDeckUnitDbObjects({
        playersToDeckUnitDbObjectsArray: [
          {
            [playerId1]: [deckUnit1],
            [playerId2]: [deckUnit3],
          },
          {
            [playerId1]: [deckUnit2],
            [playerId2]: [deckUnit4],
          },
        ],
        expected: {
          [playerId1]: [deckUnit1, deckUnit2],
          [playerId2]: [deckUnit3, deckUnit4],
        },
      })
    })
    it('merges if multiple players with single DeckUnits in different maps', () => {
      const playerId1 = new ObjectId().toString()
      const playerId2 = new ObjectId().toString()
      const deckUnit1 = TestUtil.getDbDeckUnit({})
      const deckUnit2 = TestUtil.getDbDeckUnit({})
      const deckUnit3 = TestUtil.getDbDeckUnit({})
      const deckUnit4 = TestUtil.getDbDeckUnit({})
      const deckUnit5 = TestUtil.getDbDeckUnit({})
      const deckUnit6 = TestUtil.getDbDeckUnit({})
      const deckUnit7 = TestUtil.getDbDeckUnit({})
      const deckUnit8 = TestUtil.getDbDeckUnit({})
      testMergePlayersToDeckUnitDbObjects({
        playersToDeckUnitDbObjectsArray: [
          {
            [playerId1]: [deckUnit1, deckUnit2],
            [playerId2]: [deckUnit3, deckUnit4],
          },
          {
            [playerId1]: [deckUnit5, deckUnit6],
            [playerId2]: [deckUnit7, deckUnit8],
          },
        ],
        expected: {
          [playerId1]: [deckUnit1, deckUnit2, deckUnit5, deckUnit6],
          [playerId2]: [deckUnit3, deckUnit4, deckUnit7, deckUnit8],
        },
      })
    })
  })
})

function testMergePlayersToDeckUnitDbObjects({
  playersToDeckUnitDbObjectsArray,
  expected,
}: {
  playersToDeckUnitDbObjectsArray: PlayersToDeckUnitDbObjects[]
  expected: PlayersToDeckUnitDbObjects
}) {
  expect(mergePlayersToDeckUnitDbObjects(...playersToDeckUnitDbObjectsArray)).toEqual(expected)
}
