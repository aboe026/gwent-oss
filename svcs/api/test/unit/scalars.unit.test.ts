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
import { DATE_TIME_FORMAT } from '@gwent/constants'

describe('scalars', () => {
  describe('DateTime', () => {
    describe('serialize', () => {
      it('returns outputValue', () => {
        const value = '2023-11-06T08:19:30.123Z'
        expect(Scalars.DateTime.serialize(value))
      })
    })
    describe('parseValue', () => {
      describe('invalid', () => {
        it('throws error if undefined', () => {
          const value = undefined
          expect(() => Scalars.DateTime.parseValue(value)).toThrow(
            `Invalid DateTime "${value}", type "undefined" must be "string".`
          )
        })
        it('throws error if null', () => {
          const value = null
          expect(() => Scalars.DateTime.parseValue(value)).toThrow(
            `Invalid DateTime "${value}", type "object" must be "string".`
          )
        })
        it('throws error if Boolean true', () => {
          const value = true
          expect(() => Scalars.DateTime.parseValue(value)).toThrow(
            `Invalid DateTime "${value}", type "boolean" must be "string".`
          )
        })
        it('throws error if Boolean false', () => {
          const value = false
          expect(() => Scalars.DateTime.parseValue(value)).toThrow(
            `Invalid DateTime "${value}", type "boolean" must be "string".`
          )
        })
        it('throws error if Date', () => {
          const value = new Date()
          expect(() => Scalars.DateTime.parseValue(value)).toThrow(
            `Invalid DateTime "${value}", type "object" must be "string".`
          )
        })
        it('throws error if Number', () => {
          const value = 1
          expect(() => Scalars.DateTime.parseValue(value)).toThrow(
            `Invalid DateTime "${value}", type "number" must be "string".`
          )
        })
        it('throws error if Object', () => {
          const value = {}
          expect(() => Scalars.DateTime.parseValue(value)).toThrow(
            `Invalid DateTime "${value}", type "object" must be "string".`
          )
        })
        it('throws error if Array', () => {
          const value = ['2023-11-06T08:19:30.123Z']
          expect(() => Scalars.DateTime.parseValue(value)).toThrow(
            `Invalid DateTime "${value}", type "object" must be "string".`
          )
        })
        it('throws error if Symbol', () => {
          const value = Symbol('1.0.0')
          expect(() => Scalars.DateTime.parseValue(value)).toThrow(
            `Invalid DateTime "${String(value)}", type "symbol" must be "string".`
          )
        })
        it('throws error if BigInt', () => {
          const value = BigInt(9007199254740991)
          expect(() => Scalars.DateTime.parseValue(value)).toThrow(
            `Invalid DateTime "${value}", type "bigint" must be "string".`
          )
        })
        it('throws error if Function', () => {
          const value = () => '1.0.0'
          expect(() => Scalars.DateTime.parseValue(value)).toThrow(
            `Invalid DateTime "${value}", type "function" must be "string".`
          )
        })
        it('throws error if String empty', () => {
          const value = ''
          expect(() => Scalars.DateTime.parseValue(value)).toThrow(
            `Invalid DateTime "${value}", must be of format "${DATE_TIME_FORMAT}".`
          )
        })
        it('throws error if date only', () => {
          const value = '2023-11-06'
          expect(() => Scalars.DateTime.parseValue(value)).toThrow(
            `Invalid DateTime "${value}", must be of format "${DATE_TIME_FORMAT}".`
          )
        })
        it('throws error if time only', () => {
          const value = '12:13:14.123Z'
          expect(() => Scalars.DateTime.parseValue(value)).toThrow(
            `Invalid DateTime "${value}", must be of format "${DATE_TIME_FORMAT}".`
          )
        })
      })
      describe('valid', () => {
        it('returns inputValue as Date if valid format', () => {
          const value = '2023-11-06T19:18:20.567Z'
          expect(Scalars.DateTime.parseValue(value)).toEqual(new Date(value))
        })
      })
    })
    describe('parseLiteral', () => {
      describe('invalid', () => {
        it('throws error if BooleanValueNode true', () => {
          const kind = Kind.BOOLEAN
          expect(() =>
            Scalars.DateTime.parseLiteral({
              kind,
              value: true,
            } as BooleanValueNode)
          ).toThrow(`Invalid DateTime, kind "${kind}" must be "String".`)
        })
        it('throws error if BooleanValueNode false', () => {
          const kind = Kind.BOOLEAN
          expect(() =>
            Scalars.DateTime.parseLiteral({
              kind,
              value: false,
            } as BooleanValueNode)
          ).toThrow(`Invalid DateTime, kind "${kind}" must be "String".`)
        })
        it('throws error if EnumValueNode', () => {
          const kind = Kind.ENUM
          expect(() =>
            Scalars.DateTime.parseLiteral({
              kind,
              value: 'enumeration',
            } as EnumValueNode)
          ).toThrow(`Invalid DateTime, kind "${kind}" must be "String".`)
        })
        it('throws error if ListValueNode', () => {
          const kind = Kind.LIST
          expect(() =>
            Scalars.DateTime.parseLiteral({
              kind,
              values: [
                {
                  kind: Kind.STRING,
                  value: 'list-value',
                },
              ],
            } as ListValueNode)
          ).toThrow(`Invalid DateTime, kind "${kind}" must be "String".`)
        })
        it('throws error if FloatValueNode', () => {
          const kind = Kind.FLOAT
          expect(() =>
            Scalars.DateTime.parseLiteral({
              kind,
              value: '1.0',
            } as FloatValueNode)
          ).toThrow(`Invalid DateTime, kind "${kind}" must be "String".`)
        })
        it('throws error if IntValueNode', () => {
          const kind = Kind.INT
          expect(() =>
            Scalars.DateTime.parseLiteral({
              kind,
              value: '1',
            } as IntValueNode)
          ).toThrow(`Invalid DateTime, kind "${kind}" must be "String".`)
        })
        it('throws error if NullValueNode', () => {
          const kind = Kind.NULL
          expect(() =>
            Scalars.DateTime.parseLiteral({
              kind,
            } as NullValueNode)
          ).toThrow(`Invalid DateTime, kind "${kind}" must be "String".`)
        })
        it('throws error if ObjectValueNode', () => {
          const kind = Kind.OBJECT
          expect(() =>
            Scalars.DateTime.parseLiteral({
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
          ).toThrow(`Invalid DateTime, kind "${kind}" must be "String".`)
        })
        it('throws error if VariableNode', () => {
          const kind = Kind.VARIABLE
          expect(() =>
            Scalars.DateTime.parseLiteral({
              kind,
              name: {
                kind: Kind.NAME,
                value: 'variable-name',
              },
            } as VariableNode)
          ).toThrow(`Invalid DateTime, kind "${kind}" must be "String".`)
        })
      })
      describe('valid', () => {
        it('returns value as Date if StringValueNode', () => {
          const value = '2023-11-06T19:18:20.567Z'
          expect(
            Scalars.DateTime.parseLiteral({
              kind: Kind.STRING,
              value,
            })
          ).toEqual(new Date(value))
        })
      })
    })
  })
  describe('SemVer', () => {
    describe('serialize', () => {
      it('returns outputValue', () => {
        const value = '1.2.3'
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
        it('throws error if Boolean true', () => {
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
        it('throws error if Number', () => {
          const value = 1
          expect(() => Scalars.SemVer.parseValue(value)).toThrow(
            `Invalid SemVer "${value}", type "number" must be "string".`
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
        it('returns value if StringValueNode', () => {
          const value = '1.0.0'
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
