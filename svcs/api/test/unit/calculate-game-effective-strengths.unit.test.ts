import {
  EffectDbObject,
  EffectKey,
  PlayerCombatRowDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import CalculateGameEffectiveStrengths from '../../src/graphql/resolvers/mutations/util/calculate-game-effective-strengths'
import TestUtil from '../util/test-util'
import deepClone from '../util/deep-clone'
import { EffectReasonType } from '@gwent/graphql-schema'
import { ObjectId } from 'mongodb'

describe('calculate-game-effective-strengths', () => {
  describe('calculateEffectiveStrengths', () => {
    it('calls to calculateEffectiveStrengthsForRow for each combat type for each player', () => {
      const calculateEffectiveStrengthsForRowSpy = jest
        .spyOn(CalculateGameEffectiveStrengths as any, 'calculateEffectiveStrengthsForRow')
        .mockImplementation()

      const effects = [TestUtil.getDbEffect({})]
      const units = [TestUtil.getDbUnit({})]
      const game = TestUtil.getDbGame({
        round: 2,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({}),
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({})],
                },
                ranged: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
                },
                siege: {
                  score: 0,
                  units: [TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({}), TestUtil.getDbGameUnit({})],
                },
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({}),
              TestUtil.getDbPlayerRound({
                close: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({}),
                    TestUtil.getDbGameUnit({}),
                    TestUtil.getDbGameUnit({}),
                    TestUtil.getDbGameUnit({}),
                  ],
                },
                ranged: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({}),
                    TestUtil.getDbGameUnit({}),
                    TestUtil.getDbGameUnit({}),
                    TestUtil.getDbGameUnit({}),
                    TestUtil.getDbGameUnit({}),
                  ],
                },
                siege: {
                  score: 0,
                  units: [
                    TestUtil.getDbGameUnit({}),
                    TestUtil.getDbGameUnit({}),
                    TestUtil.getDbGameUnit({}),
                    TestUtil.getDbGameUnit({}),
                    TestUtil.getDbGameUnit({}),
                    TestUtil.getDbGameUnit({}),
                  ],
                },
              }),
            ],
          }),
        ],
      })

      expect(
        CalculateGameEffectiveStrengths.calculateEffectiveStrengths({
          effects,
          game,
          units,
        })
      ).toEqual(undefined)

      expect(calculateEffectiveStrengthsForRowSpy.mock.calls).toEqual([
        [
          {
            row: game.players[0].rounds[1].close,
            units,
            effects,
          },
        ],
        [
          {
            row: game.players[0].rounds[1].ranged,
            units,
            effects,
          },
        ],
        [
          {
            row: game.players[0].rounds[1].siege,
            units,
            effects,
          },
        ],
        [
          {
            row: game.players[1].rounds[1].close,
            units,
            effects,
          },
        ],
        [
          {
            row: game.players[1].rounds[1].ranged,
            units,
            effects,
          },
        ],
        [
          {
            row: game.players[1].rounds[1].siege,
            units,
            effects,
          },
        ],
      ])
    })
  })
  describe('calculateEffectiveStrengthsForRow', () => {
    describe('no effects', () => {
      it('throws error if unit with ID not contained in units', () => {
        const id = new ObjectId()
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [
            TestUtil.getDbGameUnit({
              id,
            }),
          ],
        }

        expect(() =>
          CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
            effects: [],
            row,
            units: [],
          })
        ).toThrow(`Could not find Unit with ID "${id}"`)
      })
      it('does nothing if no units in the row', () => {
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [],
        }
        const origRow = deepClone(row)

        expect(
          CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
            effects: [],
            row,
            units: [],
          })
        ).toEqual(undefined)

        expect(row).toEqual(origRow)
      })
      it('sets effectiveStrength to undefined if strength is undefined and no effective strength', () => {
        const units: UnitDbObject[] = [TestUtil.getDbUnit({})]
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [
            TestUtil.getDbGameUnit({
              id: units[0]._id,
            }),
          ],
        }
        const origRow = deepClone(row)

        expect(
          CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
            effects: [],
            row,
            units,
          })
        ).toEqual(undefined)

        expect(row).toEqual(origRow)
      })
      it('sets effectiveStrength to strength if zero and no effective strength', () => {
        const units: UnitDbObject[] = [
          TestUtil.getDbUnit({
            strength: 0,
          }),
        ]
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [
            TestUtil.getDbGameUnit({
              id: units[0]._id,
            }),
          ],
        }
        const origRow = deepClone(row)

        expect(
          CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
            effects: [],
            row,
            units,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          ...origRow,
          units: [
            {
              ...origRow.units[0],
              effectiveStrength: 0,
            },
          ],
        })
      })
      it('sets effectiveStrength to strength if non-zero and no effective strength', () => {
        const units: UnitDbObject[] = [
          TestUtil.getDbUnit({
            strength: 1,
          }),
        ]
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [
            TestUtil.getDbGameUnit({
              id: units[0]._id,
            }),
          ],
        }
        const origRow = deepClone(row)

        expect(
          CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
            effects: [],
            row,
            units,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          ...origRow,
          units: [
            {
              ...origRow.units[0],
              effectiveStrength: 1,
            },
          ],
        })
      })
    })
    describe('morale', () => {
      it('morale does not increment its own effectiveStrength', () => {
        const effects: EffectDbObject[] = [
          TestUtil.getDbEffect({
            key: EffectKey.Morale,
          }),
        ]
        const units: UnitDbObject[] = [
          TestUtil.getDbUnit({
            strength: 0,
            effects: [effects[0]._id],
          }),
        ]
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [
            TestUtil.getDbGameUnit({
              id: units[0]._id,
            }),
          ],
        }
        const origRow = deepClone(row)

        expect(
          CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
            effects,
            row,
            units,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          ...origRow,
          units: [
            {
              ...origRow.units[0],
              effectiveStrength: 0,
            },
          ],
        })
      })
      it('morale increments effectiveStrength of neighbor with zero strength before it by 1', () => {
        const effects: EffectDbObject[] = [
          TestUtil.getDbEffect({
            key: EffectKey.Morale,
          }),
        ]
        const units: UnitDbObject[] = [
          TestUtil.getDbUnit({
            strength: 0,
          }),
          TestUtil.getDbUnit({
            strength: 0,
            effects: [effects[0]._id],
          }),
        ]
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [
            TestUtil.getDbGameUnit({
              id: units[0]._id,
            }),
            TestUtil.getDbGameUnit({
              id: units[1]._id,
            }),
          ],
        }
        const origRow = deepClone(row)

        expect(
          CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
            effects,
            row,
            units,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          ...origRow,
          units: [
            {
              ...origRow.units[0],
              effectiveStrength: 1,
              effects: [
                {
                  operator: '+1',
                  total: 1,
                  reason: {
                    effect: effects[0]._id,
                    type: EffectReasonType.Unit,
                    unit: units[1]._id,
                  },
                },
              ],
            },
            {
              ...origRow.units[1],
              effectiveStrength: 0,
            },
          ],
        })
      })
      it('morale increments effectiveStrength of neighbor with non-zero strength before it by 1', () => {
        const effects: EffectDbObject[] = [
          TestUtil.getDbEffect({
            key: EffectKey.Morale,
          }),
        ]
        const units: UnitDbObject[] = [
          TestUtil.getDbUnit({
            strength: 1,
          }),
          TestUtil.getDbUnit({
            strength: 0,
            effects: [effects[0]._id],
          }),
        ]
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [
            TestUtil.getDbGameUnit({
              id: units[0]._id,
            }),
            TestUtil.getDbGameUnit({
              id: units[1]._id,
            }),
          ],
        }
        const origRow = deepClone(row)

        expect(
          CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
            effects,
            row,
            units,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          ...origRow,
          units: [
            {
              ...origRow.units[0],
              effectiveStrength: 2,
              effects: [
                {
                  operator: '+1',
                  total: 2,
                  reason: {
                    effect: effects[0]._id,
                    type: EffectReasonType.Unit,
                    unit: units[1]._id,
                  },
                },
              ],
            },
            {
              ...origRow.units[1],
              effectiveStrength: 0,
            },
          ],
        })
      })
      it('morale increments effectiveStrength of neighbor with zero strength after it by 1', () => {
        const effects: EffectDbObject[] = [
          TestUtil.getDbEffect({
            key: EffectKey.Morale,
          }),
        ]
        const units: UnitDbObject[] = [
          TestUtil.getDbUnit({
            strength: 0,
            effects: [effects[0]._id],
          }),
          TestUtil.getDbUnit({
            strength: 0,
          }),
        ]
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [
            TestUtil.getDbGameUnit({
              id: units[0]._id,
            }),
            TestUtil.getDbGameUnit({
              id: units[1]._id,
            }),
          ],
        }
        const origRow = deepClone(row)

        expect(
          CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
            effects,
            row,
            units,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          ...origRow,
          units: [
            {
              ...origRow.units[0],
              effectiveStrength: 0,
            },
            {
              ...origRow.units[1],
              effectiveStrength: 1,
              effects: [
                {
                  operator: '+1',
                  total: 1,
                  reason: {
                    effect: effects[0]._id,
                    type: EffectReasonType.Unit,
                    unit: units[0]._id,
                  },
                },
              ],
            },
          ],
        })
      })
      it('morale increments effectiveStrength of neighbor with non-zero strength after it by 1', () => {
        const effects: EffectDbObject[] = [
          TestUtil.getDbEffect({
            key: EffectKey.Morale,
          }),
        ]
        const units: UnitDbObject[] = [
          TestUtil.getDbUnit({
            strength: 0,
            effects: [effects[0]._id],
          }),
          TestUtil.getDbUnit({
            strength: 1,
          }),
        ]
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [
            TestUtil.getDbGameUnit({
              id: units[0]._id,
            }),
            TestUtil.getDbGameUnit({
              id: units[1]._id,
            }),
          ],
        }
        const origRow = deepClone(row)

        expect(
          CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
            effects,
            row,
            units,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          ...origRow,
          units: [
            {
              ...origRow.units[0],
              effectiveStrength: 0,
            },
            {
              ...origRow.units[1],
              effectiveStrength: 2,
              effects: [
                {
                  operator: '+1',
                  total: 2,
                  reason: {
                    effect: effects[0]._id,
                    type: EffectReasonType.Unit,
                    unit: units[0]._id,
                  },
                },
              ],
            },
          ],
        })
      })
      it('morale increments effectiveStrength of neighbors with same strengths surrounding it by 1', () => {
        const effects: EffectDbObject[] = [
          TestUtil.getDbEffect({
            key: EffectKey.Morale,
          }),
        ]
        const units: UnitDbObject[] = [
          TestUtil.getDbUnit({
            strength: 1,
          }),
          TestUtil.getDbUnit({
            strength: 1,
            effects: [effects[0]._id],
          }),
          TestUtil.getDbUnit({
            strength: 1,
          }),
        ]
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [
            TestUtil.getDbGameUnit({
              id: units[0]._id,
            }),
            TestUtil.getDbGameUnit({
              id: units[1]._id,
            }),
            TestUtil.getDbGameUnit({
              id: units[2]._id,
            }),
          ],
        }
        const origRow = deepClone(row)

        expect(
          CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
            effects,
            row,
            units,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          ...origRow,
          units: [
            {
              ...origRow.units[0],
              effectiveStrength: 2,
              effects: [
                {
                  operator: '+1',
                  total: 2,
                  reason: {
                    effect: effects[0]._id,
                    type: EffectReasonType.Unit,
                    unit: units[1]._id,
                  },
                },
              ],
            },
            {
              ...origRow.units[1],
              effectiveStrength: 1,
            },
            {
              ...origRow.units[2],
              effectiveStrength: 2,
              effects: [
                {
                  operator: '+1',
                  total: 2,
                  reason: {
                    effect: effects[0]._id,
                    type: EffectReasonType.Unit,
                    unit: units[1]._id,
                  },
                },
              ],
            },
          ],
        })
      })
      it('morale increments effectiveStrength of neighbors with different strengths surrounding it by 1', () => {
        const effects: EffectDbObject[] = [
          TestUtil.getDbEffect({
            key: EffectKey.Morale,
          }),
        ]
        const units: UnitDbObject[] = [
          TestUtil.getDbUnit({
            strength: 1,
          }),
          TestUtil.getDbUnit({
            strength: 2,
            effects: [effects[0]._id],
          }),
          TestUtil.getDbUnit({
            strength: 3,
          }),
        ]
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [
            TestUtil.getDbGameUnit({
              id: units[2]._id,
            }),
            TestUtil.getDbGameUnit({
              id: units[1]._id,
            }),
            TestUtil.getDbGameUnit({
              id: units[0]._id,
            }),
          ],
        }
        const origRow = deepClone(row)

        expect(
          CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
            effects,
            row,
            units,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          ...origRow,
          units: [
            {
              ...origRow.units[0],
              effectiveStrength: 4,
              effects: [
                {
                  operator: '+1',
                  total: 4,
                  reason: {
                    effect: effects[0]._id,
                    type: EffectReasonType.Unit,
                    unit: units[1]._id,
                  },
                },
              ],
            },
            {
              ...origRow.units[1],
              effectiveStrength: 2,
            },
            {
              ...origRow.units[2],
              effectiveStrength: 2,
              effects: [
                {
                  operator: '+1',
                  total: 2,
                  reason: {
                    effect: effects[0]._id,
                    type: EffectReasonType.Unit,
                    unit: units[1]._id,
                  },
                },
              ],
            },
          ],
        })
      })
      it('morale does not effect hero', () => {
        const effects: EffectDbObject[] = [
          TestUtil.getDbEffect({
            key: EffectKey.Morale,
          }),
        ]
        const units: UnitDbObject[] = [
          TestUtil.getDbUnit({
            strength: 10,
            hero: true,
          }),
          TestUtil.getDbUnit({
            strength: 0,
            effects: [effects[0]._id],
          }),
        ]
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [
            TestUtil.getDbGameUnit({
              id: units[0]._id,
            }),
            TestUtil.getDbGameUnit({
              id: units[1]._id,
            }),
          ],
        }
        const origRow = deepClone(row)

        expect(
          CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
            effects,
            row,
            units,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          ...origRow,
          units: [
            {
              ...origRow.units[0],
              effectiveStrength: 10,
            },
            {
              ...origRow.units[1],
              effectiveStrength: 0,
            },
          ],
        })
      })
      it('morale effects other morales', () => {
        const effects: EffectDbObject[] = [
          TestUtil.getDbEffect({
            key: EffectKey.Morale,
          }),
        ]
        const units: UnitDbObject[] = [
          TestUtil.getDbUnit({
            strength: 0,
            effects: [effects[0]._id],
          }),
          TestUtil.getDbUnit({
            strength: 0,
            effects: [effects[0]._id],
          }),
        ]
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [
            TestUtil.getDbGameUnit({
              id: units[0]._id,
            }),
            TestUtil.getDbGameUnit({
              id: units[1]._id,
            }),
          ],
        }
        const origRow = deepClone(row)

        expect(
          CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
            effects,
            row,
            units,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          ...origRow,
          units: [
            {
              ...origRow.units[0],
              effectiveStrength: 1,
              effects: [
                {
                  operator: '+1',
                  total: 1,
                  reason: {
                    effect: effects[0]._id,
                    type: EffectReasonType.Unit,
                    unit: units[1]._id,
                  },
                },
              ],
            },
            {
              ...origRow.units[1],
              effectiveStrength: 1,
              effects: [
                {
                  operator: '+1',
                  total: 1,
                  reason: {
                    effect: effects[0]._id,
                    type: EffectReasonType.Unit,
                    unit: units[0]._id,
                  },
                },
              ],
            },
          ],
        })
      })
      it('morale does not effect other hero morale', () => {
        const effects: EffectDbObject[] = [
          TestUtil.getDbEffect({
            key: EffectKey.Morale,
          }),
        ]
        const units: UnitDbObject[] = [
          TestUtil.getDbUnit({
            strength: 0,
            effects: [effects[0]._id],
          }),
          TestUtil.getDbUnit({
            strength: 0,
            effects: [effects[0]._id],
            hero: true,
          }),
        ]
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [
            TestUtil.getDbGameUnit({
              id: units[0]._id,
            }),
            TestUtil.getDbGameUnit({
              id: units[1]._id,
            }),
          ],
        }
        const origRow = deepClone(row)

        expect(
          CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
            effects,
            row,
            units,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          ...origRow,
          units: [
            {
              ...origRow.units[0],
              effectiveStrength: 1,
              effects: [
                {
                  operator: '+1',
                  total: 1,
                  reason: {
                    effect: effects[0]._id,
                    type: EffectReasonType.Unit,
                    unit: units[1]._id,
                  },
                },
              ],
            },
            {
              ...origRow.units[1],
              effectiveStrength: 0,
            },
          ],
        })
      })
      it('morale effect stacks', () => {
        const effects: EffectDbObject[] = [
          TestUtil.getDbEffect({
            key: EffectKey.Morale,
          }),
        ]
        const units: UnitDbObject[] = [
          TestUtil.getDbUnit({
            strength: 0,
            effects: [effects[0]._id],
          }),
          TestUtil.getDbUnit({
            strength: 0,
            effects: [effects[0]._id],
          }),
          TestUtil.getDbUnit({
            strength: 0,
          }),
        ]
        const row: PlayerCombatRowDbObject = {
          score: 0,
          units: [
            TestUtil.getDbGameUnit({
              id: units[0]._id,
            }),
            TestUtil.getDbGameUnit({
              id: units[1]._id,
            }),
            TestUtil.getDbGameUnit({
              id: units[2]._id,
            }),
          ],
        }
        const origRow = deepClone(row)

        expect(
          CalculateGameEffectiveStrengths['calculateEffectiveStrengthsForRow']({
            effects,
            row,
            units,
          })
        ).toEqual(undefined)

        expect(row).toEqual({
          ...origRow,
          units: [
            {
              ...origRow.units[0],
              effectiveStrength: 1,
              effects: [
                {
                  operator: '+1',
                  total: 1,
                  reason: {
                    effect: effects[0]._id,
                    type: EffectReasonType.Unit,
                    unit: units[1]._id,
                  },
                },
              ],
            },
            {
              ...origRow.units[1],
              effectiveStrength: 1,
              effects: [
                {
                  operator: '+1',
                  total: 1,
                  reason: {
                    effect: effects[0]._id,
                    type: EffectReasonType.Unit,
                    unit: units[0]._id,
                  },
                },
              ],
            },
            {
              ...origRow.units[2],
              effectiveStrength: 2,
              effects: [
                {
                  operator: '+1',
                  total: 1,
                  reason: {
                    effect: effects[0]._id,
                    type: EffectReasonType.Unit,
                    unit: units[0]._id,
                  },
                },
                {
                  operator: '+1',
                  total: 2,
                  reason: {
                    effect: effects[0]._id,
                    type: EffectReasonType.Unit,
                    unit: units[1]._id,
                  },
                },
              ],
            },
          ],
        })
      })
    })
  })
})
