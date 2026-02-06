import { ObjectId } from 'mongodb'

import { Combat, GameDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import GetWeatherUnitsForRow, {
  PlayerWeatherUnit,
} from '../../src/graphql/resolvers/mutations/play-unit/get-weather-units-for-row'
import TestUtil from '../util/test-util'

describe('GetWeatherUnitsForRow', () => {
  describe('getWeatherUnitsForRow', () => {
    const logPrefix = 'log-prefix'
    it('throws error if unit not found', () => {
      const unit = TestUtil.getDbUnit({
        combats: [Combat.Close],
      })
      const badId = new ObjectId()
      const userId = new ObjectId()
      const message = `Could not find weather Unit with ID "${badId}"`
      testGetWeatherUnitsForRow({
        logPrefix,
        combat: Combat.Close,
        game: TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  weathers: [
                    TestUtil.getDbGameUnit({
                      id: badId,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        units: [unit],
        expected: Error(`${message}.`),
        errorCalls: [[`${logPrefix} failed: ${message}`]],
      })
    })
    it('returns empty array if no weathers', () => {
      testGetWeatherUnitsForRow({
        logPrefix,
        combat: Combat.Close,
        game: TestUtil.getDbGame({}),
        units: [],
        expected: [],
      })
    })
    it('returns empty array if no combat', () => {
      const unit = TestUtil.getDbUnit({
        combats: [Combat.Close],
      })
      const userId = new ObjectId()
      testGetWeatherUnitsForRow({
        logPrefix,
        combat: undefined,
        game: TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  weathers: [
                    TestUtil.getDbGameUnit({
                      id: unit._id,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        units: [unit],
        expected: [],
      })
    })
    it('returns empty array if weather combat does not match', () => {
      const unit = TestUtil.getDbUnit({
        combats: [Combat.Close],
      })
      const userId = new ObjectId()
      testGetWeatherUnitsForRow({
        logPrefix,
        combat: Combat.Ranged,
        game: TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  weathers: [
                    TestUtil.getDbGameUnit({
                      id: unit._id,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        units: [unit],
        expected: [],
      })
    })
    it('returns single item if single weather', () => {
      const unit = TestUtil.getDbUnit({
        combats: [Combat.Close],
      })
      const userId = new ObjectId()
      testGetWeatherUnitsForRow({
        logPrefix,
        combat: Combat.Close,
        game: TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  weathers: [
                    TestUtil.getDbGameUnit({
                      id: unit._id,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        units: [unit],
        expected: [
          {
            userId: userId,
            unit,
          },
        ],
      })
    })
    it('returns multiple items if multiple weathers', () => {
      const unit1 = TestUtil.getDbUnit({
        combats: [Combat.Close],
      })
      const unit2 = TestUtil.getDbUnit({
        combats: [Combat.Close],
      })
      const userId = new ObjectId()
      testGetWeatherUnitsForRow({
        logPrefix,
        combat: Combat.Close,
        game: TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  weathers: [
                    TestUtil.getDbGameUnit({
                      id: unit1._id,
                    }),
                    TestUtil.getDbGameUnit({
                      id: unit2._id,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        units: [unit1, unit2],
        expected: [
          {
            userId: userId,
            unit: unit1,
          },
          {
            userId: userId,
            unit: unit2,
          },
        ],
      })
    })
    it('returns one out of many based on combat', () => {
      const unit1 = TestUtil.getDbUnit({
        combats: [Combat.Ranged],
      })
      const unit2 = TestUtil.getDbUnit({
        combats: [Combat.Close],
      })
      const userId = new ObjectId()
      testGetWeatherUnitsForRow({
        logPrefix,
        combat: Combat.Close,
        game: TestUtil.getDbGame({
          round: 1,
          players: [
            TestUtil.getDbGamePlayer({
              user: userId,
              rounds: [
                TestUtil.getDbPlayerRound({
                  weathers: [
                    TestUtil.getDbGameUnit({
                      id: unit1._id,
                    }),
                    TestUtil.getDbGameUnit({
                      id: unit2._id,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        units: [unit1, unit2],
        expected: [
          {
            userId: userId,
            unit: unit2,
          },
        ],
      })
    })
  })
})

function testGetWeatherUnitsForRow({
  logPrefix,
  game,
  combat,
  units,
  expected,
  errorCalls = [],
}: {
  logPrefix: string
  game: GameDbObject
  combat: Combat | undefined
  units: UnitDbObject[]
  expected: PlayerWeatherUnit[] | Error
  errorCalls?: string[][]
}) {
  const errorSpy = jest.fn().mockImplementation()
  GetWeatherUnitsForRow['logger'] = {
    error: errorSpy,
  } as any

  if (expected instanceof Error) {
    expect(() =>
      GetWeatherUnitsForRow.getWeatherUnitsForRow({
        combat,
        game,
        logPrefix,
        units,
      })
    ).toThrow(expected)
  } else {
    expect(
      GetWeatherUnitsForRow.getWeatherUnitsForRow({
        combat,
        game,
        logPrefix,
        units,
      })
    ).toEqual(expected)
  }

  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
