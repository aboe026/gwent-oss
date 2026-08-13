import { USERNAME_REQUIREMENTS } from '@gwent-oss/constants'
import isLetter from './is-letter'
import isPositiveInteger from './is-positive-integer'

/**
 * Checks whether a username is valid or not, returning potential violations.
 *
 * @param username The username to check for violations.
 * @returns Whether or not the username is valid along with any potential violations if it is not.
 */
export default function validateUsername(username: string): ValidatedUsername {
  const tooShort = username.length < USERNAME_REQUIREMENTS.Min
  const tooLong = username.length > USERNAME_REQUIREMENTS.Max
  const spaces = username.includes(' ')
  const badSpecials: Set<string> = new Set<string>()

  for (let i = 0; i < username.length; i++) {
    const char = username[i]
    if (!isLetter(char) && !isPositiveInteger(char) && char !== ' ' && !USERNAME_REQUIREMENTS.Specials.includes(char)) {
      badSpecials.add(char)
    }
  }

  return {
    valid: !(tooShort || tooLong || spaces || badSpecials.size > 0),
    tooShort,
    tooLong,
    spaces,
    badSpecials,
  }
}

interface ValidatedUsername {
  valid: boolean
  tooShort: boolean
  tooLong: boolean
  spaces: boolean
  badSpecials: Set<string>
}
