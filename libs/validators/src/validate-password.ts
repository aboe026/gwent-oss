import isLetter from './is-letter'
import isPositiveInteger from './is-positive-integer'
import { PASSWORD_REQUIREMENTS } from '@gwent-oss/constants'

/**
 * Checks whether a password is valid or not, returning potential violations.
 *
 * @param password The password to check for violations.
 * @returns Whether or not the password is valid along with any potential violations if it is not.
 */
export default function validatePassword(password: string): ValidatedPassword {
  const tooShort = password.length < PASSWORD_REQUIREMENTS.Min
  const tooLong = password.length > PASSWORD_REQUIREMENTS.Max
  const noLowercase = !/[a-z]/.test(password)
  const noUppercase = !/[A-Z]/.test(password)
  const noNumber = !/[0-9]/.test(password)
  let noSpecial = true
  const spaces = password.includes(' ')
  const badSpecials: Set<string> = new Set<string>()

  for (let i = 0; i < password.length; i++) {
    const char = password[i]
    if (PASSWORD_REQUIREMENTS.Specials.includes(char)) {
      noSpecial = false
    }
    if (!isLetter(char) && !isPositiveInteger(char) && char !== ' ' && !PASSWORD_REQUIREMENTS.Specials.includes(char)) {
      badSpecials.add(char)
    }
  }

  return {
    valid: !(
      tooShort ||
      tooLong ||
      noLowercase ||
      noUppercase ||
      noNumber ||
      noSpecial ||
      spaces ||
      badSpecials.size > 0
    ),
    tooShort,
    tooLong,
    noLowercase,
    noUppercase,
    noNumber,
    noSpecial,
    spaces,
    badSpecials,
  }
}

interface ValidatedPassword {
  valid: boolean
  tooShort: boolean
  tooLong: boolean
  noLowercase: boolean
  noUppercase: boolean
  noNumber: boolean
  noSpecial: boolean
  spaces: boolean
  badSpecials: Set<string>
}
