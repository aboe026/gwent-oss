import { DeckUnit, FactionKey, UnitStats } from '@gwent/graphql-schema/resolver-typings'
import validateDeck from '../../src/validate-deck.mjs'
import * as validatePositiveInteger from '../../src/validate-positive-integer.mjs'

describe('validateDeck', () => {
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
  const deckUnit: DeckUnit = {
    artStyle: 1,
    unit: {
      created: new Date(),
      deckable: true,
      faction: {
        created: new Date(),
        id: 'id',
        image: 'image',
        key: FactionKey.Monsters,
        name: 'name',
        stats,
      },
      id: 'id',
      images: [''],
      name: 'name',
      quote: 'quote',
    },
  }
  const deckUnits: DeckUnit[] = new Array(22).fill(deckUnit)
  it('returns empty array if deck is valid', () => {
    const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default').mockReturnValue(deckUnit.artStyle)

    expect(
      validateDeck({
        deckUnits,
        faction: deckUnit.unit.faction.key,
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
  it('returns error if unit faction does not equal faction or neutral', () => {
    const invalidUnit: DeckUnit = {
      ...deckUnit,
      unit: {
        ...deckUnit.unit,
        id: 'invalid-unit-id',
        faction: {
          ...deckUnit.unit.faction,
          key: FactionKey.Skellige,
        },
      },
    }

    expect(
      validateDeck({
        deckUnits: [...deckUnits, invalidUnit],
        faction: deckUnit.unit.faction.key,
      })
    ).toEqual([
      `Invalid faction "${invalidUnit.unit.faction.key}" for unit "${invalidUnit.unit.id}", must be either "${deckUnit.unit.faction.key}" or "${FactionKey.Neutral}".`,
    ])
  })
  it('returns error if unit artstyle is not positive integer', () => {
    const invalidUnit: DeckUnit = {
      unit: {
        ...deckUnit.unit,
        id: 'invalid-unit-id',
      },
      artStyle: 0,
    }
    const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default')
    for (let i = 0; i < deckUnits.length; i++) {
      validatePositiveIntegerSpy.mockReturnValueOnce(deckUnit.artStyle)
    }
    validatePositiveIntegerSpy.mockImplementationOnce(() => {
      throw Error('invalid')
    })

    expect(
      validateDeck({
        deckUnits: [...deckUnits, invalidUnit],
        faction: deckUnit.unit.faction.key,
      })
    ).toEqual([
      `Invalid artStyle "${invalidUnit.artStyle}" for unit "${invalidUnit.unit.id}", must be positive integer greater than zero.`,
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
    const invalidUnit: DeckUnit = {
      unit: {
        ...deckUnit.unit,
        id: 'invalid-unit-id',
      },
      artStyle: deckUnit.unit.images.length + 1,
    }
    const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default').mockReturnValue(deckUnit.artStyle)

    expect(
      validateDeck({
        deckUnits: [...deckUnits, invalidUnit],
        faction: deckUnit.unit.faction.key,
      })
    ).toEqual([
      `Invalid artStyle "${invalidUnit.artStyle}" for unit "${invalidUnit.unit.id}", only "${invalidUnit.unit.images.length}" art styles available for unit.`,
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
  it('returns error if more than 10 specials', () => {
    const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default').mockReturnValue(deckUnit.artStyle)

    expect(
      validateDeck({
        deckUnits: [
          ...deckUnits.map((deckUnit) => {
            return {
              artStyle: deckUnit.artStyle,
              unit: {
                ...deckUnit.unit,
                special: true,
              },
            }
          }),
        ],
        faction: deckUnit.unit.faction.key,
      })
    ).toEqual([`Invalid number of special units at "${deckUnits.length}", maximum is "10".`])

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
    const belowMinUnits = 21
    const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default').mockReturnValue(deckUnit.artStyle)

    expect(
      validateDeck({
        deckUnits: deckUnits.slice(0, belowMinUnits),
        faction: deckUnit.unit.faction.key,
      })
    ).toEqual([`Invalid number of units at "${belowMinUnits}", minimum is "22".`])

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
    const belowMinUnits = 21
    const invalidFactionUnit: DeckUnit = {
      ...deckUnit,
      unit: {
        ...deckUnit.unit,
        id: 'invalid-unit-faction-id',
        faction: {
          ...deckUnit.unit.faction,
          key: FactionKey.Skellige,
        },
      },
    }
    const invalidImageSmallUnit: DeckUnit = {
      unit: {
        ...deckUnit.unit,
        id: 'invalid-unit-images-small-id',
      },
      artStyle: 0,
    }
    const invalidImageLargeUnit: DeckUnit = {
      unit: {
        ...deckUnit.unit,
        id: 'invalid-unit-iamges-large-id',
      },
      artStyle: deckUnit.unit.images.length + 1,
    }
    const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default')
    validatePositiveIntegerSpy.mockReturnValueOnce(deckUnit.artStyle)
    validatePositiveIntegerSpy.mockImplementationOnce(() => {
      throw Error('invalid')
    })
    validatePositiveIntegerSpy.mockReturnValueOnce(deckUnit.artStyle)
    for (let i = 0; i < belowMinUnits; i++) {
      validatePositiveIntegerSpy.mockReturnValueOnce(deckUnit.artStyle)
    }

    expect(
      validateDeck({
        deckUnits: [
          invalidFactionUnit,
          invalidImageSmallUnit,
          invalidImageLargeUnit,
          ...deckUnits.slice(0, belowMinUnits - 3).map((deckUnit) => {
            return {
              artStyle: deckUnit.artStyle,
              unit: {
                ...deckUnit.unit,
                special: true,
              },
            }
          }),
        ],
        faction: deckUnit.unit.faction.key,
      })
    ).toEqual([
      `Invalid faction "${invalidFactionUnit.unit.faction.key}" for unit "${invalidFactionUnit.unit.id}", must be either "${deckUnit.unit.faction.key}" or "${FactionKey.Neutral}".`,
      `Invalid artStyle "${invalidImageSmallUnit.artStyle}" for unit "${invalidImageSmallUnit.unit.id}", must be positive integer greater than zero.`,
      `Invalid artStyle "${invalidImageLargeUnit.artStyle}" for unit "${invalidImageLargeUnit.unit.id}", only "${invalidImageLargeUnit.unit.images.length}" art styles available for unit.`,
      `Invalid number of special units at "${belowMinUnits - 3}", maximum is "10".`,
      `Invalid number of units at "${belowMinUnits}", minimum is "22".`,
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
