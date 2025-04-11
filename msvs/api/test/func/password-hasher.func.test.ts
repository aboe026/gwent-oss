import PasswordHasher from '../../src/util/password-hasher'

describe('password-hasher', () => {
  describe('hash', () => {
    it('hashed password is different from real password', async () => {
      const password = 'password'

      await expect(PasswordHasher.hash(password)).resolves.not.toEqual(password)
    })
  })
  describe('match', () => {
    it('returns true if passed same password as for hash', async () => {
      const password = 'password'
      const hash = await PasswordHasher.hash(password)

      await expect(PasswordHasher.match(password, hash)).resolves.toEqual(true)
    })
    it('returns false if passed different password than one for hash', async () => {
      const hash = await PasswordHasher.hash('password')

      await expect(PasswordHasher.match('invalid', hash)).resolves.toEqual(false)
    })
  })
})
