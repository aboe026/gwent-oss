import validatePassword from '../../src/validate-password'

describe('validatePassword', () => {
  describe('invalid', () => {
    it('valid false and returns violation for single character too short', () => {
      testValidatePassword({
        password: 'p@ssW0r',
        valid: false,
        tooShort: true,
      })
    })
    it('valid false and returns violation for many characters too short', () => {
      testValidatePassword({
        password: 'p@ssW0',
        valid: false,
        tooShort: true,
      })
    })
    it('valid false and returns violation for empty string', () => {
      testValidatePassword({
        password: '',
        valid: false,
        tooShort: true,
        noLowercase: true,
        noUppercase: true,
        noNumber: true,
        noSpecial: true,
      })
    })
    it('valid false and returns violation for single character too long', () => {
      testValidatePassword({
        password: '1234567890123456789012345678901234567890123p@ssW0rd',
        valid: false,
        tooLong: true,
      })
    })
    it('valid false and returns violation for multiple characters too long', () => {
      testValidatePassword({
        password:
          '12345678901234567890123456789012345678901234567890123456789012345678901234567890123456789012p@ssW0rd',
        valid: false,
        tooLong: true,
      })
    })
    it('valid false and returns violation for missing lowercase', () => {
      testValidatePassword({
        password: 'P@SSW0RD',
        valid: false,
        noLowercase: true,
      })
    })
    it('valid false and returns violation for missing uppercase', () => {
      testValidatePassword({
        password: 'p@ssw0rd',
        valid: false,
        noUppercase: true,
      })
    })
    it('valid false and returns violation for missing number', () => {
      testValidatePassword({
        password: 'p@ssWord',
        valid: false,
        noNumber: true,
      })
    })
    it('valid false and returns violation for missing special', () => {
      testValidatePassword({
        password: 'passW0rd',
        valid: false,
        noSpecial: true,
      })
    })
    it('valid false and returns violation for single space', () => {
      testValidatePassword({
        password: 'p@ss W0rd',
        valid: false,
        spaces: true,
      })
    })
    it('valid false and returns violation for multiple spaces', () => {
      testValidatePassword({
        password: 'p@ss W0rd ',
        valid: false,
        spaces: true,
      })
    })
    it('valid false and returns violation for single bad special', () => {
      testValidatePassword({
        password: 'p@ssW0rd$',
        valid: false,
        badSpecials: new Set(['$']),
      })
    })
    it('valid false and returns violation for multiple bad specials', () => {
      testValidatePassword({
        password: 'p@ssW0rd$.',
        valid: false,
        badSpecials: new Set(['$', '.']),
      })
    })
  })
  describe('valid', () => {
    it('valid true and no violations if all rules met minimally', () => {
      testValidatePassword({
        password: 'p@ssW0rd',
        valid: true,
      })
    })
  })
})

function testValidatePassword({
  password,
  valid,
  tooShort = false,
  tooLong = false,
  noLowercase = false,
  noUppercase = false,
  noNumber = false,
  noSpecial = false,
  spaces = false,
  badSpecials = new Set<string>(),
}: {
  password: string
  valid: boolean
  tooShort?: boolean
  tooLong?: boolean
  noLowercase?: boolean
  noUppercase?: boolean
  noNumber?: boolean
  noSpecial?: boolean
  spaces?: boolean
  badSpecials?: Set<string>
}) {
  expect(validatePassword(password)).toEqual({
    valid,
    tooShort,
    tooLong,
    noLowercase,
    noUppercase,
    noNumber,
    noSpecial,
    spaces,
    badSpecials,
  })
}
