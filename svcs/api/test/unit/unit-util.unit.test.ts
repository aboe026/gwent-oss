import { EffectDbObject, GameDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import UnitStore from '../../src/database/stores/unit-store'
import UnitUtil from '../../src/graphql/resolvers/mutations/util/unit-util'
import TestUtil from '../util/test-util'
import EffectStore from '../../src/database/stores/effect-store'

describe('unit-util', () => {
  describe('getRoundUnits', () => {
    const unitBeingPlayed = TestUtil.getDbUnit({})
    const unitsSelf = {
      close: TestUtil.getDbUnit({}),
      ranged: TestUtil.getDbUnit({}),
      siege: TestUtil.getDbUnit({}),
    }
    const unitsOpponent = {
      close: TestUtil.getDbUnit({}),
      ranged: TestUtil.getDbUnit({}),
      siege: TestUtil.getDbUnit({}),
    }
    describe('round 1', () => {
      it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in close combat', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round: 1,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.close._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.close._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          otherUnits: [unitsSelf.close, unitsOpponent.close],
        })
      })
      it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in ranged combat', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round: 1,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.ranged._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    ranged: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.ranged._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          otherUnits: [unitsSelf.ranged, unitsOpponent.ranged],
        })
      })
      it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in siege combat', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round: 1,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.siege._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    siege: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.siege._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          otherUnits: [unitsSelf.siege, unitsOpponent.siege],
        })
      })
      it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in all combats', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round: 1,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.close._id,
                        }),
                      ],
                    },
                    ranged: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.ranged._id,
                        }),
                      ],
                    },
                    siege: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.siege._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({
                    close: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.close._id,
                        }),
                      ],
                    },
                    ranged: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.ranged._id,
                        }),
                      ],
                    },
                    siege: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.siege._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          otherUnits: [
            unitsSelf.close,
            unitsSelf.ranged,
            unitsSelf.siege,
            unitsOpponent.close,
            unitsOpponent.ranged,
            unitsOpponent.siege,
          ],
        })
      })
    })
    describe('round 2', () => {
      it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in close combat', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round: 2,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    close: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.close._id,
                        }),
                      ],
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
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.close._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          otherUnits: [unitsSelf.close, unitsOpponent.close],
        })
      })
      it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in ranged combat', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round: 2,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    ranged: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.ranged._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    ranged: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.ranged._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          otherUnits: [unitsSelf.ranged, unitsOpponent.ranged],
        })
      })
      it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in siege combat', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round: 2,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    siege: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.siege._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    siege: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.siege._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          otherUnits: [unitsSelf.siege, unitsOpponent.siege],
        })
      })
      it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in all combats', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round: 2,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    close: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.close._id,
                        }),
                      ],
                    },
                    ranged: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.ranged._id,
                        }),
                      ],
                    },
                    siege: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.siege._id,
                        }),
                      ],
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
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.close._id,
                        }),
                      ],
                    },
                    ranged: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.ranged._id,
                        }),
                      ],
                    },
                    siege: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.siege._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          otherUnits: [
            unitsSelf.close,
            unitsSelf.ranged,
            unitsSelf.siege,
            unitsOpponent.close,
            unitsOpponent.ranged,
            unitsOpponent.siege,
          ],
        })
      })
    })
    describe('round 3', () => {
      it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in close combat', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round: 3,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    close: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.close._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    close: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.close._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          otherUnits: [unitsSelf.close, unitsOpponent.close],
        })
      })
      it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in ranged combat', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round: 3,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    ranged: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.ranged._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    ranged: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.ranged._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          otherUnits: [unitsSelf.ranged, unitsOpponent.ranged],
        })
      })
      it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in siege combat', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round: 3,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    siege: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.siege._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    siege: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.siege._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          otherUnits: [unitsSelf.siege, unitsOpponent.siege],
        })
      })
      it('calls to UnitStore to get all units ignoring unitBeingPlayed for units in all combats', async () => {
        await testGetRoundUnits({
          game: TestUtil.getDbGame({
            round: 3,
            players: [
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    close: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.close._id,
                        }),
                      ],
                    },
                    ranged: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.ranged._id,
                        }),
                      ],
                    },
                    siege: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsSelf.siege._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
              TestUtil.getDbGamePlayer({
                rounds: [
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({}),
                  TestUtil.getDbPlayerRound({
                    close: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.close._id,
                        }),
                      ],
                    },
                    ranged: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.ranged._id,
                        }),
                      ],
                    },
                    siege: {
                      score: 0,
                      units: [
                        TestUtil.getDbGameUnit({
                          id: unitsOpponent.siege._id,
                        }),
                      ],
                    },
                  }),
                ],
              }),
            ],
          }),
          unitBeingPlayed,
          otherUnits: [
            unitsSelf.close,
            unitsSelf.ranged,
            unitsSelf.siege,
            unitsOpponent.close,
            unitsOpponent.ranged,
            unitsOpponent.siege,
          ],
        })
      })
    })
  })
  describe('getUnitEffects', () => {
    describe('single unit', () => {
      it('returns empty array if unit has no effects', async () => {
        await testGetUnitEffects({
          units: [TestUtil.getDbUnit({})],
          expected: [],
        })
      })
      it('returns single effect if unit has single effect', async () => {
        const effects = [TestUtil.getDbEffect({})]
        await testGetUnitEffects({
          units: [
            TestUtil.getDbUnit({
              effects: [effects[0]._id],
            }),
          ],
          expected: effects,
        })
      })
      it('returns multiple effects if unit has multiple effect', async () => {
        const effects = [TestUtil.getDbEffect({}), TestUtil.getDbEffect({})]
        await testGetUnitEffects({
          units: [
            TestUtil.getDbUnit({
              effects: [effects[0]._id, effects[1]._id],
            }),
          ],
          expected: effects,
        })
      })
    })
    describe('multiple units', () => {
      it('returns empty array if units have no effects', async () => {
        await testGetUnitEffects({
          units: [TestUtil.getDbUnit({}), TestUtil.getDbUnit({})],
          expected: [],
        })
      })
      it('returns single effect if first unit has single effect', async () => {
        const effects = [TestUtil.getDbEffect({})]
        await testGetUnitEffects({
          units: [
            TestUtil.getDbUnit({
              effects: [effects[0]._id],
            }),
            TestUtil.getDbUnit({}),
          ],
          expected: effects,
        })
      })
      it('returns single effect if second unit has single effect', async () => {
        const effects = [TestUtil.getDbEffect({})]
        await testGetUnitEffects({
          units: [
            TestUtil.getDbUnit({}),
            TestUtil.getDbUnit({
              effects: [effects[0]._id],
            }),
          ],
          expected: effects,
        })
      })
      it('returns single effect if both units have same single effect', async () => {
        const effects = [TestUtil.getDbEffect({})]
        await testGetUnitEffects({
          units: [
            TestUtil.getDbUnit({
              effects: [effects[0]._id],
            }),
            TestUtil.getDbUnit({
              effects: [effects[0]._id],
            }),
          ],
          expected: effects,
        })
      })
      it('returns multiple effects if first unit has multiple effects', async () => {
        const effects = [TestUtil.getDbEffect({}), TestUtil.getDbEffect({})]
        await testGetUnitEffects({
          units: [
            TestUtil.getDbUnit({
              effects: [effects[0]._id, effects[1]._id],
            }),
            TestUtil.getDbUnit({}),
          ],
          expected: effects,
        })
      })
      it('returns multiple effects if second unit has multiple effects', async () => {
        const effects = [TestUtil.getDbEffect({}), TestUtil.getDbEffect({})]
        await testGetUnitEffects({
          units: [
            TestUtil.getDbUnit({}),
            TestUtil.getDbUnit({
              effects: [effects[0]._id, effects[1]._id],
            }),
          ],
          expected: effects,
        })
      })
      it('returns multiple effects if both units have different single effect', async () => {
        const effects = [TestUtil.getDbEffect({}), TestUtil.getDbEffect({})]
        await testGetUnitEffects({
          units: [
            TestUtil.getDbUnit({
              effects: [effects[0]._id],
            }),
            TestUtil.getDbUnit({
              effects: [effects[1]._id],
            }),
          ],
          expected: effects,
        })
      })
      it('returns multiple effects if both units share effect but also have different ones', async () => {
        const effects = [TestUtil.getDbEffect({}), TestUtil.getDbEffect({}), TestUtil.getDbEffect({})]
        await testGetUnitEffects({
          units: [
            TestUtil.getDbUnit({
              effects: [effects[0]._id, effects[1]._id],
            }),
            TestUtil.getDbUnit({
              effects: [effects[0]._id, effects[2]._id],
            }),
          ],
          expected: effects,
        })
      })
      it('returns multiple effects if both units have different multiple effect', async () => {
        const effects = [
          TestUtil.getDbEffect({}),
          TestUtil.getDbEffect({}),
          TestUtil.getDbEffect({}),
          TestUtil.getDbEffect({}),
        ]
        await testGetUnitEffects({
          units: [
            TestUtil.getDbUnit({
              effects: [effects[0]._id, effects[1]._id],
            }),
            TestUtil.getDbUnit({
              effects: [effects[2]._id, effects[3]._id],
            }),
          ],
          expected: effects,
        })
      })
    })
  })
})

async function testGetRoundUnits({
  game,
  unitBeingPlayed,
  otherUnits,
}: {
  game: GameDbObject
  unitBeingPlayed: UnitDbObject
  otherUnits: UnitDbObject[]
}) {
  const unitStoreGetSpy = jest.spyOn(UnitStore, 'get').mockResolvedValue(otherUnits)

  await expect(
    UnitUtil.getRoundUnits({
      game,
      unitBeingPlayed,
    })
  ).resolves.toEqual([...otherUnits, unitBeingPlayed])

  expect(unitStoreGetSpy.mock.calls).toEqual([
    [
      {
        ids: otherUnits.map((unit) => unit._id.toString()),
      },
    ],
  ])
}

async function testGetUnitEffects({ units, expected }: { units: UnitDbObject[]; expected: EffectDbObject[] }) {
  const effectStoreGetSpy = jest.spyOn(EffectStore, 'get').mockResolvedValue(expected)

  await expect(
    UnitUtil.getUnitEffects({
      units,
    })
  ).resolves.toEqual(expected)

  expect(effectStoreGetSpy.mock.calls).toEqual(
    expected.length === 0
      ? []
      : [
          [
            {
              ids: expected.map((effect) => effect._id.toString()),
            },
          ],
        ]
  )
}
