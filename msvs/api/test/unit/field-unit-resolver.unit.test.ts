import { ObjectId } from 'mongodb'

import { Combat, FieldUnitDbObject } from '@gwent/graphql-schema/database-typings'
import { FieldUnit, Unit } from '@gwent/graphql-schema/resolver-typings'
import FieldUnitResolver from '../../src/graphql/resolvers/types/field-unit-resolver'
import TestUtil from '../util/test-util'
import UnitResolver from '../../src/graphql/resolvers/types/unit-resolver'

describe('field-unit-resolver', () => {
  describe('fromObject', () => {
    it('does not reach out to UnitResolver if unit provided', async () => {
      const unit: Unit = TestUtil.getUnit({})
      await testFromObject({
        fieldUnit: {
          artStyle: 1,
          effectiveStrength: 2,
          unit: new ObjectId(unit.id),
          row: Combat.Close,
        },
        unit,
      })
    })
    it('reaches out to UnitResolver if unit not provided', async () => {
      await testFromObject({
        fieldUnit: {
          artStyle: 1,
          effectiveStrength: 2,
          unit: new ObjectId(),
          row: Combat.Siege,
        },
      })
    })
    it('row used if fieldUnit row is Close', async () => {
      await testFromObject({
        fieldUnit: {
          artStyle: 1,
          effectiveStrength: 2,
          unit: new ObjectId(),
          row: Combat.Close,
        },
      })
    })
    it('row used if fieldUnit row is Ranged', async () => {
      await testFromObject({
        fieldUnit: {
          artStyle: 1,
          effectiveStrength: 2,
          unit: new ObjectId(),
          row: Combat.Ranged,
        },
      })
    })
    it('row used if fieldUnit row is Siege', async () => {
      await testFromObject({
        fieldUnit: {
          artStyle: 1,
          effectiveStrength: 2,
          unit: new ObjectId(),
          row: Combat.Siege,
        },
      })
    })
  })
  describe('fromArray', () => {
    it('does not call to anything if empty fieldUnits', async () => {
      await testFromArray({
        fieldUnits: [],
      })
    })
    it('calls to UnitResolver if no units provided', async () => {
      const unit1 = TestUtil.getUnit({})
      const unit2 = TestUtil.getUnit({})
      await testFromArray({
        fieldUnits: [
          {
            artStyle: 1,
            effectiveStrength: 2,
            unit: new ObjectId(unit1.id),
            row: Combat.Ranged,
          },
          {
            artStyle: 3,
            effectiveStrength: 4,
            unit: new ObjectId(unit2.id),
            row: Combat.Siege,
          },
        ],
        resolvedUnits: [unit1, unit2],
      })
    })
    it('does not call to UnitResolver if units provided', async () => {
      const unit1 = TestUtil.getUnit({})
      const unit2 = TestUtil.getUnit({})
      await testFromArray({
        fieldUnits: [
          {
            artStyle: 1,
            effectiveStrength: 2,
            unit: new ObjectId(unit1.id),
            row: Combat.Close,
          },
          {
            artStyle: 3,
            effectiveStrength: 4,
            unit: new ObjectId(unit2.id),
            row: Combat.Ranged,
          },
        ],
        units: [unit1, unit2],
      })
    })
  })
})

async function testFromObject({ fieldUnit, unit }: { fieldUnit: FieldUnitDbObject; unit?: Unit }) {
  const resolvedUnit =
    unit ||
    TestUtil.getUnit({
      id: fieldUnit.unit,
    })
  const unitFromIdSpy = jest.spyOn(UnitResolver, 'fromId').mockResolvedValue(resolvedUnit)

  const expected: FieldUnit = {
    artStyle: fieldUnit.artStyle,
    effectiveStrength: fieldUnit.effectiveStrength,
    effects: [],
    unit: resolvedUnit,
    row: fieldUnit.row as Combat,
    __typename: 'FieldUnit',
  }
  await expect(
    FieldUnitResolver.fromObject({
      fieldUnit,
      unit,
    })
  ).resolves.toEqual(expected)

  expect(unitFromIdSpy.mock.calls).toEqual(
    unit
      ? []
      : [
          [
            {
              id: fieldUnit.unit,
            },
          ],
        ]
  )
}

async function testFromArray({
  fieldUnits,
  units,
  resolvedUnits,
}: {
  fieldUnits: FieldUnitDbObject[]
  units?: Unit[]
  resolvedUnits?: Unit[]
}) {
  const unitFromIdsSpy = jest.spyOn(UnitResolver, 'fromIds')
  if (resolvedUnits) {
    unitFromIdsSpy.mockResolvedValue(resolvedUnits)
  }
  const fromObjectSpy = jest.spyOn(FieldUnitResolver, 'fromObject')
  const expected: FieldUnit[] = []
  fieldUnits.map((fieldUnit, index) => {
    const resolvedFieldUnit: FieldUnit = {
      artStyle: fieldUnit.artStyle,
      effectiveStrength: fieldUnit.effectiveStrength,
      unit: (units || resolvedUnits || [])[index],
      row: fieldUnit.row as Combat,
    }
    fromObjectSpy.mockResolvedValueOnce(resolvedFieldUnit)
    expected.push(resolvedFieldUnit)
  })

  await expect(
    FieldUnitResolver.fromArray({
      fieldUnits,
      units,
    })
  ).resolves.toEqual(expected)

  expect(unitFromIdsSpy.mock.calls).toEqual(
    fieldUnits.length > 0 && !units
      ? [
          [
            {
              ids: fieldUnits.map((fieldUnit) => fieldUnit.unit),
            },
          ],
        ]
      : []
  )
  expect(fromObjectSpy.mock.calls).toEqual(
    fieldUnits.length > 0
      ? fieldUnits.map((fieldUnit, index) => {
          return [
            {
              fieldUnit,
              unit: (units || resolvedUnits || [])[index],
            },
          ]
        })
      : []
  )
}
