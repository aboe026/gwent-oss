import validateUsername from '../../src/validate-username'

describe('validateUsername', () => {
  describe('invalid', () => {
    it('valid false and returns violation for single character too short', () => {
      testValidateUsername({
        username: '12',
        valid: false,
        tooShort: true,
      })
    })
    it('valid false and returns violation for many characters too short', () => {
      testValidateUsername({
        username: '1',
        valid: false,
        tooShort: true,
      })
    })
    it('valid false and returns violation for empty string', () => {
      testValidateUsername({
        username: '',
        valid: false,
        tooShort: true,
      })
    })
    it('valid false and returns violation for single character too long', () => {
      testValidateUsername({
        username: '123456789012345678901234567890123456789012345678901',
        valid: false,
        tooLong: true,
      })
    })
    it('valid false and returns violation for multiple characters too long', () => {
      testValidateUsername({
        username:
          '1234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890',
        valid: false,
        tooLong: true,
      })
    })
    it('valid false and returns violation for single space', () => {
      testValidateUsername({
        username: 'james bond',
        valid: false,
        spaces: true,
      })
    })
    it('valid false and returns violation for multiple spaces', () => {
      testValidateUsername({
        username: 'james earl jones',
        valid: false,
        spaces: true,
      })
    })
    it('valid false and returns violation for single bad character', () => {
      testValidateUsername({
        username: 'hello_',
        valid: false,
        badSpecials: new Set(['_']),
      })
    })
    it('valid false and returns violation for single bad character', () => {
      testValidateUsername({
        username: 'hello_(',
        valid: false,
        badSpecials: new Set(['_', '(']),
      })
    })
  })
  describe('valid', () => {
    it('valid true and no violations if minimum length and only letters', () => {
      testValidateUsername({
        username: 'abc',
        valid: true,
      })
    })
    it('valid true and no violations if medium length and only letters', () => {
      testValidateUsername({
        username: 'abcdefghijklmnopqrstuvwxyz',
        valid: true,
      })
    })
    it('valid true and no violations if maximum length and only letters', () => {
      testValidateUsername({
        username: 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwx',
        valid: true,
      })
    })
    it('valid true and no violations if minimum length and only numbers', () => {
      testValidateUsername({
        username: '123',
        valid: true,
      })
    })
    it('valid true and no violations if medium length and only numbers', () => {
      testValidateUsername({
        username: '1234567890',
        valid: true,
      })
    })
    it('valid true and no violations if maximum length and only numbers', () => {
      testValidateUsername({
        username: '12345678901234567890123456789012345678901234567890',
        valid: true,
      })
    })
    it('valid true and no violations if minimum length and only special characters', () => {
      testValidateUsername({
        username: '!&-',
        valid: true,
      })
    })
    it('valid true and no violations if medium length and only special characters', () => {
      testValidateUsername({
        username: '!&-+~',
        valid: true,
      })
    })
    it('valid true and no violations if minimum length and mixed', () => {
      testValidateUsername({
        username: 'a1!',
        valid: true,
      })
    })
    it('valid true and no violations if medium length and mixed', () => {
      testValidateUsername({
        username: 'h3lloW0rld!!',
        valid: true,
      })
    })
    it('valid true and no violations if maximum length and mixed', () => {
      testValidateUsername({
        username: 'hi-W0rld!!hi-W0rld!!hi-W0rld!!hi-W0rld!!hi-W0rld!!',
        valid: true,
      })
    })
  })
})

function testValidateUsername({
  username,
  valid,
  tooShort = false,
  tooLong = false,
  spaces = false,
  badSpecials = new Set<string>(),
}: {
  username: string
  valid: boolean
  tooShort?: boolean
  tooLong?: boolean
  spaces?: boolean
  badSpecials?: Set<string>
}) {
  expect(validateUsername(username)).toEqual({
    valid,
    tooShort,
    tooLong,
    spaces,
    badSpecials,
  })
}
