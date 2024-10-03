import validatePositiveInteger from '../../src/validate-positive-integer.mjs'

describe('validatePositiveInteger', () => {
  describe('invalid', () => {
    it('throws error if candiate is undefined', () => {
      const candidate = undefined
      expect(() => validatePositiveInteger(candidate)).toThrow(
        `Invalid positive integer "${candidate}", type "undefined" is not one of the accepted types: "bigint, number, string"`
      )
    })
    it('throws error if candiate is null', () => {
      const candidate = null
      expect(() => validatePositiveInteger(candidate)).toThrow(
        `Invalid positive integer "undefined", type "object" is not one of the accepted types: "bigint, number, string"`
      )
    })
    it('throws error if candiate is boolean true', () => {
      const candidate = true
      expect(() => validatePositiveInteger(candidate)).toThrow(
        `Invalid positive integer "${candidate}", type "boolean" is not one of the accepted types: "bigint, number, string"`
      )
    })
    it('throws error if candiate is boolean false', () => {
      const candidate = false
      expect(() => validatePositiveInteger(candidate)).toThrow(
        `Invalid positive integer "${candidate}", type "boolean" is not one of the accepted types: "bigint, number, string"`
      )
    })
    it('throws error if candidate is function', () => {
      const candidate = () => {}
      expect(() => validatePositiveInteger(candidate)).toThrow(
        `Invalid positive integer "${candidate}", type "function" is not one of the accepted types: "bigint, number, string"`
      )
    })
    it('throws error if candidate is object', () => {
      const candidate = {}
      expect(() => validatePositiveInteger(candidate)).toThrow(
        `Invalid positive integer "${candidate}", type "object" is not one of the accepted types: "bigint, number, string"`
      )
    })
    it('throws error if candidate is array', () => {
      const candidate = [1]
      expect(() => validatePositiveInteger(candidate)).toThrow(
        `Invalid positive integer "${candidate}", type "object" is not one of the accepted types: "bigint, number, string"`
      )
    })
    it('throws error if candidate is symbol', () => {
      const candidate = Symbol(1)
      expect(() => validatePositiveInteger(candidate)).toThrow(
        `Invalid positive integer "${candidate.toString()}", type "symbol" is not one of the accepted types: "bigint, number, string"`
      )
    })
    it('throws error if empty string', () => {
      const candidate = ''
      expect(() => validatePositiveInteger(candidate)).toThrow(
        `Invalid positive integer "${candidate}", must contain numeric characters.`
      )
    })
    it('throws error if decimal', () => {
      const candidate = 10.5
      expect(() => validatePositiveInteger(candidate)).toThrow(
        `Invalid positive integer "${candidate}", cannot contain period.`
      )
    })
    it('throws error if negative', () => {
      const candidate = -1
      expect(() => validatePositiveInteger(candidate)).toThrow(
        `Invalid positive integer "${candidate}", cannot contain negative symbol.`
      )
    })
    it('throws error if letters', () => {
      const candidate = 'one'
      expect(() => validatePositiveInteger(candidate)).toThrow(
        `Invalid positive integer "${candidate}", must only contain numeric digit characters.`
      )
    })
    it('throws error if zero when allowZero false', () => {
      const candidate = 0
      expect(() => validatePositiveInteger(candidate)).toThrow(
        `Invalid positive integer "${candidate}", zero is not positive.`
      )
    })
  })
  describe('valid', () => {
    it('returns number for zero if allowZero true', () => {
      expect(
        validatePositiveInteger(0, {
          allowZero: true,
        })
      ).toEqual(0)
    })
    it('returns number for 1', () => {
      expect(validatePositiveInteger(1)).toEqual(1)
    })
    it('returns number for 2', () => {
      expect(validatePositiveInteger(2)).toEqual(2)
    })
    it('returns number for 10', () => {
      expect(validatePositiveInteger(10)).toEqual(10)
    })
    it('returns number for 1000', () => {
      expect(validatePositiveInteger(1000)).toEqual(1000)
    })
  })
})
