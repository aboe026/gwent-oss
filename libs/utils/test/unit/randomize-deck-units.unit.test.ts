import { DECK_MAX_SPECIALS, DECK_MIN_UNITS } from '@gwent-oss/constants'
import { DeckUnitFragment, UnitFragment } from '@gwent-oss/graphql-schema/apollo-typings'
import * as getRandomNumber from '../../src/get-random-number'
import RandomizeDeckUnits, { UnitForValidation } from '../../src/randomize-deck-units'
import * as randomizeOrder from '../../src/randomize-order'
import { Unit } from '@gwent-oss/graphql-schema/resolver-typings'

describe('randomize-deck-units', () => {
  describe('fromUnits', () => {
    it('calls to randomize with normalized units', () => {
      const units: Unit[] = [
        {
          id: 'id1',
          special: true,
        } as any as Unit,
        {
          id: 'id2',
          special: false,
        } as any as Unit,
      ]

      const randomizeSpy = jest
        .spyOn(RandomizeDeckUnits as any, 'randomize')
        .mockReturnValue([units[1].id, units[0].id])

      expect(
        RandomizeDeckUnits.fromUnits({
          units,
        })
      ).toEqual([units[1].id, units[0].id])

      expect(randomizeSpy.mock.calls).toEqual([
        [
          {
            units: [
              {
                id: units[0].id,
                special: units[0].special,
              },
              {
                id: units[1].id,
                special: units[1].special,
              },
            ],
          },
        ],
      ])
    })
  })
  describe('fromDeckUnitFragments', () => {
    it('calls to randomize with normalized units', () => {
      const units: DeckUnitFragment[] = [
        {
          artStyle: 1,
          unit: {
            id: 'id1',
            special: true,
          } as any as UnitFragment,
        },
        {
          artStyle: 1,
          unit: {
            id: 'id2',
            special: false,
          } as any as UnitFragment,
        },
      ]

      const randomizeSpy = jest.spyOn(RandomizeDeckUnits as any, 'randomize').mockReturnValue(['id2', 'id1'])

      expect(
        RandomizeDeckUnits.fromDeckUnitFragments({
          units,
        })
      ).toEqual(['id2', 'id1'])

      expect(randomizeSpy.mock.calls).toEqual([
        [
          {
            units: [
              {
                id: 'id1',
                special: true,
              },
              {
                id: 'id2',
                special: false,
              },
            ],
          },
        ],
      ])
    })
  })
  describe('randomize', () => {
    it('throws error if not enough special units for a valid deck', () => {
      const units: UnitForValidation[] = [
        {
          id: 'id1',
          special: false,
        },
      ]
      testRandomize({
        units,
        randomizeOrderResponse: units,
        getRandomNumberResponses: [1, 0],
        expected: Error('Not enough special units. Expected at least "1", only "0" found.'),
      })
    })
    it('returns unit id for single normal unit', () => {
      const units: UnitForValidation[] = [
        {
          id: 'id1',
          special: false,
        },
      ]
      testRandomize({
        units,
        randomizeOrderResponse: units,
        getRandomNumberResponses: [0, 1],
        expected: ['id1'],
      })
    })
    it('returns unit id for single special unit', () => {
      const units: UnitForValidation[] = [
        {
          id: 'id1',
          special: true,
        },
      ]
      testRandomize({
        units,
        randomizeOrderResponse: units,
        getRandomNumberResponses: [1, 0],
        expected: ['id1'],
      })
    })
    it('returns unit id for multiple normal units in same order', () => {
      const units: UnitForValidation[] = [
        {
          id: 'id1',
          special: false,
        },
        {
          id: 'id2',
          special: false,
        },
      ]
      testRandomize({
        units,
        randomizeOrderResponse: units,
        getRandomNumberResponses: [0, 2],
        expected: ['id1', 'id2'],
      })
    })
    it('returns unit id for multiple normal units in reversed order', () => {
      const units: UnitForValidation[] = [
        {
          id: 'id1',
          special: false,
        },
        {
          id: 'id2',
          special: false,
        },
      ]
      testRandomize({
        units,
        randomizeOrderResponse: units.reverse(),
        getRandomNumberResponses: [0, 2],
        expected: ['id2', 'id1'],
      })
    })
    it('returns unit id for multiple special units in same order', () => {
      const units: UnitForValidation[] = [
        {
          id: 'id1',
          special: true,
        },
        {
          id: 'id2',
          special: true,
        },
      ]
      testRandomize({
        units,
        randomizeOrderResponse: units,
        getRandomNumberResponses: [2, 0],
        expected: ['id1', 'id2'],
      })
    })
    it('returns unit id for multiple special units in reversed order', () => {
      const units: UnitForValidation[] = [
        {
          id: 'id1',
          special: true,
        },
        {
          id: 'id2',
          special: true,
        },
      ]
      testRandomize({
        units,
        randomizeOrderResponse: units.reverse(),
        getRandomNumberResponses: [2, 0],
        expected: ['id2', 'id1'],
      })
    })
    it('returns unit id for mixed units in same order', () => {
      const units: UnitForValidation[] = [
        {
          id: 'id1',
          special: true,
        },
        {
          id: 'id2',
          special: false,
        },
      ]
      testRandomize({
        units,
        randomizeOrderResponse: units,
        getRandomNumberResponses: [1, 1],
        expected: ['id1', 'id2'],
      })
    })
    it('returns unit id for mixed units in reverse order', () => {
      const units: UnitForValidation[] = [
        {
          id: 'id1',
          special: true,
        },
        {
          id: 'id2',
          special: false,
        },
      ]
      testRandomize({
        units,
        randomizeOrderResponse: units.reverse(),
        getRandomNumberResponses: [1, 1],
        expected: ['id2', 'id1'],
      })
    })
    it('ignores extras', () => {
      const units: UnitForValidation[] = [
        {
          id: 'id1',
          special: true,
        },
        {
          id: 'id2',
          special: true,
        },
        {
          id: 'id3',
          special: false,
        },
        {
          id: 'id4',
          special: false,
        },
      ]
      testRandomize({
        units,
        randomizeOrderResponse: units,
        getRandomNumberResponses: [1, 1],
        expected: ['id1', 'id3'],
      })
    })
  })
})

function testRandomize({
  units,
  randomizeOrderResponse,
  getRandomNumberResponses,
  expected,
}: {
  units: UnitForValidation[]
  randomizeOrderResponse: UnitForValidation[]
  getRandomNumberResponses: number[]
  expected?: string[] | Error
}) {
  const randomizeOrderSpy = jest.spyOn(randomizeOrder, 'default').mockReturnValue(randomizeOrderResponse)
  const getRandomNumberSpy = jest.spyOn(getRandomNumber, 'default')
  for (const getRandomNumberResponse of getRandomNumberResponses) {
    getRandomNumberSpy.mockReturnValueOnce(getRandomNumberResponse)
  }

  if (expected instanceof Error) {
    expect(() =>
      RandomizeDeckUnits['randomize']({
        units,
      })
    ).toThrow(expected)
  } else {
    expect(
      RandomizeDeckUnits['randomize']({
        units,
      })
    ).toEqual(expected)
  }

  expect(randomizeOrderSpy.mock.calls).toEqual([[units]])
  expect(getRandomNumberSpy.mock.calls).toEqual([
    [
      {
        min: 0,
        max: DECK_MAX_SPECIALS,
      },
    ],
    [
      {
        min: DECK_MIN_UNITS - getRandomNumberResponses[0],
        max: randomizeOrderResponse.length - getRandomNumberResponses[0],
      },
    ],
  ])
}
