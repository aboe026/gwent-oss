import getNestedProperty from './get-nested-property'

/**
 * Split an object array into groups based on the value of a specific property.
 *
 * @param config The configuration used to split the object array into groups.
 * @param config.array The array of objects to separate into groups.
 * @param config.property The name of the property to split groups into based on the value.
 * @param config.reverse Whether or not the resulting list of groups should be returned in reversed order.
 * @returns An array containing arrays of objects that share the same value for a specific property.
 */
export default function groupBy<T>({
  array,
  property,
  reverse,
}: {
  array: T[]
  property: string
  reverse?: boolean
}): T[][] {
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

  const groups: T[][] = []
  for (const item of array) {
    const key = getNestedProperty({
      obj: item,
      nestedProperty: property,
    }).toLowerCase()
    const index = sortedKeys.indexOf(key)
    if (!groups[index]) {
      groups[index] = []
    }
    groups[index].push(item)
  }
  return groups
}
