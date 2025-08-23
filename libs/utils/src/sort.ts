import getNestedProperty from './get-nested-property'

/**
 * Sorts an array of objects by the specified property.
 *
 * @param config The configuration used to sort the array.
 * @param config.array The Array to sort.
 * @param config.sortProperties The properties on each object to sort them by.
 * @param config.reverse Whether or not the array should be sorted in reverse order.
 * @returns A clone of the sorted array (does not modify original array).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function sortObjectArray<T extends any[]>({
  array,
  sortProperties,
  reverse = false,
}: {
  array?: T | null
  sortProperties: (string | string[])[]
  reverse?: boolean
}): T {
  if (!array) {
    return [] as any as T // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  const clonedArray = array.slice()
  return clonedArray.sort((a, b) =>
    getSortOrder({
      firstComparator: a,
      propertyIndex: 0,
      reverse,
      secondComparator: b,
      sortProperties,
    })
  ) as T
}

/**
 * Determines the order of two values relative to each other.
 *
 * @param options The options to get the sort oder.
 * @param options.firstComparator The first object to compare against the second.
 * @param options.propertyIndex The index of the nested property under consideration.
 * @param options.reverse Whether or not the sort order should be reversed.
 * @param options.secondComparator The second object to compare against the first.
 * @param options.sortProperties The array of properties to sort on.
 * @returns 1 if the first value is greater than the second, -1 if the second value is greater than the first, 0 if they are the same.
 */
export function getSortOrder({
  firstComparator,
  propertyIndex,
  reverse = false,
  secondComparator,
  sortProperties,
}: {
  sortProperties: (string | string[])[]
  propertyIndex: number
  reverse?: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  firstComparator: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  secondComparator: any
}): number {
  const sortProperty = sortProperties[propertyIndex]
  const keys = Array.isArray(sortProperty) ? sortProperty : [sortProperty]
  let firstValue
  let secondValue
  for (let i = 0; i < keys.length && firstValue === undefined; i++) {
    firstValue = getNestedProperty({
      nestedProperty: keys[i],
      obj: firstComparator,
    })
  }
  for (let i = 0; i < keys.length && secondValue === undefined; i++) {
    secondValue = getNestedProperty({
      nestedProperty: keys[i],
      obj: secondComparator,
    })
  }
  if (typeof firstValue === 'string') {
    firstValue = firstValue.toLowerCase()
  }
  if (typeof secondValue === 'string') {
    secondValue = secondValue.toLowerCase()
  }
  if (
    (firstValue !== undefined &&
      firstValue !== null &&
      secondValue !== undefined &&
      secondValue !== null &&
      firstValue < secondValue) ||
    ((firstValue === undefined || firstValue === null) && secondValue !== undefined && secondValue !== null)
  ) {
    return reverse ? 1 : -1
  } else if (
    (firstValue !== undefined &&
      firstValue !== null &&
      secondValue !== undefined &&
      secondValue !== null &&
      firstValue > secondValue) ||
    (firstValue !== undefined && firstValue !== null && (secondValue === undefined || secondValue === null))
  ) {
    return reverse ? -1 : 1
  }
  if (propertyIndex + 1 < sortProperties.length) {
    return getSortOrder({
      firstComparator,
      propertyIndex: propertyIndex + 1,
      reverse,
      secondComparator,
      sortProperties,
    })
  }
  return 0
}
