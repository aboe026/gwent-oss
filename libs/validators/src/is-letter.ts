/**
 * Checks whether a given string contains only letters (A-Z, capital or lowercase).
 *
 * @param str The string to check for letters.
 * @returns True if all the characters of a string a letters (A-Z, capital or lowercase), false otherwise.
 */
export default function isLetter(str: string) {
  let valid = str.length > 0 ? true : false
  const lowercases = [
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'w',
    'x',
    'y',
    'z',
  ]
  const uppercases = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'H',
    'I',
    'J',
    'K',
    'L',
    'M',
    'N',
    'O',
    'P',
    'Q',
    'R',
    'S',
    'T',
    'U',
    'V',
    'W',
    'X',
    'Y',
    'Z',
  ]

  for (let i = 0; i < str.length && valid; i++) {
    const char = str[i]
    if (!lowercases.includes(char) && !uppercases.includes(char)) {
      valid = false
    }
  }

  return valid
}
