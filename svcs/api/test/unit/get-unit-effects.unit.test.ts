import { EffectDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import EffectStore from '../../src/database/stores/effect-store'
import getUnitEffects from '../../src/graphql/resolvers/mutations/play-unit/get-unit-effects'
import TestUtil from '../util/test-util'

describe('get-unit-effects', () => {
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

async function testGetUnitEffects({ units, expected }: { units: UnitDbObject[]; expected: EffectDbObject[] }) {
  const effectStoreGetSpy = jest.spyOn(EffectStore, 'get').mockResolvedValue(expected)

  await expect(getUnitEffects(units)).resolves.toEqual(expected)

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
