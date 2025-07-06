/**
 * Get a random subset of items in an array.
 *
 * @param config The configuration of the operation to run.
 * @param config.items The items to get the subset of.
 * @param config.size The number of random items in the list to return.
 * @returns The specified number of random items from the list provided.
 */
export default function getRandomSubset<T>({ items, size }: { items: T[]; size: number }): T[] {
  const indexes = Array(items.length)
    .fill(0)
    .map((_, i) => i)
    .sort(() => Math.random() - 0.5)
    .slice(0, size)
  const subset: T[] = []
  for (const index of indexes) {
    subset.push(items[index])
  }
  return subset
}
