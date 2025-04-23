import { EffectDbObject, EffectKey } from '@gwent/graphql-schema/database-typings'
import GetEffectWithKey from '../../src/graphql/resolvers/mutations/play-unit/get-effect-with-key'
import TestUtil from '../util/test-util'

describe('get-effect-with-key', () => {
  it('throws error if more than 1 effect with key', () => {
    const effects = [
      TestUtil.getDbEffect({
        key: EffectKey.Bond,
      }),
      TestUtil.getDbEffect({
        key: EffectKey.Bond,
      }),
    ]
    const message = `Found more than 1 effect with key "${EffectKey.Bond}"`
    testGetEffectWithKey({
      effectKey: EffectKey.Bond,
      effects,
      error: Error(message),
      errorCalls: [[`${message}: ${JSON.stringify(effects)}`]],
    })
  })
  it('returns undefined if no effects', () => {
    testGetEffectWithKey({
      effectKey: EffectKey.Agile,
      effects: [],
      expected: undefined,
    })
  })
  it('returns undefined if effects but none match key', () => {
    testGetEffectWithKey({
      effectKey: EffectKey.Agile,
      effects: [
        TestUtil.getDbEffect({
          key: EffectKey.Decoy,
        }),
      ],
      expected: undefined,
    })
  })
  it('returns effect if single and matches key', () => {
    const effect = TestUtil.getDbEffect({
      key: EffectKey.Agile,
    })
    testGetEffectWithKey({
      effectKey: EffectKey.Agile,
      effects: [effect],
      expected: effect,
    })
  })
  it('returns effect if multiple and first matches key', () => {
    const effect = TestUtil.getDbEffect({
      key: EffectKey.Agile,
    })
    testGetEffectWithKey({
      effectKey: EffectKey.Agile,
      effects: [
        effect,
        TestUtil.getDbEffect({
          key: EffectKey.Decoy,
        }),
      ],
      expected: effect,
    })
  })
  it('returns effect if multiple and last matches key', () => {
    const effect = TestUtil.getDbEffect({
      key: EffectKey.Agile,
    })
    testGetEffectWithKey({
      effectKey: EffectKey.Agile,
      effects: [
        TestUtil.getDbEffect({
          key: EffectKey.Decoy,
        }),
        effect,
      ],
      expected: effect,
    })
  })
})

function testGetEffectWithKey({
  effectKey,
  effects,
  expected,
  error,
  errorCalls = [],
}: {
  effectKey: EffectKey
  effects: EffectDbObject[]
  expected?: EffectDbObject
  error?: Error
  errorCalls?: string[][]
}) {
  const errorSpy = jest.fn().mockImplementation()
  GetEffectWithKey['logger'] = {
    error: errorSpy,
  } as any

  if (error) {
    expect(() =>
      GetEffectWithKey.getEffectWithKey({
        effectKey,
        effects,
      })
    ).toThrow(error)
  } else {
    expect(
      GetEffectWithKey.getEffectWithKey({
        effectKey,
        effects,
      })
    ).toEqual(expected)
  }

  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
