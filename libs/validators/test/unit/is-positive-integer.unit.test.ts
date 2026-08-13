import isPositiveInteger from '../../src/is-positive-integer'

describe('is-integer', () => {
  describe('invalid', () => {
    it('returns false if empty string', () => {
      expect(isPositiveInteger('')).toEqual(false)
    })
    it('returns false if single space', () => {
      expect(isPositiveInteger(' ')).toEqual(false)
    })
    it('returns false if multiple spaces', () => {
      expect(isPositiveInteger(' ')).toEqual(false)
    })
    it('returns false if lowercase letter', () => {
      expect(isPositiveInteger('a')).toEqual(false)
    })
    it('returns false if uppercase letter', () => {
      expect(isPositiveInteger('A')).toEqual(false)
    })
    it('returns false if decimal', () => {
      expect(isPositiveInteger('0.5')).toEqual(false)
    })
    it('returns false if comma', () => {
      expect(isPositiveInteger('1,234')).toEqual(false)
    })
    it('returns false if fraction', () => {
      expect(isPositiveInteger('1/2')).toEqual(false)
    })
    it('returns false if negative number', () => {
      expect(isPositiveInteger('-1')).toEqual(false)
    })
  })
  describe('valid', () => {
    it('returns true for zero', () => {
      expect(isPositiveInteger('0')).toEqual(true)
    })
    it('returns true for double zeros', () => {
      expect(isPositiveInteger('00')).toEqual(true)
    })
    it('returns true for single digit number', () => {
      expect(isPositiveInteger('1')).toEqual(true)
    })
    it('returns true for double digit number', () => {
      expect(isPositiveInteger('12')).toEqual(true)
    })
    it('returns true for very large number', () => {
      expect(isPositiveInteger('1234567890')).toEqual(true)
    })
  })
})
