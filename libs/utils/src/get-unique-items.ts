// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function getUniqueItems<T>(items: any[]): T[] {
  const uniqueStrings: string[] = []
  const uniqueItems: T[] = []
  for (const item of items) {
    const resolvedItem = item !== undefined && item !== null ? item.toString() : item
    if (!uniqueStrings.includes(resolvedItem)) {
      uniqueStrings.push(resolvedItem)
      uniqueItems.push(item)
    }
  }
  return uniqueItems
}
