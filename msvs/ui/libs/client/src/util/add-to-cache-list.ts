/**
 * Adds an item to a list of cached items. Does not modify existing data.
 *
 * @param config The configuration of the list and item to add.
 * @param config.previous The currently cached list of items to add to.
 * @param config.add The item to add to the cached list.
 * @returns A new list concatenating the previous list and new item, which the cache can be set to.
 */
export default function addToCacheList<T extends { id: string }>({ previous, add }: { previous?: T[]; add?: T }): T[] {
  const newItems = previous ? [...previous] : [] // cannot directly modify previous, need to create new object

  if (add) {
    const currentIds = newItems.map((item) => item.id)
    if (!currentIds.includes(add.id)) {
      newItems.push(add)
    }
  }

  return newItems
}
