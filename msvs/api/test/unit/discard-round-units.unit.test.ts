import DiscardRoundUnits from '../../src/graphql/resolvers/mutations/play-pass/discard-round-units'
import deepClone from '../util/deep-clone'
import TestUtil from '../util/test-util'
import { DeckUnitDbObject, GameDbObject, PlayerCombatRowDbObject } from '@gwent-oss/graphql-schema/database-typings'

describe('discard-round-units', () => {
  describe('discardRoundUnits', () => {
    it('adds nothing to discards if no field units or weathers', () => {
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
            deck: TestUtil.getDbGameDeck({}),
          }),
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
            deck: TestUtil.getDbGameDeck({}),
          }),
        ],
      })
      testDiscardRoundUnits({
        game: deepClone(game),
        getRowFieldUnitsAsDeckUnitsResponses: [[], [], [], [], [], []],
        updatedGame: game,
      })
    })
    it('adds field units and discards', () => {
      const deckUnit1 = TestUtil.getDbDeckUnit({})
      const deckUnit2 = TestUtil.getDbDeckUnit({})
      const deckUnit3 = TestUtil.getDbDeckUnit({})
      const deckUnit4 = TestUtil.getDbDeckUnit({})
      const deckUnit5 = TestUtil.getDbDeckUnit({})
      const deckUnit6 = TestUtil.getDbDeckUnit({})
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: deckUnit1.unit,
                    }),
                  ],
                }),
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: deckUnit2.unit,
                    }),
                  ],
                }),
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: deckUnit3.unit,
                    }),
                  ],
                }),
              }),
            ],
            deck: TestUtil.getDbGameDeck({}),
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: deckUnit4.unit,
                    }),
                  ],
                }),
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: deckUnit5.unit,
                    }),
                  ],
                }),
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: deckUnit6.unit,
                    }),
                  ],
                }),
              }),
            ],
            deck: TestUtil.getDbGameDeck({}),
          }),
        ],
      })
      testDiscardRoundUnits({
        game: deepClone(game),
        getRowFieldUnitsAsDeckUnitsResponses: [
          [deckUnit1],
          [deckUnit2],
          [deckUnit3],
          [deckUnit4],
          [deckUnit5],
          [deckUnit6],
        ],
        updatedGame: {
          ...game,
          players: [
            {
              ...game.players[0],
              deck: TestUtil.getDbGameDeck({
                discard: [deckUnit1, deckUnit2, deckUnit3],
              }),
            },
            {
              ...game.players[1],
              deck: TestUtil.getDbGameDeck({
                discard: [deckUnit4, deckUnit5, deckUnit6],
              }),
            },
          ],
        },
      })
    })

    it('adds weathers to discards', () => {
      const deckUnit1 = TestUtil.getDbDeckUnit({})
      const deckUnit2 = TestUtil.getDbDeckUnit({})
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                weathers: [
                  TestUtil.getDbWeatherUnit({
                    id: deckUnit1.unit,
                  }),
                ],
              }),
            ],
            deck: TestUtil.getDbGameDeck({}),
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                weathers: [
                  TestUtil.getDbWeatherUnit({
                    id: deckUnit2.unit,
                  }),
                ],
              }),
            ],
            deck: TestUtil.getDbGameDeck({}),
          }),
        ],
      })
      testDiscardRoundUnits({
        game: deepClone(game),
        getRowFieldUnitsAsDeckUnitsResponses: [[], [], [], [], [], []],
        updatedGame: {
          ...game,
          players: [
            {
              ...game.players[0],
              deck: TestUtil.getDbGameDeck({
                discard: [deckUnit1],
              }),
            },
            {
              ...game.players[1],
              deck: TestUtil.getDbGameDeck({
                discard: [deckUnit2],
              }),
            },
          ],
        },
      })
    })
    it('adds field units and weathers to discards', () => {
      const deckUnit1 = TestUtil.getDbDeckUnit({})
      const deckUnit2 = TestUtil.getDbDeckUnit({})
      const deckUnit3 = TestUtil.getDbDeckUnit({})
      const deckUnit4 = TestUtil.getDbDeckUnit({})
      const deckUnit5 = TestUtil.getDbDeckUnit({})
      const deckUnit6 = TestUtil.getDbDeckUnit({})
      const deckUnit7 = TestUtil.getDbDeckUnit({})
      const deckUnit8 = TestUtil.getDbDeckUnit({})
      const game = TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: deckUnit1.unit,
                    }),
                  ],
                }),
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: deckUnit2.unit,
                    }),
                  ],
                }),
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: deckUnit3.unit,
                    }),
                  ],
                }),
                weathers: [
                  TestUtil.getDbWeatherUnit({
                    id: deckUnit4.unit,
                  }),
                ],
              }),
            ],
            deck: TestUtil.getDbGameDeck({}),
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: deckUnit5.unit,
                    }),
                  ],
                }),
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: deckUnit6.unit,
                    }),
                  ],
                }),
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: deckUnit7.unit,
                    }),
                  ],
                }),
                weathers: [
                  TestUtil.getDbWeatherUnit({
                    id: deckUnit8.unit,
                  }),
                ],
              }),
            ],
            deck: TestUtil.getDbGameDeck({}),
          }),
        ],
      })
      testDiscardRoundUnits({
        game: deepClone(game),
        getRowFieldUnitsAsDeckUnitsResponses: [
          [deckUnit1],
          [deckUnit2],
          [deckUnit3],
          [deckUnit5],
          [deckUnit6],
          [deckUnit7],
        ],
        updatedGame: {
          ...game,
          players: [
            {
              ...game.players[0],
              deck: TestUtil.getDbGameDeck({
                discard: [deckUnit1, deckUnit2, deckUnit3, deckUnit4],
              }),
            },
            {
              ...game.players[1],
              deck: TestUtil.getDbGameDeck({
                discard: [deckUnit5, deckUnit6, deckUnit7, deckUnit8],
              }),
            },
          ],
        },
      })
    })
  })
  describe('getRowFieldUnitsAsDeckUnits', () => {
    it('returns empty array if no units or modifier', () => {
      testGetRowFieldUnitsAsDeckUnits({
        row: TestUtil.getDbPlayerCombatRow({}),
        expected: [],
      })
    })
    it('returns single item if single unit', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      testGetRowFieldUnitsAsDeckUnits({
        row: TestUtil.getDbPlayerCombatRow({
          units: [
            TestUtil.getDbFieldUnit({
              id: deckUnit.unit,
            }),
          ],
        }),
        expected: [deckUnit],
      })
    })
    it('returns single item if modifier', () => {
      const deckUnit = TestUtil.getDbDeckUnit({})
      testGetRowFieldUnitsAsDeckUnits({
        row: TestUtil.getDbPlayerCombatRow({
          modifier: TestUtil.getDbFieldUnit({
            id: deckUnit.unit,
          }),
        }),
        expected: [deckUnit],
      })
    })
    it('returns multiple items if multiple units', () => {
      const deckUnit1 = TestUtil.getDbDeckUnit({})
      const deckUnit2 = TestUtil.getDbDeckUnit({})
      testGetRowFieldUnitsAsDeckUnits({
        row: TestUtil.getDbPlayerCombatRow({
          units: [
            TestUtil.getDbFieldUnit({
              id: deckUnit1.unit,
            }),
            TestUtil.getDbFieldUnit({
              id: deckUnit2.unit,
            }),
          ],
        }),
        expected: [deckUnit1, deckUnit2],
      })
    })
    it('returns multiple items if single unit and modifier', () => {
      const deckUnit1 = TestUtil.getDbDeckUnit({})
      const deckUnit2 = TestUtil.getDbDeckUnit({})
      testGetRowFieldUnitsAsDeckUnits({
        row: TestUtil.getDbPlayerCombatRow({
          units: [
            TestUtil.getDbFieldUnit({
              id: deckUnit1.unit,
            }),
          ],
          modifier: TestUtil.getDbFieldUnit({
            id: deckUnit2.unit,
          }),
        }),
        expected: [deckUnit1, deckUnit2],
      })
    })
  })
})

function testDiscardRoundUnits({
  game,
  getRowFieldUnitsAsDeckUnitsResponses,
  updatedGame,
}: {
  game: GameDbObject
  getRowFieldUnitsAsDeckUnitsResponses: DeckUnitDbObject[][]
  updatedGame: GameDbObject
}) {
  const getRowFieldUnitsAsDeckUnitsSpy = jest.spyOn(DiscardRoundUnits as any, 'getRowFieldUnitsAsDeckUnits')
  for (const getRowFieldUnitsAsDeckUnitsResponse of getRowFieldUnitsAsDeckUnitsResponses) {
    getRowFieldUnitsAsDeckUnitsSpy.mockReturnValueOnce(getRowFieldUnitsAsDeckUnitsResponse)
  }

  expect(DiscardRoundUnits.discardRoundUnits(game)).toEqual(undefined)

  expect(game).toEqual(updatedGame)

  expect(getRowFieldUnitsAsDeckUnitsSpy.mock.calls).toEqual([
    ...game.players
      .map((player) => {
        return [
          [player.rounds[game.round - 1].close],
          [player.rounds[game.round - 1].ranged],
          [player.rounds[game.round - 1].siege],
        ]
      })
      .flat(),
  ])
}

function testGetRowFieldUnitsAsDeckUnits({
  row,
  expected,
}: {
  row: PlayerCombatRowDbObject
  expected: DeckUnitDbObject[]
}) {
  expect(DiscardRoundUnits['getRowFieldUnitsAsDeckUnits'](row)).toEqual(expected)
}
