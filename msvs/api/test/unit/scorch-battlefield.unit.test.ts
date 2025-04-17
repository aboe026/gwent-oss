import { ObjectId } from 'mongodb'

import {
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  GameUnitDbObject,
  PlayerCombatRowDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import scorchBattelfield, { scorchUnitsInRow } from '../../src/graphql/resolvers/mutations/play-unit/scorch-battlefield'
import TestUtil from '../util/test-util'
import * as getEffectWithKey from '../../src/graphql/resolvers/mutations/play-unit/get-effect-with-key'
import * as getGameUnits from '../../src/graphql/resolvers/mutations/play-unit/get-game-units'
import * as getStrongestNonHeroUnits from '../../src/graphql/resolvers/mutations/play-unit/get-strongest-non-hero-units'
import deepClone from '../util/deep-clone'

describe('scorch-battlefield', () => {
  describe('scorchBattlefield', () => {
    it('throws error if newDeckUnit not in battlefieldUnits', () => {
      const scorchEffect = TestUtil.getDbEffect({
        key: EffectKey.Scorch,
      })
      const unit = TestUtil.getDbUnit({})
      const self = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const game = TestUtil.getDbGame({
        players: [
          self,
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          }),
        ],
        turn: self.user,
        round: 1,
      })

      testScorchBattlefield({
        battlefieldUnits: [
          TestUtil.getDbUnit({
            effects: [scorchEffect._id],
          }),
        ],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit._id,
        }),
        scorchEffect,
        game,
        expected: Error(`Could not find unit for new deck unit "${unit._id}"`),
      })
    })
    it('does not perform scorching if newDeckUnit does not have scorch effect', () => {
      const scorchEffect = TestUtil.getDbEffect({
        key: EffectKey.Scorch,
      })
      const unit = TestUtil.getDbUnit({})
      const self = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const game = TestUtil.getDbGame({
        players: [
          self,
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          }),
        ],
        turn: self.user,
        round: 1,
      })
      const origGame = deepClone(game)

      testScorchBattlefield({
        battlefieldUnits: [
          unit,
          TestUtil.getDbUnit({
            effects: [scorchEffect._id],
          }),
        ],
        newDeckUnit: TestUtil.getDbDeckUnit({
          id: unit._id,
        }),
        scorchEffect,
        game,
        expected: origGame,
      })
    })
    it('removes Scorch if no other units on battlefield', () => {
      const scorchEffect = TestUtil.getDbEffect({
        key: EffectKey.Scorch,
      })
      const unit = TestUtil.getDbUnit({
        name: 'Scorch',
        effects: [scorchEffect._id],
      })
      const newDeckUnit = TestUtil.getDbDeckUnit({
        id: unit._id,
      })
      const self = TestUtil.getDbGamePlayer({
        rounds: [TestUtil.getDbPlayerRound({})],
      })
      const game = TestUtil.getDbGame({
        players: [
          self,
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          }),
        ],
        turn: self.user,
        round: 1,
      })
      const origGame = deepClone(game)

      testScorchBattlefield({
        battlefieldUnits: [unit],
        newDeckUnit,
        scorchEffect,
        game,
        strongestGameUnits: [],
        getGameUnitsCalls: [
          [
            {
              combat: undefined,
              players: game.players,
              round: 1,
            },
          ],
        ],
        expected: {
          ...origGame,
          players: [
            {
              ...origGame.players[0],
              deck: {
                ...origGame.players[0].deck,
                discard: [newDeckUnit],
              },
            },
            origGame.players[1],
          ],
        },
      })
    })
    describe('close combat', () => {
      // TODO: refactor to mock out scorchUnitsInRow
      it('removes Scorch and other unit if single self unit on battlefield', () => {
        const scorchEffect = TestUtil.getDbEffect({
          key: EffectKey.Scorch,
        })
        const unit = TestUtil.getDbUnit({
          name: 'Scorch',
          effects: [scorchEffect._id],
        })
        const newDeckUnit = TestUtil.getDbDeckUnit({
          id: unit._id,
        })
        const strongestGameUnit = TestUtil.getDbGameUnit({})
        const self = TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              close: {
                score: 0,
                units: [strongestGameUnit],
              },
            }),
          ],
        })
        const game = TestUtil.getDbGame({
          players: [
            self,
            TestUtil.getDbGamePlayer({
              rounds: [TestUtil.getDbPlayerRound({})],
            }),
          ],
          turn: self.user,
          round: 1,
        })
        const origGame = deepClone(game)

        testScorchBattlefield({
          battlefieldUnits: [unit],
          newDeckUnit,
          scorchEffect,
          game,
          strongestGameUnits: [strongestGameUnit],
          getGameUnitsCalls: [
            [
              {
                combat: undefined,
                players: game.players,
                round: 1,
              },
            ],
          ],
          expected: {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  discard: [newDeckUnit, strongestGameUnit],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    close: {
                      score: 0,
                      units: [],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          },
        })
      })
      it('removes Scorch and other unit if single strongest self unit on battlefield', () => {
        const scorchEffect = TestUtil.getDbEffect({
          key: EffectKey.Scorch,
        })
        const unit = TestUtil.getDbUnit({
          name: 'Scorch',
          effects: [scorchEffect._id],
        })
        const newDeckUnit = TestUtil.getDbDeckUnit({
          id: unit._id,
        })
        const strongestGameUnit = TestUtil.getDbGameUnit({})
        const self = TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              close: {
                score: 0,
                units: [TestUtil.getDbGameUnit({}), strongestGameUnit, TestUtil.getDbGameUnit({})],
              },
            }),
          ],
        })
        const game = TestUtil.getDbGame({
          players: [
            self,
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [TestUtil.getDbGameUnit({})],
                  },
                }),
              ],
            }),
          ],
          turn: self.user,
          round: 1,
        })
        const origGame = deepClone(game)

        testScorchBattlefield({
          battlefieldUnits: [unit],
          newDeckUnit,
          scorchEffect,
          game,
          strongestGameUnits: [strongestGameUnit],
          getGameUnitsCalls: [
            [
              {
                combat: undefined,
                players: game.players,
                round: 1,
              },
            ],
          ],
          expected: {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  discard: [newDeckUnit, strongestGameUnit],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    close: {
                      score: 0,
                      units: [
                        origGame.players[0].rounds[0].close.units[0],
                        origGame.players[0].rounds[0].close.units[2],
                      ],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          },
        })
      })
      it('removes Scorch and other units if multiple strongest self units on battlefield', () => {
        const scorchEffect = TestUtil.getDbEffect({
          key: EffectKey.Scorch,
        })
        const unit = TestUtil.getDbUnit({
          name: 'Scorch',
          effects: [scorchEffect._id],
        })
        const newDeckUnit = TestUtil.getDbDeckUnit({
          id: unit._id,
        })
        const strongestGameUnit1 = TestUtil.getDbGameUnit({})
        const strongestGameUnit2 = TestUtil.getDbGameUnit({})
        const self = TestUtil.getDbGamePlayer({
          rounds: [
            TestUtil.getDbPlayerRound({
              close: {
                score: 0,
                units: [strongestGameUnit1, strongestGameUnit2],
              },
            }),
          ],
        })
        const game = TestUtil.getDbGame({
          players: [
            self,
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [TestUtil.getDbGameUnit({})],
                  },
                }),
              ],
            }),
          ],
          turn: self.user,
          round: 1,
        })
        const origGame = deepClone(game)

        testScorchBattlefield({
          battlefieldUnits: [unit],
          newDeckUnit,
          scorchEffect,
          game,
          strongestGameUnits: [strongestGameUnit1, strongestGameUnit2],
          getGameUnitsCalls: [
            [
              {
                combat: undefined,
                players: game.players,
                round: 1,
              },
            ],
          ],
          expected: {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  discard: [newDeckUnit, strongestGameUnit1, strongestGameUnit2],
                },
                rounds: [
                  {
                    ...origGame.players[0].rounds[0],
                    close: {
                      score: 0,
                      units: [],
                    },
                  },
                ],
              },
              origGame.players[1],
            ],
          },
        })
      })
      it('removes Scorch and other unit if single opponent unit on battlefield', () => {
        const scorchEffect = TestUtil.getDbEffect({
          key: EffectKey.Scorch,
        })
        const unit = TestUtil.getDbUnit({
          name: 'Scorch',
          effects: [scorchEffect._id],
        })
        const newDeckUnit = TestUtil.getDbDeckUnit({
          id: unit._id,
        })
        const strongestGameUnit = TestUtil.getDbGameUnit({})
        const self = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const game = TestUtil.getDbGame({
          players: [
            self,
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [strongestGameUnit],
                  },
                }),
              ],
            }),
          ],
          turn: self.user,
          round: 1,
        })
        const origGame = deepClone(game)

        testScorchBattlefield({
          battlefieldUnits: [unit],
          newDeckUnit,
          scorchEffect,
          game,
          strongestGameUnits: [strongestGameUnit],
          getGameUnitsCalls: [
            [
              {
                combat: undefined,
                players: game.players,
                round: 1,
              },
            ],
          ],
          expected: {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  discard: [newDeckUnit],
                },
              },
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  discard: [strongestGameUnit],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    close: {
                      score: 0,
                      units: [],
                    },
                  },
                ],
              },
            ],
          },
        })
      })
      it('removes Scorch and other unit if single strongest opponent unit on battlefield', () => {
        const scorchEffect = TestUtil.getDbEffect({
          key: EffectKey.Scorch,
        })
        const unit = TestUtil.getDbUnit({
          name: 'Scorch',
          effects: [scorchEffect._id],
        })
        const newDeckUnit = TestUtil.getDbDeckUnit({
          id: unit._id,
        })
        const strongestGameUnit = TestUtil.getDbGameUnit({})
        const self = TestUtil.getDbGamePlayer({
          rounds: [TestUtil.getDbPlayerRound({})],
        })
        const game = TestUtil.getDbGame({
          players: [
            self,
            TestUtil.getDbGamePlayer({
              rounds: [
                TestUtil.getDbPlayerRound({
                  close: {
                    score: 0,
                    units: [TestUtil.getDbGameUnit({}), strongestGameUnit, TestUtil.getDbGameUnit({})],
                  },
                }),
              ],
            }),
          ],
          turn: self.user,
          round: 1,
        })
        const origGame = deepClone(game)

        testScorchBattlefield({
          battlefieldUnits: [unit],
          newDeckUnit,
          scorchEffect,
          game,
          strongestGameUnits: [strongestGameUnit],
          getGameUnitsCalls: [
            [
              {
                combat: undefined,
                players: game.players,
                round: 1,
              },
            ],
          ],
          expected: {
            ...origGame,
            players: [
              {
                ...origGame.players[0],
                deck: {
                  ...origGame.players[0].deck,
                  discard: [newDeckUnit],
                },
              },
              {
                ...origGame.players[1],
                deck: {
                  ...origGame.players[1].deck,
                  discard: [strongestGameUnit],
                },
                rounds: [
                  {
                    ...origGame.players[1].rounds[0],
                    close: {
                      score: 0,
                      units: [
                        origGame.players[1].rounds[0].close.units[0],
                        origGame.players[1].rounds[0].close.units[2],
                      ],
                    },
                  },
                ],
              },
            ],
          },
        })
      })
    })
  })
  describe('scorchUnitsInRow', () => {
    describe('empty strongestUnitIds', () => {
      it('does nothing if no units in row', () => {
        const unitsLost: GameUnitDbObject[] = []
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [],
        }

        expect(
          scorchUnitsInRow({
            row,
            strongestUnitIds: [],
            unitsLost,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          score: 0,
          units: [],
        })
        expect(unitsLost).toEqual([])
      })
      it('does not remove single unit if not in strongestUnitIds', () => {
        const unitsLost: GameUnitDbObject[] = []
        const unit = TestUtil.getDbGameUnit({})
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [unit],
        }

        expect(
          scorchUnitsInRow({
            row,
            strongestUnitIds: [],
            unitsLost,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          score: 0,
          units: [unit],
        })
        expect(unitsLost).toEqual([])
      })
      it('does not remove multiple units if none in strongestUnitIds', () => {
        const unitsLost: GameUnitDbObject[] = []
        const unit1 = TestUtil.getDbGameUnit({})
        const unit2 = TestUtil.getDbGameUnit({})
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [unit1, unit2],
        }

        expect(
          scorchUnitsInRow({
            row,
            strongestUnitIds: [],
            unitsLost,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          score: 0,
          units: [unit1, unit2],
        })
        expect(unitsLost).toEqual([])
      })
    })
    describe('single strongestUnitIds', () => {
      it('does nothing if no units in row', () => {
        const unitsLost: GameUnitDbObject[] = []
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [],
        }

        expect(
          scorchUnitsInRow({
            row,
            strongestUnitIds: [new ObjectId().toString()],
            unitsLost,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          score: 0,
          units: [],
        })
        expect(unitsLost).toEqual([])
      })
      it('does not remove single unit if not in strongestUnitIds', () => {
        const unitsLost: GameUnitDbObject[] = []
        const unit = TestUtil.getDbGameUnit({})
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [unit],
        }

        expect(
          scorchUnitsInRow({
            row,
            strongestUnitIds: [new ObjectId().toString()],
            unitsLost,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          score: 0,
          units: [unit],
        })
        expect(unitsLost).toEqual([])
      })
      it('does not remove multiple units if none in strongestUnitIds', () => {
        const unitsLost: GameUnitDbObject[] = []
        const unit1 = TestUtil.getDbGameUnit({})
        const unit2 = TestUtil.getDbGameUnit({})
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [unit1, unit2],
        }

        expect(
          scorchUnitsInRow({
            row,
            strongestUnitIds: [new ObjectId().toString()],
            unitsLost,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          score: 0,
          units: [unit1, unit2],
        })
        expect(unitsLost).toEqual([])
      })
      it('removes single unit if in strongestUnitIds', () => {
        const unitsLost: GameUnitDbObject[] = []
        const unit = TestUtil.getDbGameUnit({})
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [unit],
        }

        expect(
          scorchUnitsInRow({
            row,
            strongestUnitIds: [unit.unit.toString()],
            unitsLost,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          score: 0,
          units: [],
        })
        expect(unitsLost).toEqual([unit])
      })
      it('remove first unit if first in strongestUnitIds', () => {
        const unitsLost: GameUnitDbObject[] = []
        const unit1 = TestUtil.getDbGameUnit({})
        const unit2 = TestUtil.getDbGameUnit({})
        const unit3 = TestUtil.getDbGameUnit({})
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [unit1, unit2, unit3],
        }

        expect(
          scorchUnitsInRow({
            row,
            strongestUnitIds: [unit1.unit.toString()],
            unitsLost,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          score: 0,
          units: [unit2, unit3],
        })
        expect(unitsLost).toEqual([unit1])
      })
      it('remove middle unit if middle in strongestUnitIds', () => {
        const unitsLost: GameUnitDbObject[] = []
        const unit1 = TestUtil.getDbGameUnit({})
        const unit2 = TestUtil.getDbGameUnit({})
        const unit3 = TestUtil.getDbGameUnit({})
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [unit1, unit2, unit3],
        }

        expect(
          scorchUnitsInRow({
            row,
            strongestUnitIds: [unit2.unit.toString()],
            unitsLost,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          score: 0,
          units: [unit1, unit3],
        })
        expect(unitsLost).toEqual([unit2])
      })
      it('remove last unit if last in strongestUnitIds', () => {
        const unitsLost: GameUnitDbObject[] = []
        const unit1 = TestUtil.getDbGameUnit({})
        const unit2 = TestUtil.getDbGameUnit({})
        const unit3 = TestUtil.getDbGameUnit({})
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [unit1, unit2, unit3],
        }

        expect(
          scorchUnitsInRow({
            row,
            strongestUnitIds: [unit3.unit.toString()],
            unitsLost,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          score: 0,
          units: [unit1, unit2],
        })
        expect(unitsLost).toEqual([unit3])
      })
      it('removes first two unit if first two in strongestUnitIds', () => {
        const unitsLost: GameUnitDbObject[] = []
        const unit1 = TestUtil.getDbGameUnit({})
        const unit2 = TestUtil.getDbGameUnit({})
        const unit3 = TestUtil.getDbGameUnit({})
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [unit1, unit2, unit3],
        }

        expect(
          scorchUnitsInRow({
            row,
            strongestUnitIds: [unit1.unit.toString(), unit2.unit.toString()],
            unitsLost,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          score: 0,
          units: [unit3],
        })
        expect(unitsLost).toEqual([unit1, unit2])
      })
      it('removes last two unit if last two in strongestUnitIds', () => {
        const unitsLost: GameUnitDbObject[] = []
        const unit1 = TestUtil.getDbGameUnit({})
        const unit2 = TestUtil.getDbGameUnit({})
        const unit3 = TestUtil.getDbGameUnit({})
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [unit1, unit2, unit3],
        }

        expect(
          scorchUnitsInRow({
            row,
            strongestUnitIds: [unit2.unit.toString(), unit3.unit.toString()],
            unitsLost,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          score: 0,
          units: [unit1],
        })
        expect(unitsLost).toEqual([unit2, unit3])
      })
      it('removes all units if all in strongestUnitIds', () => {
        const unitsLost: GameUnitDbObject[] = []
        const unit1 = TestUtil.getDbGameUnit({})
        const unit2 = TestUtil.getDbGameUnit({})
        const unit3 = TestUtil.getDbGameUnit({})
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [unit1, unit2, unit3],
        }

        expect(
          scorchUnitsInRow({
            row,
            strongestUnitIds: [unit1.unit.toString(), unit2.unit.toString(), unit3.unit.toString()],
            unitsLost,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          score: 0,
          units: [],
        })
        expect(unitsLost).toEqual([unit1, unit2, unit3])
      })
    })
  })
})

function testScorchBattlefield({
  battlefieldUnits,
  scorchEffect,
  game,
  newDeckUnit,
  strongestGameUnits,
  expected,
  getGameUnitsCalls = [],
}: {
  battlefieldUnits: UnitDbObject[]
  scorchEffect: EffectDbObject | undefined
  game: GameDbObject
  newDeckUnit: DeckUnitDbObject
  strongestGameUnits?: GameUnitDbObject[]
  expected: GameDbObject | Error
  getGameUnitsCalls?: any[][]
}) {
  const effects = [TestUtil.getDbEffect({}), TestUtil.getDbEffect({})]
  const gameUnits = [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})]
  const getEffectWithKeySpy = jest.spyOn(getEffectWithKey, 'default').mockReturnValue(scorchEffect)
  const getGameUnitsSpy = jest.spyOn(getGameUnits, 'default').mockReturnValue(gameUnits)
  const getStrongestNonHeroUnitsSpy = jest.spyOn(getStrongestNonHeroUnits, 'default')
  if (strongestGameUnits) {
    getStrongestNonHeroUnitsSpy.mockReturnValue(strongestGameUnits)
  }

  if (expected instanceof Error) {
    expect(() =>
      scorchBattelfield({
        battlefieldUnits,
        effects,
        game,
        newDeckUnit,
      })
    ).toThrow(expected)
  } else {
    expect(
      scorchBattelfield({
        battlefieldUnits,
        effects,
        game,
        newDeckUnit,
      })
    ).toEqual(undefined)
    expect(game).toEqual(expected)
  }

  expect(getEffectWithKeySpy.mock.calls).toEqual([
    [
      {
        effectKey: EffectKey.Scorch,
        effects,
      },
    ],
  ])
  expect(getGameUnitsSpy.mock.calls).toEqual(getGameUnitsCalls)
  expect(getStrongestNonHeroUnitsSpy.mock.calls).toEqual(
    strongestGameUnits
      ? [
          [
            {
              gameUnits,
              units: battlefieldUnits,
              minimumStrength: battlefieldUnits.find((unit) => unit._id.toString() === newDeckUnit.unit.toString())
                ?.scorchMin,
            },
          ],
        ]
      : []
  )
}
