import isLetter from '../../src/is-letter'

describe('is-letter', () => {
  describe('invalid', () => {
    it('returns false if empty string', () => {
      expect(isLetter('')).toEqual(false)
    })
    it('returns false if single space', () => {
      expect(isLetter(' ')).toEqual(false)
    })
    it('returns false if multiple spaces', () => {
      expect(isLetter('  ')).toEqual(false)
    })
    it('returns false if letter with space', () => {
      expect(isLetter('a ')).toEqual(false)
    })
    it('returns false if single number', () => {
      expect(isLetter('1')).toEqual(false)
    })
    it('returns false if multi digit number', () => {
      expect(isLetter('123456')).toEqual(false)
    })
    it('returns false if letter with number', () => {
      expect(isLetter('a ')).toEqual(false)
    })
    it('returns false if single special character', () => {
      expect(isLetter('%')).toEqual(false)
    })
    it('returns false if multiple special characters', () => {
      expect(isLetter('.#()!%')).toEqual(false)
    })
    it('returns false if letter with special character', () => {
      expect(isLetter('a!')).toEqual(false)
    })
  })
  describe('valid', () => {
    it('returns true for single lowercase letter', () => {
      expect(isLetter('a')).toEqual(true)
    })
    it('returns true for multiple lowercase letters', () => {
      expect(isLetter('abc')).toEqual(true)
    })
    it('returns true for single uppercase letter', () => {
      expect(isLetter('A')).toEqual(true)
    })
    it('returns true for multiple uppercase letters', () => {
      expect(isLetter('ABC')).toEqual(true)
    })
    it('returns true for mixed case letters', () => {
      expect(isLetter('aBc')).toEqual(true)
    })
  })
})
