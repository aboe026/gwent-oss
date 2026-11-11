/**
 * Convert an array of strings to a punctuated string of the concatenated items.
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
