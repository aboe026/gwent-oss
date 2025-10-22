import getRandomNumber from './get-random-number'

/**
 * Selects a random item from an array.
 *
 * @param config The configuration used to get the random item.
 * @param config.items The array of items from which to choose one at random.
 * @returns A random item from within the array.
 */
export default function getRandomItem<T>({ items }: { items: T[] }): T {
  return items[
    getRandomNumber({
      min: 0,
      max: items.length - 1,
    })
  ]
}
