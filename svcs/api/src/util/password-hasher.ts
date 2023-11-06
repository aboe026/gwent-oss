import { randomBytes, scrypt, timingSafeEqual } from 'crypto'

/**
 * A class to hash and check passwords
 */
export default class PasswordHasher {
  private static readonly HEX_SALT_SEPARATOR = ':'

  /**
   * Performs a password-based key derivation function
   *
   * @param password The password to generate the key for
   * @param salt The salt to use for generating the key
   * @param keyLength The length of the key to generate
   * @returns The derived key
   */
  private static scryptAsync(password: string, salt: string, keyLength: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      scrypt(password, salt, keyLength, (err: Error | null, derivedKey: Buffer) => {
        if (err) {
          reject(err)
        } else {
          resolve(derivedKey)
        }
      })
    })
  }

  /**
   * Get the hash representation of a password
   *
   * @param password The password to hash
   * @returns The hashed representation of the password
   */
  static async hash(password: string) {
    const salt = randomBytes(16).toString('hex')
    const buf = await PasswordHasher.scryptAsync(password, salt, 64)
    return `${buf.toString('hex')}${PasswordHasher.HEX_SALT_SEPARATOR}${salt}`
  }

  /**
   * Check if a password matches a hash
   *
   * @param password The password to check
   * @param stored The hashed password to compare to
   * @returns True if the password matches the stored hash, false otherwise
   */
  static async match(password: string, stored: string): Promise<boolean> {
    const [hashedPassword, salt] = stored.split(PasswordHasher.HEX_SALT_SEPARATOR)
    const hashedPasswordBuf = Buffer.from(hashedPassword, 'hex')
    const suppliedPasswordBuf = await PasswordHasher.scryptAsync(password, salt, 64)
    return timingSafeEqual(hashedPasswordBuf, suppliedPasswordBuf)
  }
}
