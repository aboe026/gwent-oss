import {
  BooleanValueNode,
  EnumValueNode,
  FloatValueNode,
  IntValueNode,
  Kind,
  ListValueNode,
  NullValueNode,
  ObjectValueNode,
  VariableNode,
} from 'graphql'

import Scalars from '../../src/graphql/scalars'

describe('scalars', () => {
  describe('SemVer', () => {
    describe('serialize', () => {
      it('returns input', () => {
        const value = 'serializable-string'
        expect(Scalars.SemVer.serialize(value)).toEqual(value)
      })
    })
    describe('parseValue', () => {
      describe('invalid', () => {
        it('throws error if undefined', () => {
          const value = undefined
          expect(() => Scalars.SemVer.parseValue(value)).toThrow(
            `Invalid SemVer "${value}", type "undefined" must be "string".`
          )
        })
        it('throws error if null', () => {
          const value = null
          expect(() => Scalars.SemVer.parseValue(value)).toThrow(
            `Invalid SemVer "${value}", type "object" must be "string".`
          )
        })
        it('throws error if Boolean tru', () => {
          const value = true
          expect(() => Scalars.SemVer.parseValue(value)).toThrow(
            `Invalid SemVer "${value}", type "boolean" must be "string".`
          )
        })
        it('throws error if Boolean false', () => {
          const value = false
          expect(() => Scalars.SemVer.parseValue(value)).toThrow(
            `Invalid SemVer "${value}", type "boolean" must be "string".`
          )
        })
        it('throws error if Date', () => {
          const value = new Date()
          expect(() => Scalars.SemVer.parseValue(value)).toThrow(
            `Invalid SemVer "${value}", type "object" must be "string".`
          )
        })
        it('throws error if Object', () => {
          const value = { semver: '1.0.0' }
          expect(() => Scalars.SemVer.parseValue(value)).toThrow(
            `Invalid SemVer "${value}", type "object" must be "string".`
          )
        })
        it('throws error if Array', () => {
          const value = ['1.0.0']
          expect(() => Scalars.SemVer.parseValue(value)).toThrow(
            `Invalid SemVer "${value}", type "object" must be "string".`
          )
        })
        it('throws error if Symbol', () => {
          const value = Symbol('1.0.0')
          expect(() => Scalars.SemVer.parseValue(value)).toThrow(
            `Invalid SemVer "${String(value)}", type "symbol" must be "string".`
          )
        })
        it('throws error if BigInt', () => {
          const value = BigInt(9007199254740991)
          expect(() => Scalars.SemVer.parseValue(value)).toThrow(
            `Invalid SemVer "${value}", type "bigint" must be "string".`
          )
        })
        it('throws error if Function', () => {
          const value = () => '1.0.0'
          expect(() => Scalars.SemVer.parseValue(value)).toThrow(
            `Invalid SemVer "${value}", type "function" must be "string".`
          )
        })
        it('throws error if String empty', () => {
          const value = ''
          expect(() => Scalars.SemVer.parseValue(value)).toThrow(
            `Invalid SemVer "${value}", must follow specifications found at "https://semver.org".`
          )
        })
        it('throws error if String letter', () => {
          const value = 'a'
          expect(() => Scalars.SemVer.parseValue(value)).toThrow(
            `Invalid SemVer "${value}", must follow specifications found at "https://semver.org".`
          )
        })
        it('throws error if String word', () => {
          const value = 'hello'
          expect(() => Scalars.SemVer.parseValue(value)).toThrow(
            `Invalid SemVer "${value}", must follow specifications found at "https://semver.org".`
          )
        })
        it('throws error if String integer', () => {
          const value = '1'
          expect(() => Scalars.SemVer.parseValue(value)).toThrow(
            `Invalid SemVer "${value}", must follow specifications found at "https://semver.org".`
          )
        })
        it('throws error if String decimal', () => {
          const value = '1.0'
          expect(() => Scalars.SemVer.parseValue(value)).toThrow(
            `Invalid SemVer "${value}", must follow specifications found at "https://semver.org".`
          )
        })
        it('throws error if String four decimals', () => {
          const value = '1.0.0.0'
          expect(() => Scalars.SemVer.parseValue(value)).toThrow(
            `Invalid SemVer "${value}", must follow specifications found at "https://semver.org".`
          )
        })
      })
      describe('valid', () => {
        it('returns input if SemVer major minor patch', () => {
          const value = '1.0.0'
          expect(Scalars.SemVer.parseValue(value)).toEqual(value)
        })
        it('returns input if SemVer pre-release', () => {
          const value = '1.0.0-alpha'
          expect(Scalars.SemVer.parseValue(value)).toEqual(value)
        })
        it('returns input if SemVer with build metadata', () => {
          const value = '1.0.0+26'
          expect(Scalars.SemVer.parseValue(value)).toEqual(value)
        })
      })
    })
    describe('parseLiteral', () => {
      describe('invalid', () => {
        it('throws error if BooleanValueNode true', () => {
          const kind = Kind.BOOLEAN
          expect(() =>
            Scalars.SemVer.parseLiteral({
              kind,
              value: true,
            } as BooleanValueNode)
          ).toThrow(`Invalid SemVer, kind "${kind}" must be "String".`)
        })
        it('throws error if BooleanValueNode false', () => {
          const kind = Kind.BOOLEAN
          expect(() =>
            Scalars.SemVer.parseLiteral({
              kind,
              value: false,
            } as BooleanValueNode)
          ).toThrow(`Invalid SemVer, kind "${kind}" must be "String".`)
        })
        it('throws error if EnumValueNode', () => {
          const kind = Kind.ENUM
          expect(() =>
            Scalars.SemVer.parseLiteral({
              kind,
              value: 'enumeration',
            } as EnumValueNode)
          ).toThrow(`Invalid SemVer, kind "${kind}" must be "String".`)
        })
        it('throws error if ListValueNode', () => {
          const kind = Kind.LIST
          expect(() =>
            Scalars.SemVer.parseLiteral({
              kind,
              values: [
                {
                  kind: Kind.STRING,
                  value: 'list-value',
                },
              ],
            } as ListValueNode)
          ).toThrow(`Invalid SemVer, kind "${kind}" must be "String".`)
        })
        it('throws error if FloatValueNode', () => {
          const kind = Kind.FLOAT
          expect(() =>
            Scalars.SemVer.parseLiteral({
              kind,
              value: '1.0',
            } as FloatValueNode)
          ).toThrow(`Invalid SemVer, kind "${kind}" must be "String".`)
        })
        it('throws error if IntValueNode', () => {
          const kind = Kind.INT
          expect(() =>
            Scalars.SemVer.parseLiteral({
              kind,
              value: '1',
            } as IntValueNode)
          ).toThrow(`Invalid SemVer, kind "${kind}" must be "String".`)
        })
        it('throws error if NullValueNode', () => {
          const kind = Kind.NULL
          expect(() =>
            Scalars.SemVer.parseLiteral({
              kind,
            } as NullValueNode)
          ).toThrow(`Invalid SemVer, kind "${kind}" must be "String".`)
        })
        it('throws error if ObjectValueNode', () => {
          const kind = Kind.OBJECT
          expect(() =>
            Scalars.SemVer.parseLiteral({
              kind,
              fields: [
                {
                  kind: Kind.OBJECT_FIELD,
                  name: {
                    kind: Kind.NAME,
                    value: 'field-name',
                  },
                  value: {
                    kind: Kind.STRING,
                    value: 'field-value',
                  },
                },
              ],
            } as ObjectValueNode)
          ).toThrow(`Invalid SemVer, kind "${kind}" must be "String".`)
        })
        it('throws error if VariableNode', () => {
          const kind = Kind.VARIABLE
          expect(() =>
            Scalars.SemVer.parseLiteral({
              kind,
              name: {
                kind: Kind.NAME,
                value: 'variable-name',
              },
            } as VariableNode)
          ).toThrow(`Invalid SemVer, kind "${kind}" must be "String".`)
        })
      })
      describe('valid', () => {
        const value = 'string-value'
        it('returns value if StringValueNode', () => {
          expect(
            Scalars.SemVer.parseLiteral({
              kind: Kind.STRING,
              value,
            })
          ).toEqual(value)
        })
      })
    })
  })
})
