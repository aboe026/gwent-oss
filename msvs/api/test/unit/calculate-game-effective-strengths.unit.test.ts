import {
  EffectDbObject,
  EffectKey,
  ImpactDbObject,
  PlayerCombatRowDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import CalculateGameEffectiveStrengths from '../../src/graphql/resolvers/mutations/play-unit/calculate-game-effective-strengths'
import TestUtil from '../util/test-util'
import deepClone from '../util/deep-clone'
import { EffectReasonType } from '@gwent/graphql-schema'
import { ObjectId } from 'mongodb'

describe('calculate-game-effective-strengths', () => {
  describe('calculateEffectiveStrengths', () => {
    it('returns undefined if no impacts on any row', () => {
      testCalculateEffectiveStrengths({
        rowResults: [[], [], [], [], [], []],
        expected: undefined,
      })
    })
    it('returns single impact', () => {
      const impact: ImpactDbObject = {
        unit: {
          artStyle: 1,
          unit: new ObjectId(),
        },
        user: new ObjectId(),
      }
      testCalculateEffectiveStrengths({
        rowResults: [[], [], [], [impact], [], []],
        expected: [impact],
      })
    })
    it('returns multiple impacts from single row result', () => {
      const impact1: ImpactDbObject = {
        unit: {
          artStyle: 1,
          unit: new ObjectId(),
        },
        user: new ObjectId(),
      }
      const impact2: ImpactDbObject = {
        unit: {
          artStyle: 2,
          unit: new ObjectId(),
        },
        user: new ObjectId(),
      }
      testCalculateEffectiveStrengths({
        rowResults: [[], [], [], [impact1, impact2], [], []],
        expected: [impact1, impact2],
      })
    })
    it('returns multiple impacts from multiple row results', () => {
      const impact1: ImpactDbObject = {
        unit: {
          artStyle: 1,
          unit: new ObjectId(),
        },
        user: new ObjectId(),
      }
      const impact2: ImpactDbObject = {
        unit: {
          artStyle: 2,
          unit: new ObjectId(),
        },
        user: new ObjectId(),
      }
      testCalculateEffectiveStrengths({
        rowResults: [[], [], [], [impact1], [impact2], []],
        expected: [impact1, impact2],
      })
    })
  })
  describe('calculateEffectiveStrengthsForRow', () => {
    const logPrefix = 'log-prefix'
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
            logPrefix,
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
            logPrefix,
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
            logPrefix,
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
            logPrefix,
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
            logPrefix,
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
            logPrefix,
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
            logPrefix,
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
            logPrefix,
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
            logPrefix,
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
            logPrefix,
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
            logPrefix,
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
            logPrefix,
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
            logPrefix,
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
            logPrefix,
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
            logPrefix,
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
            logPrefix,
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

function testCalculateEffectiveStrengths({
  rowResults,
  expected,
}: {
  rowResults: (ImpactDbObject[] | undefined)[]
  expected: ImpactDbObject[] | undefined
}) {
  const logPrefix = 'log-prefix'
  const calculateEffectiveStrengthsForRowSpy = jest
    .spyOn(CalculateGameEffectiveStrengths as any, 'calculateEffectiveStrengthsForRow')
    .mockImplementation()

  const effects = [TestUtil.getDbEffect({})]
  const units = [TestUtil.getDbUnit({})]
  const newDeckUnit = TestUtil.getDbDeckUnit({})
  const gamePlayer1 = TestUtil.getDbGamePlayer({
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
  })
  const game = TestUtil.getDbGame({
    round: 2,
    players: [
      gamePlayer1,
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
    turn: gamePlayer1.user,
  })
  for (const rowResult of rowResults) {
    jest
      .spyOn(CalculateGameEffectiveStrengths as any, 'calculateEffectiveStrengthsForRow')
      .mockReturnValueOnce(rowResult)
  }

  expect(
    CalculateGameEffectiveStrengths.calculateEffectiveStrengths({
      logPrefix,
      effects,
      game,
      units,
      newDeckUnit,
    })
  ).toEqual(expected)

  const calculateEffectiveStrengthsForRowCall = {
    units,
    effects,
    logPrefix,
    newDeckUnit,
  }
  expect(calculateEffectiveStrengthsForRowSpy.mock.calls).toEqual([
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        player: game.players[0],
        row: game.players[0].rounds[1].close,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        player: game.players[0],
        row: game.players[0].rounds[1].ranged,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        player: game.players[0],
        row: game.players[0].rounds[1].siege,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        player: game.players[1],
        row: game.players[1].rounds[1].close,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        player: game.players[1],
        row: game.players[1].rounds[1].ranged,
      },
    ],
    [
      {
        ...calculateEffectiveStrengthsForRowCall,
        player: game.players[1],
        row: game.players[1].rounds[1].siege,
      },
    ],
  ])
}
