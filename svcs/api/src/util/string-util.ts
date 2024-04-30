/**
 * Converts a string to Title Case where the first letter of every word is capitalized.
 *
 * @param words The words to return as Title Cased.
 * @returns The words with the first letter of every word capitalized.
 */
export function toTitleCase(words: string): string {
  return words
    .split(' ')
    .map((word) => `${word[0].toUpperCase()}${word.substring(1, word.length + 1).toLowerCase()}`)
    .join(' ')
}

/**
 * Convert an array if strings to a punctuated string of the concatenated items.
 *
 * @param options The options for pretty printing.
 * @param options.items The items to pretty print.
 * @param options.labelPlural The label to use for items if there are more than 1.
 * @param options.labelSingular The label to use for items if there is only 1 of them.
 * @returns A punctuated string of the concatenated items.
 */
export function prettyPrintList({
  items,
  labelPlural,
  labelSingular,
}: {
  items: string[]
  labelSingular?: string
  labelPlural?: string
}): string {
  let itemWords: string = ''
  for (let i = 0; i < items.length; i++) {
    itemWords += items[i]
    if (items.length > 2 && i < items.length - 2) {
      itemWords += ', '
    } else if (items.length > 1 && i === items.length - 2) {
      itemWords += ' and '
    }
  }

  if (labelPlural && items.length > 1) {
    return `${itemWords} ${labelPlural}`
  } else if (labelSingular && items.length === 1) {
    return `${itemWords} ${labelSingular}`
  }
  return itemWords
}
