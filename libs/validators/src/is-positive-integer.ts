/**
 * Checks whether a given string contains only integers (0-9).
 *
 * @param str The string to check for integers.
 * @returns True if the string only contains integers (0-9), false otherwise.
 */
export default function isPositiveInteger(str: string) {
  let valid = str.length > 0 ? true : false
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']

  for (let i = 0; i < str.length && valid; i++) {
    const char = str[i]
    if (!digits.includes(char)) {
      valid = false
    }
  }

  return valid
}
