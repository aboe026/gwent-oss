export default function getRandomSubset<T>({ items, subsetSize }: { items: T[]; subsetSize: number }): T[] {
  const indexes = Array(items.length)
    .fill(0)
    .map((_, i) => i)
    .sort(() => Math.random() - 0.5)
    .slice(0, subsetSize)
  const subset: T[] = []
  for (const index of indexes) {
    subset.push(items[index])
  }
  return subset
}
