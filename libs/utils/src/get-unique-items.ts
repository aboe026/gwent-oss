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
