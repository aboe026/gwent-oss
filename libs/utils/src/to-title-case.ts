/**
 * Converts a string to Title Case where the first letter of every word is capitalized.
 *
 * @param words The words to return as Title Cased.
 * @returns The words with the first letter of every word capitalized.
 */
export default function toTitleCase(words: string): string {
  return words
    .split(' ')
    .map((word) => `${word[0].toUpperCase()}${word.substring(1, word.length + 1).toLowerCase()}`)
    .join(' ')
}
