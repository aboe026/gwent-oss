/**
 * Gets all items in list which have duplicates.
 *
 * @param items The items from which to extract duplicates.
 * @returns A unique list of duplicate items.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function getDuplicateItems<T>(items: any[]): T[] {
  const uniqueStrings: string[] = []
  const duplicateItemStrings: string[] = []
  const duplicateItems: T[] = []
  for (const item of items) {
    if (item !== undefined && item !== null) {
      if (uniqueStrings.includes(item.toString())) {
        if (!duplicateItemStrings.includes(item.toString())) {
          duplicateItemStrings.push(item.toString())
          duplicateItems.push(item)
        }
      } else {
        uniqueStrings.push(item.toString())
      }
    }
  }
  return duplicateItems
}
