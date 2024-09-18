/**
 * Return a list of items with duplicates and undefined/null items removed. Does not modify original array.
 *
 * @param items The array to get unique items of. Does not get modified by this method.
 * @returns An array with duplicates and undefined/null removed.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function getUniqueItems<T>(items: any[]): T[] {
  const uniqueStrings: string[] = []
  const uniqueItems: T[] = []
  for (const item of items) {
    if (item !== undefined && item !== null) {
      if (!uniqueStrings.includes(item.toString())) {
        uniqueStrings.push(item.toString())
        uniqueItems.push(item)
      }
    }
  }
  return uniqueItems
}
