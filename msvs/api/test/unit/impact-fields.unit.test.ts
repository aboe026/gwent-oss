import ImpactFields, {
  ImpactFieldGetUnitInput,
  ImpactFieldGetUnitOutput,
} from '../../src/graphql/resolvers/fields/impact-fields'
import TestUtil from '../util/test-util'

describe('impact-fields', () => {
  describe('getFields', () => {
    it('returns object with unit property which calls getUnit method', () => {
      const getUnitResponse = TestUtil.getFieldUnit({})
      const getUnitSpy = jest.spyOn(ImpactFields as any, 'getUnit').mockReturnValue(getUnitResponse)

      const fields = ImpactFields.getFields()
      expect(fields).toEqual({
        unit: expect.any(Function),
      })

      expect(getUnitSpy.mock.calls).toEqual([])
      if (fields?.unit) {
        const impact = TestUtil.getImpact({
          user: TestUtil.getUser({}),
        })
        const context = {
          session: {
            user: TestUtil.getDbUser({}),
          },
        }
        expect((fields as any).unit(impact, null, context)).toEqual(getUnitResponse)
        expect(getUnitSpy.mock.calls).toEqual([
          [
            {
              parent: impact,
              context,
            },
          ],
        ])
      } else {
        throw Error('Fields does not have expected unit property')
      }
    })
  })
  describe('getUnit', () => {
    it('returns undefined if no unit on impact and context user does not match scope', () => {
      testGetUnit({
        inputs: {
          context: {
            session: {
              user: TestUtil.getDbUser({}),
            },
          },
          parent: TestUtil.getImpact({
            unit: null,
            scope: TestUtil.getUser({}),
            user: TestUtil.getUser({}),
          }),
        },
        expected: null,
      })
    })
    it('returns undefined if no unit on impact and context user matches scope', () => {
      const user = TestUtil.getDbUser({})
      testGetUnit({
        inputs: {
          context: {
            session: {
              user,
            },
          },
          parent: TestUtil.getImpact({
            unit: null,
            scope: TestUtil.getUser({
              id: user._id,
            }),
            user: TestUtil.getUser({}),
          }),
        },
        expected: null,
      })
    })
    it('returns impact unit if context user matches scope', () => {
      const user = TestUtil.getDbUser({})
      const unit = TestUtil.getFieldUnit({})
      testGetUnit({
        inputs: {
          context: {
            session: {
              user,
            },
          },
          parent: TestUtil.getImpact({
            unit,
            user: TestUtil.getUser({}),
            scope: TestUtil.getUser({
              id: user._id,
            }),
          }),
        },
        expected: unit,
      })
    })
    it('returns null if impact unit and context user does not match scope', () => {
      testGetUnit({
        inputs: {
          context: {
            session: {
              user: TestUtil.getDbUser({}),
            },
          },
          parent: TestUtil.getImpact({
            unit: TestUtil.getFieldUnit({}),
            scope: TestUtil.getUser({}),
            user: TestUtil.getUser({}),
          }),
        },
        expected: null,
      })
    })
  })
})

function testGetUnit({ inputs, expected }: { inputs: ImpactFieldGetUnitInput; expected: ImpactFieldGetUnitOutput }) {
  expect(
    ImpactFields['getUnit']({
      context: inputs.context,
      parent: inputs.parent,
    })
  ).toEqual(expected)
}
