import CombatRowResolver from '../../src/graphql/resolvers/types/combat-row-resolver'
import { GameUnit } from '@gwent/graphql-schema/resolver-typings'
import GameUnitResolver from '../../src/graphql/resolvers/types/game-unit-resolver'
import { PlayerCombatRowDbObject, Unit } from '@gwent/graphql-schema/database-typings'
import TestUtil from '../util/test-util'

describe('combat-row-resolver', () => {
  describe('fromObject', () => {
    it('resolves row that does not have modifier', async () => {
      await testFromObject({
        row: {
          score: 0,
          units: [TestUtil.getDbGameUnit({})],
        },
        units: [],
      })
    })
    it('resolves row that does have modifier', async () => {
      const modifier = TestUtil.getDbGameUnit({})
      await testFromObject({
        row: {
          score: 0,
          units: [TestUtil.getDbGameUnit({})],
          modifier,
        },
        units: [],
        gameUnitFromObjectResponse: TestUtil.getGameUnit({
          unit: TestUtil.getUnit({
            id: modifier.unit,
          }),
        }),
      })
    })
  })
})

async function testFromObject({
  row,
  units,
  gameUnitFromObjectResponse,
}: {
  row: PlayerCombatRowDbObject
  units: Unit[]
  gameUnitFromObjectResponse?: GameUnit
}) {
  const gameUnits = [
    TestUtil.getGameUnit({
      unit: TestUtil.getUnit({}),
    }),
  ]
  const gameUnitFromArraySpy = jest.spyOn(GameUnitResolver, 'fromArray').mockResolvedValue(gameUnits)
  const gameUnitFromObjectSpy = jest.spyOn(GameUnitResolver, 'fromObject')
  if (gameUnitFromObjectResponse) {
    gameUnitFromObjectSpy.mockResolvedValue(gameUnitFromObjectResponse)
  }

  await expect(
    CombatRowResolver.fromObject({
      row,
      units,
    })
  ).resolves.toEqual({
    score: row.score,
    units: gameUnits,
    modifier: row.modifier ? gameUnitFromObjectResponse : undefined,
  })

  expect(gameUnitFromArraySpy.mock.calls).toEqual([
    [
      {
        gameUnits: row.units,
        units,
      },
    ],
  ])
  expect(gameUnitFromObjectSpy.mock.calls).toEqual(
    row.modifier
      ? [
          [
            {
              gameUnit: row.modifier,
            },
          ],
        ]
      : []
  )
}
