import crypto, { BinaryLike } from 'crypto'

import PasswordHasher from '../../src/util/password-hasher'

describe('password-hasher', () => {
  describe('scryptAsync', () => {
    it('returns derivedKey if no errors', async () => {
      const password = 'password'
      const salt = 'salt'
      const keyLength = 64
      const derivedKey = Buffer.from('key', 'utf-8')
      const scryptSpy = jest
        .spyOn(crypto, 'scrypt')
        .mockImplementation((password: BinaryLike, salt: BinaryLike, keyLength: number, callback: any) => {
          callback(null, derivedKey)
        })

      await expect(PasswordHasher['scryptAsync'](password, salt, keyLength)).resolves.toEqual(derivedKey)

      expect(scryptSpy.mock.calls).toEqual([[password, salt, keyLength, expect.any(Function)]])
    })
    it('rejects with error if thrown', async () => {
      const password = 'password'
      const salt = 'salt'
      const keyLength = 64
      const error = Error('bad')
      const scryptSpy = jest
        .spyOn(crypto, 'scrypt')
        .mockImplementation((password: BinaryLike, salt: BinaryLike, keyLength: number, callback: any) => {
          callback(error, '')
        })

      await expect(PasswordHasher['scryptAsync'](password, salt, keyLength)).rejects.toThrow(error)

      expect(scryptSpy.mock.calls).toEqual([[password, salt, keyLength, expect.any(Function)]])
    })
  })
  describe('hash', () => {
    it('calls to create hashed password', async () => {
      const password = 'password'
      const salt = '123'
      const derivedKey = Buffer.from('key', 'utf-8')
      const randomBytesSpy = jest.spyOn(crypto, 'randomBytes').mockImplementation(() => salt)
      const scryptAsyncSpy = jest.spyOn(PasswordHasher as any, 'scryptAsync').mockResolvedValue(derivedKey)

      await expect(PasswordHasher.hash(password)).resolves.toEqual('6b6579:123')

      expect(randomBytesSpy.mock.calls).toEqual([[16]])
      expect(scryptAsyncSpy.mock.calls).toEqual([[password, salt, 64]])
    })
  })
  describe('match', () => {
    it('returns true if timingsSafeEqual returns true', async () => {
      const password = 'password'
      const storedPassword = 'hash:salt'
      const buffer = 'buffer'
      const scryptAsyncSpy = jest.spyOn(PasswordHasher as any, 'scryptAsync').mockResolvedValue(buffer)
      const timingSafeEqualSpy = jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(true)

      await expect(PasswordHasher.match(password, storedPassword)).resolves.toEqual(true)

      expect(scryptAsyncSpy.mock.calls).toEqual([[password, 'salt', 64]])
      expect(timingSafeEqualSpy.mock.calls).toEqual([[Buffer.from('hash', 'hex'), buffer]])
    })
    it('returns true if timingsSafeEqual returns true', async () => {
      const password = 'password'
      const storedPassword = 'hash:salt'
      const buffer = 'buffer'
      const scryptAsyncSpy = jest.spyOn(PasswordHasher as any, 'scryptAsync').mockResolvedValue(buffer)
      const timingSafeEqualSpy = jest.spyOn(crypto, 'timingSafeEqual').mockReturnValue(false)

      await expect(PasswordHasher.match(password, storedPassword)).resolves.toEqual(false)

      expect(scryptAsyncSpy.mock.calls).toEqual([[password, 'salt', 64]])
      expect(timingSafeEqualSpy.mock.calls).toEqual([[Buffer.from('hash', 'hex'), buffer]])
    })
  })
})
