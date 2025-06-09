import getNestedProperty from './get-nested-property'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function groupBy<T extends any[]>({
  array,
  property,
  reverse,
}: {
  array: T
  property: string
  reverse?: boolean
}): T[] {
  const groupKeys: string[] = []
  for (const item of array) {
    const key = getNestedProperty({
      obj: item,
      nestedProperty: property,
    })
    if (!groupKeys.includes(key)) {
      groupKeys.push(key.toLowerCase())
    }
  }

  let sortedKeys = groupKeys.sort()
  if (reverse) {
    sortedKeys = sortedKeys.reverse()
  }

  const groups: T[] = []
  for (const item of array) {
    const key = getNestedProperty({
      obj: item,
      nestedProperty: property,
    }).toLowerCase()
    const index = sortedKeys.indexOf(key)
    if (!groups[index]) {
      groups[index] = [] as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    groups[index].push(item)
  }
  return groups
}
