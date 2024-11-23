/**
 * Returns an array of items in a random order. Does not modify original array.
 * @param items The items to randomize. Does not get modified.
 * @returns A new array containing the items in a randomized order.
 */
export default function randomizeOrder<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5)
}
