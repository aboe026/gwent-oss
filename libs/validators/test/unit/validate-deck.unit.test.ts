import { CardUnitFragment, DeckUnitFragment } from '@gwent/graphql-schema/apollo-typings'
import { DECK_MAX_SPECIALS, DECK_MIN_UNITS } from '@gwent/constants'
import { DeckUnit, FactionKey, Unit } from '@gwent/graphql-schema/resolver-typings'
import ValidateDeck, { DeckUnitForValidation } from '../../src/validate-deck'
import * as validatePositiveInteger from '../../src/validate-positive-integer'

describe('ValidateDeck', () => {
  describe('fromDeckUnits', () => {
    it('calls to validate with deckUnits and returns errors if found', () => {
      testFromDeckUnits({
        validateResponse: ['error'],
      })
    })
    it('calls to validate with deckUnits and returns empty array if no errors found', () => {
      testFromDeckUnits({
        validateResponse: [],
      })
    })
  })
  describe('fromDeckUnitFragments', () => {
    it('calls to validate with deckUnits and returns errors if found', () => {
      testFromDeckUnitFragments({
        validateResponse: ['error'],
      })
    })
    it('calls to validate with deckUnits and returns empty array if no errors found', () => {
      testFromDeckUnitFragments({
        validateResponse: [],
      })
    })
  })
  describe('validate', () => {
    const deckUnit: DeckUnitForValidation = {
      factionKey: FactionKey.Monsters,
      id: 'id',
      artStyle: 1,
      images: 1,
      special: undefined,
    }
    const deckUnits: DeckUnitForValidation[] = new Array(DECK_MIN_UNITS).fill(deckUnit)
    it('returns empty array if deck is valid with number artStyle', () => {
      const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default').mockReturnValue(1)

      expect(
        ValidateDeck['validate']({
          deckUnits,
          faction: deckUnit.factionKey,
        })
      ).toEqual([])

      expect(validatePositiveIntegerSpy.mock.calls).toEqual([
        ...new Array(deckUnits.length).fill([
          deckUnit.artStyle,
          {
            allowZero: false,
          },
        ]),
      ])
    })
    it('returns empty array if deck is valid with undefined artyStyle', () => {
      const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default').mockReturnValue(1)

      expect(
        ValidateDeck['validate']({
          deckUnits: deckUnits.map((deckUnit) => {
            return {
              ...deckUnit,
              artStyle: undefined,
            }
          }),
          faction: deckUnit.factionKey,
        })
      ).toEqual([])

      expect(validatePositiveIntegerSpy.mock.calls).toEqual([])
    })
    it('returns empty array if deck is valid with null artyStyle', () => {
      const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default').mockReturnValue(1)

      expect(
        ValidateDeck['validate']({
          deckUnits: deckUnits.map((deckUnit) => {
            return {
              ...deckUnit,
              artStyle: null,
            }
          }),
          faction: deckUnit.factionKey,
        })
      ).toEqual([])

      expect(validatePositiveIntegerSpy.mock.calls).toEqual([])
    })
    it('returns error if unit faction does not equal faction or neutral', () => {
      const invalidUnit: DeckUnitForValidation = {
        ...deckUnit,
        factionKey: FactionKey.Skellige,
      }

      expect(
        ValidateDeck['validate']({
          deckUnits: [...deckUnits, invalidUnit],
          faction: deckUnit.factionKey,
        })
      ).toEqual([
        `Invalid faction "${invalidUnit.factionKey}" for unit "${invalidUnit.id}", must be either "${deckUnit.factionKey}" or "${FactionKey.Neutral}".`,
      ])
    })
    it('returns error if unit artstyle is not positive integer', () => {
      const invalidUnit: DeckUnitForValidation = {
        ...deckUnit,
        artStyle: 0,
      }
      const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default')
      for (let i = 0; i < deckUnits.length; i++) {
        validatePositiveIntegerSpy.mockReturnValueOnce(1)
      }
      validatePositiveIntegerSpy.mockImplementationOnce(() => {
        throw Error('invalid')
      })

      expect(
        ValidateDeck['validate']({
          deckUnits: [...deckUnits, invalidUnit],
          faction: deckUnit.factionKey,
        })
      ).toEqual([
        `Invalid artStyle "${invalidUnit.artStyle}" for unit "${invalidUnit.id}", must be positive integer greater than zero.`,
      ])

      expect(validatePositiveIntegerSpy.mock.calls).toEqual([
        ...new Array(deckUnits.length).fill([
          deckUnit.artStyle,
          {
            allowZero: false,
          },
        ]),
        [
          invalidUnit.artStyle,
          {
            allowZero: false,
          },
        ],
      ])
    })
    it('returns error if unit artstyle is greater than images for unit', () => {
      const invalidUnit: DeckUnitForValidation = {
        ...deckUnit,
        artStyle: 2,
      }
      const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default').mockReturnValue(1)

      expect(
        ValidateDeck['validate']({
          deckUnits: [...deckUnits, invalidUnit],
          faction: deckUnit.factionKey,
        })
      ).toEqual([
        `Invalid artStyle "${invalidUnit.artStyle}" for unit "${invalidUnit.id}", only "1" art styles available for unit.`,
      ])

      expect(validatePositiveIntegerSpy.mock.calls).toEqual([
        ...new Array(deckUnits.length).fill([
          deckUnit.artStyle,
          {
            allowZero: false,
          },
        ]),
        [
          invalidUnit.artStyle,
          {
            allowZero: false,
          },
        ],
      ])
    })
    it('returns error if more than maximum specials', () => {
      const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default').mockReturnValue(1)

      expect(
        ValidateDeck['validate']({
          deckUnits: [
            ...deckUnits.map((deckUnit) => {
              return {
                ...deckUnit,
                special: true,
              }
            }),
          ],
          faction: deckUnit.factionKey,
        })
      ).toEqual([`Invalid number of special units at "${deckUnits.length}", maximum is "${DECK_MAX_SPECIALS}".`])

      expect(validatePositiveIntegerSpy.mock.calls).toEqual([
        ...new Array(deckUnits.length).fill([
          deckUnit.artStyle,
          {
            allowZero: false,
          },
        ]),
      ])
    })
    it('returns error if less than 22 units', () => {
      const belowMinUnits = DECK_MIN_UNITS - 1
      const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default').mockReturnValue(1)

      expect(
        ValidateDeck['validate']({
          deckUnits: deckUnits.slice(0, belowMinUnits),
          faction: deckUnit.factionKey,
        })
      ).toEqual([`Invalid number of units at "${belowMinUnits}", minimum is "${DECK_MIN_UNITS}".`])

      expect(validatePositiveIntegerSpy.mock.calls).toEqual([
        ...new Array(belowMinUnits).fill([
          deckUnit.artStyle,
          {
            allowZero: false,
          },
        ]),
      ])
    })
    it('returns errors if all rules violated', () => {
      const belowMinUnits = DECK_MIN_UNITS - 1
      const invalidFactionUnit: DeckUnitForValidation = {
        ...deckUnit,
        id: 'invalid-faction-id',
        factionKey: FactionKey.Skellige,
      }
      const invalidImageSmallUnit: DeckUnitForValidation = {
        ...deckUnit,
        id: 'invalid-image-small-id',
        artStyle: 0,
      }
      const invalidImageLargeUnit: DeckUnitForValidation = {
        ...deckUnit,
        id: 'invalid-image-large-id',
        artStyle: 2,
      }
      const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default')
      validatePositiveIntegerSpy.mockReturnValueOnce(1)
      validatePositiveIntegerSpy.mockImplementationOnce(() => {
        throw Error('invalid')
      })
      validatePositiveIntegerSpy.mockReturnValueOnce(1)
      for (let i = 0; i < belowMinUnits; i++) {
        validatePositiveIntegerSpy.mockReturnValueOnce(1)
      }

      expect(
        ValidateDeck['validate']({
          deckUnits: [
            invalidFactionUnit,
            invalidImageSmallUnit,
            invalidImageLargeUnit,
            ...deckUnits.slice(0, belowMinUnits - 3).map((deckUnit) => {
              return {
                ...deckUnit,
                special: true,
              }
            }),
          ],
          faction: deckUnit.factionKey,
        })
      ).toEqual([
        `Invalid faction "${invalidFactionUnit.factionKey}" for unit "${invalidFactionUnit.id}", must be either "${deckUnit.factionKey}" or "${FactionKey.Neutral}".`,
        `Invalid artStyle "${invalidImageSmallUnit.artStyle}" for unit "${invalidImageSmallUnit.id}", must be positive integer greater than zero.`,
        `Invalid artStyle "${invalidImageLargeUnit.artStyle}" for unit "${invalidImageLargeUnit.id}", only "${invalidImageLargeUnit.images}" art styles available for unit.`,
        `Invalid number of special units at "${belowMinUnits - 3}", maximum is "${DECK_MAX_SPECIALS}".`,
        `Invalid number of units at "${belowMinUnits}", minimum is "${DECK_MIN_UNITS}".`,
      ])

      expect(validatePositiveIntegerSpy.mock.calls).toEqual([
        [
          invalidFactionUnit.artStyle,
          {
            allowZero: false,
          },
        ],
        [
          invalidImageSmallUnit.artStyle,
          {
            allowZero: false,
          },
        ],
        [
          invalidImageLargeUnit.artStyle,
          {
            allowZero: false,
          },
        ],
        ...new Array(belowMinUnits - 3).fill([
          deckUnit.artStyle,
          {
            allowZero: false,
          },
        ]),
      ])
    })
  })
})

function testFromDeckUnits({ validateResponse }: { validateResponse: string[] }) {
  const validateSpy = jest.spyOn(ValidateDeck as any, 'validate').mockReturnValue(validateResponse)
  const deckUnits: DeckUnit[] = []
  for (let i = 0; i < DECK_MIN_UNITS; i++) {
    deckUnits.push({
      artStyle: i,
      unit: {
        faction: {
          key: i % 2 ? FactionKey.Monsters : FactionKey.Neutral,
        },
        id: `id-${i}`,
        images: new Array(i).fill(''),
        special: i % 2 ? true : false,
      } as any as Unit,
    })
  }

  expect(
    ValidateDeck.fromDeckUnits({
      deckUnits,
      faction: FactionKey.Monsters,
    })
  ).toEqual(validateResponse)

  expect(validateSpy.mock.calls).toEqual([
    [
      {
        faction: FactionKey.Monsters,
        deckUnits: deckUnits.map((deckUnit) => {
          return {
            artStyle: deckUnit.artStyle,
            factionKey: deckUnit.unit.faction.key,
            id: deckUnit.unit.id,
            images: deckUnit.unit.images.length,
            special: deckUnit.unit.special,
          }
        }),
      },
    ],
  ])
}

function testFromDeckUnitFragments({ validateResponse }: { validateResponse: string[] }) {
  const validateSpy = jest.spyOn(ValidateDeck as any, 'validate').mockReturnValue(validateResponse)
  const deckUnits: DeckUnitFragment[] = []
  for (let i = 0; i < DECK_MIN_UNITS; i++) {
    deckUnits.push({
      artStyle: i,
      unit: {
        faction: {
          key: i % 2 ? FactionKey.Monsters : FactionKey.Neutral,
        },
        id: `id-${i}`,
        images: new Array(i).fill(''),
        special: i % 2 ? true : false,
      } as any as CardUnitFragment,
    })
  }

  expect(
    ValidateDeck.fromDeckUnitFragments({
      deckUnits,
      faction: FactionKey.Monsters,
    })
  ).toEqual(validateResponse)

  expect(validateSpy.mock.calls).toEqual([
    [
      {
        faction: FactionKey.Monsters,
        deckUnits: deckUnits.map((deckUnit: any) => {
          return {
            artStyle: deckUnit.artStyle,
            factionKey: deckUnit.unit.faction.key,
            id: deckUnit.unit.id,
            images: deckUnit.unit.images.length,
            special: deckUnit.unit.special,
          }
        }),
      },
    ],
  ])
}
