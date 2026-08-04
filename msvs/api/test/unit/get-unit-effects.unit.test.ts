import { EffectDbObject, UnitDbObject } from '@gwent-oss/graphql-schema/database-typings'
import EffectStore from '../../src/database/stores/effect-store'
import getUnitEffects from '../../src/graphql/resolvers/mutations/util/get-unit-effects'
import TestUtil from '../util/test-util'

describe('get-unit-effects', () => {
  describe('single unit', () => {
    it('returns empty array if unit has no effects', async () => {
      await testGetUnitEffects({
        units: [TestUtil.getDbUnit({})],
        expected: [],
      })
    })
    it('retrieves single effect if unit has single effect and no effect prefetched', async () => {
      const effects = [TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({
            effects: [effects[0]._id],
          }),
        ],
        expected: effects,
        effectStoreCalls: [
          [
            {
              ids: [effects[0]._id.toString()],
            },
          ],
        ],
      })
    })
    it('retrieves single effect if unit has single effect and different effect prefetched', async () => {
      const effects = [TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({
            effects: [effects[0]._id],
          }),
        ],
        effects: [TestUtil.getDbEffect({})],
        expected: effects,
        effectStoreCalls: [
          [
            {
              ids: [effects[0]._id.toString()],
            },
          ],
        ],
      })
    })
    it('returns empty array if unit has single effect and matches effect prefetched', async () => {
      const effects = [TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({
            effects: [effects[0]._id],
          }),
        ],
        effects,
        expected: [],
      })
    })
    it('retrieves multiple effects if unit has multiple effects and no effects prefetched', async () => {
      const effects = [TestUtil.getDbEffect({}), TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({
            effects: [effects[0]._id, effects[1]._id],
          }),
        ],
        expected: effects,
        effectStoreCalls: [
          [
            {
              ids: [effects[0]._id.toString(), effects[1]._id.toString()],
            },
          ],
        ],
      })
    })
    it('retrieves single effects if unit has multiple effects and first effect prefetched', async () => {
      const effects = [TestUtil.getDbEffect({}), TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({
            effects: [effects[0]._id, effects[1]._id],
          }),
        ],
        effects: [effects[0]],
        expected: [effects[1]],
        effectStoreCalls: [
          [
            {
              ids: [effects[1]._id.toString()],
            },
          ],
        ],
      })
    })
    it('retrieves single effects if unit has multiple effects and last effect prefetched', async () => {
      const effects = [TestUtil.getDbEffect({}), TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({
            effects: [effects[0]._id, effects[1]._id],
          }),
        ],
        effects: [effects[1]],
        expected: [effects[0]],
        effectStoreCalls: [
          [
            {
              ids: [effects[0]._id.toString()],
            },
          ],
        ],
      })
    })
    it('returns empty array if if unit has multiple effects and all effects prefetched', async () => {
      const effects = [TestUtil.getDbEffect({}), TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({
            effects: [effects[0]._id, effects[1]._id],
          }),
        ],
        effects: [effects[0], effects[1]],
        expected: [],
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
    it('retrieves single effect if first unit has single effect and no prefetches', async () => {
      const effects = [TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({
            effects: [effects[0]._id],
          }),
          TestUtil.getDbUnit({}),
        ],
        expected: effects,
        effectStoreCalls: [
          [
            {
              ids: [effects[0]._id.toString()],
            },
          ],
        ],
      })
    })
    it('retrieves single effect if first unit has single effect and prefetch does not match', async () => {
      const effects = [TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({
            effects: [effects[0]._id],
          }),
          TestUtil.getDbUnit({}),
        ],
        effects: [TestUtil.getDbEffect({})],
        expected: effects,
        effectStoreCalls: [
          [
            {
              ids: [effects[0]._id.toString()],
            },
          ],
        ],
      })
    })
    it('returns empty array if first unit has single effect and prefetch matches', async () => {
      const effects = [TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({
            effects: [effects[0]._id],
          }),
          TestUtil.getDbUnit({}),
        ],
        effects,
        expected: [],
      })
    })
    it('retrieves single effect if first unit has single effect and no prefetches', async () => {
      const effects = [TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({}),
          TestUtil.getDbUnit({
            effects: [effects[0]._id],
          }),
        ],
        expected: effects,
        effectStoreCalls: [
          [
            {
              ids: [effects[0]._id.toString()],
            },
          ],
        ],
      })
    })
    it('retrieves single effect if second unit has single effect and prefetch does not match', async () => {
      const effects = [TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({}),
          TestUtil.getDbUnit({
            effects: [effects[0]._id],
          }),
        ],
        effects: [TestUtil.getDbEffect({})],
        expected: effects,
        effectStoreCalls: [
          [
            {
              ids: [effects[0]._id.toString()],
            },
          ],
        ],
      })
    })
    it('returns empty array if second unit has single effect and prefetch matches', async () => {
      const effects = [TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({}),
          TestUtil.getDbUnit({
            effects: [effects[0]._id],
          }),
        ],
        effects,
        expected: [],
      })
    })
    it('retrieves single effect if both units have same single effect and no prefetches', async () => {
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
        effectStoreCalls: [
          [
            {
              ids: [effects[0]._id.toString()],
            },
          ],
        ],
      })
    })
    it('retrieves single effect if both units have same single effect and prefetch does not match', async () => {
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
        effects: [TestUtil.getDbEffect({})],
        expected: effects,
        effectStoreCalls: [
          [
            {
              ids: [effects[0]._id.toString()],
            },
          ],
        ],
      })
    })
    it('returns empty array if both units have same single effect and prefetch matches', async () => {
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
        effects,
        expected: [],
      })
    })
    it('retrieves multiple effects if first unit has multiple effects and no prefetches', async () => {
      const effects = [TestUtil.getDbEffect({}), TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({
            effects: [effects[0]._id, effects[1]._id],
          }),
          TestUtil.getDbUnit({}),
        ],
        expected: effects,
        effectStoreCalls: [
          [
            {
              ids: [effects[0]._id.toString(), effects[1]._id.toString()],
            },
          ],
        ],
      })
    })
    it('retrieves multiple effects if first unit has multiple effects and all prefetches do not match', async () => {
      const effects = [TestUtil.getDbEffect({}), TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({
            effects: [effects[0]._id, effects[1]._id],
          }),
          TestUtil.getDbUnit({}),
        ],
        effects: [TestUtil.getDbEffect({})],
        expected: effects,
        effectStoreCalls: [
          [
            {
              ids: [effects[0]._id.toString(), effects[1]._id.toString()],
            },
          ],
        ],
      })
    })
    it('retrieves single effect if first unit has multiple effects and all but one prefetches match', async () => {
      const effects = [TestUtil.getDbEffect({}), TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({
            effects: [effects[0]._id, effects[1]._id],
          }),
          TestUtil.getDbUnit({}),
        ],
        effects: [effects[0]],
        expected: [effects[1]],
        effectStoreCalls: [
          [
            {
              ids: [effects[1]._id.toString()],
            },
          ],
        ],
      })
    })
    it('ignores duplicate prefetch', async () => {
      const effects = [TestUtil.getDbEffect({}), TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({
            effects: [effects[0]._id, effects[1]._id],
          }),
          TestUtil.getDbUnit({}),
        ],
        effects: [effects[0], effects[0]],
        expected: [effects[1]],
        effectStoreCalls: [
          [
            {
              ids: [effects[1]._id.toString()],
            },
          ],
        ],
      })
    })
    it('returns empty array for single effect if first unit has multiple effects and all prefetches match', async () => {
      const effects = [TestUtil.getDbEffect({}), TestUtil.getDbEffect({})]
      await testGetUnitEffects({
        units: [
          TestUtil.getDbUnit({
            effects: [effects[0]._id, effects[1]._id],
          }),
          TestUtil.getDbUnit({}),
        ],
        effects,
        expected: [],
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
        effectStoreCalls: [
          [
            {
              ids: [effects[0]._id.toString(), effects[1]._id.toString()],
            },
          ],
        ],
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
        effectStoreCalls: [
          [
            {
              ids: [effects[0]._id.toString(), effects[1]._id.toString()],
            },
          ],
        ],
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
        effectStoreCalls: [
          [
            {
              ids: [effects[0]._id.toString(), effects[1]._id.toString(), effects[2]._id.toString()],
            },
          ],
        ],
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
        effectStoreCalls: [
          [
            {
              ids: [
                effects[0]._id.toString(),
                effects[1]._id.toString(),
                effects[2]._id.toString(),
                effects[3]._id.toString(),
              ],
            },
          ],
        ],
      })
    })
  })
})

async function testGetUnitEffects({
  units,
  effects,
  expected,
  effectStoreCalls = [],
}: {
  units: UnitDbObject[]
  effects?: EffectDbObject[]
  expected: EffectDbObject[]
  effectStoreCalls?: any[][]
}) {
  const effectStoreGetSpy = jest.spyOn(EffectStore, 'get').mockResolvedValue(expected)

  await expect(
    getUnitEffects({
      units,
      effects,
    })
  ).resolves.toEqual(expected)

  expect(effectStoreGetSpy.mock.calls).toEqual(effectStoreCalls)
}
