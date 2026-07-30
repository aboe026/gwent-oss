import { ObjectId } from 'mongodb'

import { GameDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import getRoundUnits from '../../src/graphql/resolvers/mutations/util/get-round-units'
import TestUtil from '../util/test-util'
import UnitStore from '../../src/database/stores/unit-store'

describe('get-round-units', () => {
  it('returns empty array if no units', async () => {
    await testGetRoundUnits({
      game: TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [TestUtil.getDbPlayerRound({})],
          }),
        ],
      }),
      expected: [],
    })
  })
  it('retrieves all kinds of units if none presolved', async () => {
    const unit1 = TestUtil.getDbUnit({})
    const unit2 = TestUtil.getDbUnit({})
    const unit3 = TestUtil.getDbUnit({})
    const unit4 = TestUtil.getDbUnit({})
    const unit5 = TestUtil.getDbUnit({})
    await testGetRoundUnits({
      game: TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit1._id,
                    }),
                  ],
                  modifier: TestUtil.getDbFieldUnit({
                    id: unit5._id,
                  }),
                }),
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit2._id,
                    }),
                  ],
                }),
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit3._id,
                    }),
                  ],
                }),
                weathers: [
                  TestUtil.getDbWeatherUnit({
                    id: unit4._id,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      unitStoreGetResponse: [unit1, unit2, unit3, unit4, unit5],
      expected: [unit1, unit2, unit3, unit4, unit5],
    })
  })
  it('does not retrieve all kinds of units if all presolved', async () => {
    const unit1 = TestUtil.getDbUnit({})
    const unit2 = TestUtil.getDbUnit({})
    const unit3 = TestUtil.getDbUnit({})
    const unit4 = TestUtil.getDbUnit({})
    const unit5 = TestUtil.getDbUnit({})
    await testGetRoundUnits({
      game: TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit1._id,
                    }),
                  ],
                  modifier: TestUtil.getDbFieldUnit({
                    id: unit5._id,
                  }),
                }),
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit2._id,
                    }),
                  ],
                }),
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit3._id,
                    }),
                  ],
                }),
                weathers: [
                  TestUtil.getDbWeatherUnit({
                    id: unit4._id,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      units: [unit1, unit2, unit3, unit4, unit5],
      expected: [unit1, unit2, unit3, unit4, unit5],
    })
  })
  it('does not return units from other rounds', async () => {
    const unit1 = TestUtil.getDbUnit({})
    const unit2 = TestUtil.getDbUnit({})
    const unit3 = TestUtil.getDbUnit({})
    const unit4 = TestUtil.getDbUnit({})
    const unit5 = TestUtil.getDbUnit({})
    await testGetRoundUnits({
      game: TestUtil.getDbGame({
        round: 2,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                  modifier: TestUtil.getDbFieldUnit({}),
                }),
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
                weathers: [TestUtil.getDbWeatherUnit({})],
              }),
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit1._id,
                    }),
                  ],
                  modifier: TestUtil.getDbFieldUnit({
                    id: unit5._id,
                  }),
                }),
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit2._id,
                    }),
                  ],
                }),
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit3._id,
                    }),
                  ],
                }),
                weathers: [
                  TestUtil.getDbWeatherUnit({
                    id: unit4._id,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      unitStoreGetResponse: [unit1, unit2, unit3, unit4, unit5],
      expected: [unit1, unit2, unit3, unit4, unit5],
    })
  })
  it('can get units from other rounds that are not the current', async () => {
    const unit1 = TestUtil.getDbUnit({})
    const unit2 = TestUtil.getDbUnit({})
    const unit3 = TestUtil.getDbUnit({})
    const unit4 = TestUtil.getDbUnit({})
    const unit5 = TestUtil.getDbUnit({})
    await testGetRoundUnits({
      game: TestUtil.getDbGame({
        round: 2,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit1._id,
                    }),
                  ],
                  modifier: TestUtil.getDbFieldUnit({
                    id: unit5._id,
                  }),
                }),
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit2._id,
                    }),
                  ],
                }),
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit3._id,
                    }),
                  ],
                }),
                weathers: [
                  TestUtil.getDbWeatherUnit({
                    id: unit4._id,
                  }),
                ],
              }),
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                  modifier: TestUtil.getDbFieldUnit({}),
                }),
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
                weathers: [TestUtil.getDbWeatherUnit({})],
              }),
            ],
          }),
        ],
      }),
      round: 0,
      unitStoreGetResponse: [unit1, unit2, unit3, unit4, unit5],
      expected: [unit1, unit2, unit3, unit4, unit5],
    })
  })
  it('can scope units to specific player', async () => {
    const unit1 = TestUtil.getDbUnit({})
    const unit2 = TestUtil.getDbUnit({})
    const unit3 = TestUtil.getDbUnit({})
    const unit4 = TestUtil.getDbUnit({})
    const unit5 = TestUtil.getDbUnit({})
    const userId = new ObjectId()
    await testGetRoundUnits({
      game: TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                  modifier: TestUtil.getDbFieldUnit({}),
                }),
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [TestUtil.getDbFieldUnit({})],
                }),
                weathers: [TestUtil.getDbWeatherUnit({})],
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            user: userId,
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit1._id,
                    }),
                  ],
                  modifier: TestUtil.getDbFieldUnit({
                    id: unit5._id,
                  }),
                }),
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit2._id,
                    }),
                  ],
                }),
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit3._id,
                    }),
                  ],
                }),
                weathers: [
                  TestUtil.getDbWeatherUnit({
                    id: unit4._id,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      playerId: userId,
      unitStoreGetResponse: [unit1, unit2, unit3, unit4, unit5],
      expected: [unit1, unit2, unit3, unit4, unit5],
    })
  })
  it('does not retrieve unitBeingPlayed', async () => {
    const unit1 = TestUtil.getDbUnit({})
    const unit2 = TestUtil.getDbUnit({})
    const unit3 = TestUtil.getDbUnit({})
    const unit4 = TestUtil.getDbUnit({})
    const unit5 = TestUtil.getDbUnit({})
    await testGetRoundUnits({
      game: TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit1._id,
                    }),
                  ],
                  modifier: TestUtil.getDbFieldUnit({
                    id: unit5._id,
                  }),
                }),
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit2._id,
                    }),
                  ],
                }),
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit3._id,
                    }),
                  ],
                }),
                weathers: [
                  TestUtil.getDbWeatherUnit({
                    id: unit4._id,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      unitBeingPlayed: unit2,
      unitStoreGetResponse: [unit1, unit3, unit4, unit5],
      expected: [unit2, unit1, unit3, unit4, unit5],
    })
  })
  it('does not retrieve same unit twice', async () => {
    const unit1 = TestUtil.getDbUnit({})
    const unit2 = TestUtil.getDbUnit({})
    const unit3 = TestUtil.getDbUnit({})
    const unit4 = TestUtil.getDbUnit({})
    const unit5 = TestUtil.getDbUnit({})
    await testGetRoundUnits({
      game: TestUtil.getDbGame({
        round: 1,
        players: [
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit1._id,
                    }),
                  ],
                  modifier: TestUtil.getDbFieldUnit({
                    id: unit5._id,
                  }),
                }),
                ranged: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit2._id,
                    }),
                  ],
                }),
                siege: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit3._id,
                    }),
                  ],
                }),
                weathers: [
                  TestUtil.getDbWeatherUnit({
                    id: unit4._id,
                  }),
                ],
              }),
            ],
          }),
          TestUtil.getDbGamePlayer({
            rounds: [
              TestUtil.getDbPlayerRound({
                close: TestUtil.getDbPlayerCombatRow({
                  units: [
                    TestUtil.getDbFieldUnit({
                      id: unit1._id,
                    }),
                  ],
                }),
              }),
            ],
          }),
        ],
      }),
      unitStoreGetResponse: [unit1, unit2, unit3, unit4, unit5],
      expected: [unit1, unit2, unit3, unit4, unit5],
    })
  })
})

async function testGetRoundUnits({
  game,
  unitBeingPlayed,
  units,
  playerId,
  round,
  unitStoreGetResponse,
  expected,
}: {
  game: GameDbObject
  unitBeingPlayed?: UnitDbObject
  units?: UnitDbObject[]
  playerId?: ObjectId
  round?: number
  unitStoreGetResponse?: UnitDbObject[]
  expected: UnitDbObject[]
}) {
  const unitStoreGetSpy = jest.spyOn(UnitStore, 'get')
  if (unitStoreGetResponse) {
    unitStoreGetSpy.mockResolvedValue(unitStoreGetResponse)
  }

  await expect(
    getRoundUnits({
      game,
      playerId,
      round,
      unitBeingPlayed,
      units,
    })
  ).resolves.toEqual(expected)

  expect(unitStoreGetSpy.mock.calls).toEqual(
    unitStoreGetResponse
      ? [
          [
            {
              ids: unitStoreGetResponse.map((unit) => unit._id.toString()),
            },
          ],
        ]
      : []
  )
}
