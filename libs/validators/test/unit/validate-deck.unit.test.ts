import { DeckCard, FactionKey, UnitStats } from '@gwent/graphql-schema/resolver-typings'
import validateDeck from '../../src/validate-deck'
import * as validatePositiveInteger from '../../src/validate-positive-integer'

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
  const card: DeckCard = {
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
  const cards: DeckCard[] = new Array(22).fill(card)
  it('returns empty array if deck is valid', () => {
    const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default').mockReturnValue(card.artStyle)

    expect(
      validateDeck({
        cards,
        faction: card.unit.faction.key,
      })
    ).toEqual([])

    expect(validatePositiveIntegerSpy.mock.calls).toEqual([
      ...new Array(cards.length).fill([
        card.artStyle,
        {
          allowZero: false,
        },
      ]),
    ])
  })
  it('returns error if unit faction does not equal faction or neutral', () => {
    const invalidCard: DeckCard = {
      ...card,
      unit: {
        ...card.unit,
        id: 'invalid-card-id',
        faction: {
          ...card.unit.faction,
          key: FactionKey.Skellige,
        },
      },
    }

    expect(
      validateDeck({
        cards: [...cards, invalidCard],
        faction: card.unit.faction.key,
      })
    ).toEqual([
      `Invalid faction "${invalidCard.unit.faction.key}" for card "${invalidCard.unit.id}", must be either "${card.unit.faction.key}" or "${FactionKey.Neutral}".`,
    ])
  })
  it('returns error if unit artstyle is not positive integer', () => {
    const invalidCard: DeckCard = {
      unit: {
        ...card.unit,
        id: 'invalid-card-id',
      },
      artStyle: 0,
    }
    const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default')
    for (let i = 0; i < cards.length; i++) {
      validatePositiveIntegerSpy.mockReturnValueOnce(card.artStyle)
    }
    validatePositiveIntegerSpy.mockImplementationOnce(() => {
      throw Error('invalid')
    })

    expect(
      validateDeck({
        cards: [...cards, invalidCard],
        faction: card.unit.faction.key,
      })
    ).toEqual([
      `Invalid artStyle "${invalidCard.artStyle}" for card "${invalidCard.unit.id}", must be positive integer greater than zero.`,
    ])

    expect(validatePositiveIntegerSpy.mock.calls).toEqual([
      ...new Array(cards.length).fill([
        card.artStyle,
        {
          allowZero: false,
        },
      ]),
      [
        invalidCard.artStyle,
        {
          allowZero: false,
        },
      ],
    ])
  })
  it('returns error if unit artstyle is greater than images for card', () => {
    const invalidCard: DeckCard = {
      unit: {
        ...card.unit,
        id: 'invalid-card-id',
      },
      artStyle: card.unit.images.length + 1,
    }
    const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default').mockReturnValue(card.artStyle)

    expect(
      validateDeck({
        cards: [...cards, invalidCard],
        faction: card.unit.faction.key,
      })
    ).toEqual([
      `Invalid artStyle "${invalidCard.artStyle}" for card "${invalidCard.unit.id}", only "${invalidCard.unit.images.length}" art styles available for card.`,
    ])

    expect(validatePositiveIntegerSpy.mock.calls).toEqual([
      ...new Array(cards.length).fill([
        card.artStyle,
        {
          allowZero: false,
        },
      ]),
      [
        invalidCard.artStyle,
        {
          allowZero: false,
        },
      ],
    ])
  })
  it('returns error if more than 10 specials', () => {
    const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default').mockReturnValue(card.artStyle)

    expect(
      validateDeck({
        cards: [
          ...cards.map((deckCard) => {
            return {
              artStyle: deckCard.artStyle,
              unit: {
                ...deckCard.unit,
                special: true,
              },
            }
          }),
        ],
        faction: card.unit.faction.key,
      })
    ).toEqual([`Invalid number of special cards at "${cards.length}", maximum is "10".`])

    expect(validatePositiveIntegerSpy.mock.calls).toEqual([
      ...new Array(cards.length).fill([
        card.artStyle,
        {
          allowZero: false,
        },
      ]),
    ])
  })
  it('returns error if less than 22 cards', () => {
    const belowMinCards = 21
    const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default').mockReturnValue(card.artStyle)

    expect(
      validateDeck({
        cards: cards.slice(0, belowMinCards),
        faction: card.unit.faction.key,
      })
    ).toEqual([`Invalid number of cards at "${belowMinCards}", minimum is "22".`])

    expect(validatePositiveIntegerSpy.mock.calls).toEqual([
      ...new Array(belowMinCards).fill([
        card.artStyle,
        {
          allowZero: false,
        },
      ]),
    ])
  })
  it('returns errors if all rules violated', () => {
    const belowMinCards = 21
    const invalidFactionCard: DeckCard = {
      ...card,
      unit: {
        ...card.unit,
        id: 'invalid-card-faction-id',
        faction: {
          ...card.unit.faction,
          key: FactionKey.Skellige,
        },
      },
    }
    const invalidImageSmallCard: DeckCard = {
      unit: {
        ...card.unit,
        id: 'invalid-card-images-small-id',
      },
      artStyle: 0,
    }
    const invalidImageLargeCard: DeckCard = {
      unit: {
        ...card.unit,
        id: 'invalid-card-iamges-large-id',
      },
      artStyle: card.unit.images.length + 1,
    }
    const validatePositiveIntegerSpy = jest.spyOn(validatePositiveInteger, 'default')
    validatePositiveIntegerSpy.mockReturnValueOnce(card.artStyle)
    validatePositiveIntegerSpy.mockImplementationOnce(() => {
      throw Error('invalid')
    })
    validatePositiveIntegerSpy.mockReturnValueOnce(card.artStyle)
    for (let i = 0; i < belowMinCards; i++) {
      validatePositiveIntegerSpy.mockReturnValueOnce(card.artStyle)
    }

    expect(
      validateDeck({
        cards: [
          invalidFactionCard,
          invalidImageSmallCard,
          invalidImageLargeCard,
          ...cards.slice(0, belowMinCards - 3).map((deckCard) => {
            return {
              artStyle: deckCard.artStyle,
              unit: {
                ...deckCard.unit,
                special: true,
              },
            }
          }),
        ],
        faction: card.unit.faction.key,
      })
    ).toEqual([
      `Invalid faction "${invalidFactionCard.unit.faction.key}" for card "${invalidFactionCard.unit.id}", must be either "${card.unit.faction.key}" or "${FactionKey.Neutral}".`,
      `Invalid artStyle "${invalidImageSmallCard.artStyle}" for card "${invalidImageSmallCard.unit.id}", must be positive integer greater than zero.`,
      `Invalid artStyle "${invalidImageLargeCard.artStyle}" for card "${invalidImageLargeCard.unit.id}", only "${invalidImageLargeCard.unit.images.length}" art styles available for card.`,
      `Invalid number of special cards at "${belowMinCards - 3}", maximum is "10".`,
      `Invalid number of cards at "${belowMinCards}", minimum is "22".`,
    ])

    expect(validatePositiveIntegerSpy.mock.calls).toEqual([
      [
        invalidFactionCard.artStyle,
        {
          allowZero: false,
        },
      ],
      [
        invalidImageSmallCard.artStyle,
        {
          allowZero: false,
        },
      ],
      [
        invalidImageLargeCard.artStyle,
        {
          allowZero: false,
        },
      ],
      ...new Array(belowMinCards - 3).fill([
        card.artStyle,
        {
          allowZero: false,
        },
      ]),
    ])
  })
})
