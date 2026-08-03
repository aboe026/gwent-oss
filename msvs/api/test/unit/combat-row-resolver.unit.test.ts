import CombatRowResolver from '../../src/graphql/resolvers/types/combat-row-resolver'
import { FieldUnit } from '@gwent-oss/graphql-schema/resolver-typings'
import FieldUnitResolver from '../../src/graphql/resolvers/types/field-unit-resolver'
import { PlayerCombatRowDbObject, Unit } from '@gwent-oss/graphql-schema/database-typings'
import TestUtil from '../util/test-util'

describe('combat-row-resolver', () => {
  describe('fromObject', () => {
    it('resolves row that does not have modifier', async () => {
      await testFromObject({
        row: {
          score: 0,
          units: [TestUtil.getDbFieldUnit({})],
        },
        units: [],
      })
    })
    it('resolves row that does have modifier without presolved units', async () => {
      const modifier = TestUtil.getDbFieldUnit({})
      await testFromObject({
        row: {
          score: 0,
          units: [TestUtil.getDbFieldUnit({})],
          modifier,
        },
        units: [],
        fieldUnitFromObjectResponse: TestUtil.getFieldUnit({
          unit: TestUtil.getUnit({
            id: modifier.unit,
          }),
        }),
      })
    })
    it('resolves row that does have modifier with presolved units', async () => {
      const modifier = TestUtil.getDbFieldUnit({})
      const unit = TestUtil.getUnit({
        id: modifier.unit,
      })
      await testFromObject({
        row: {
          score: 0,
          units: [TestUtil.getDbFieldUnit({})],
          modifier,
        },
        units: [unit],
        fieldUnitFromObjectResponse: TestUtil.getFieldUnit({
          unit: TestUtil.getUnit({
            id: modifier.unit,
          }),
        }),
        fromObjectPresolvedUnit: unit,
      })
    })
  })
})

async function testFromObject({
  row,
  units,
  fieldUnitFromObjectResponse: fieldUnitFromObjectResponse,
  fromObjectPresolvedUnit,
}: {
  row: PlayerCombatRowDbObject
  units: Unit[]
  fieldUnitFromObjectResponse?: FieldUnit
  fromObjectPresolvedUnit?: Unit
}) {
  const fieldUnits = [
    TestUtil.getFieldUnit({
      unit: TestUtil.getUnit({}),
    }),
  ]
  const fieldUnitFromArraySpy = jest.spyOn(FieldUnitResolver, 'fromArray').mockResolvedValue(fieldUnits)
  const fieldUnitFromObjectSpy = jest.spyOn(FieldUnitResolver, 'fromObject')
  if (fieldUnitFromObjectResponse) {
    fieldUnitFromObjectSpy.mockResolvedValue(fieldUnitFromObjectResponse)
  }

  await expect(
    CombatRowResolver.fromObject({
      row,
      units,
    })
  ).resolves.toEqual({
    score: row.score,
    units: fieldUnits,
    modifier: row.modifier ? fieldUnitFromObjectResponse : undefined,
  })

  expect(fieldUnitFromArraySpy.mock.calls).toEqual([
    [
      {
        fieldUnits: row.units,
        units,
      },
    ],
  ])
  expect(fieldUnitFromObjectSpy.mock.calls).toEqual(
    row.modifier
      ? [
          [
            {
              fieldUnit: row.modifier,
              unit: fromObjectPresolvedUnit,
            },
          ],
        ]
      : []
  )
}
