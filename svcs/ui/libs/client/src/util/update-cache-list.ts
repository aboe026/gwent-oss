export default function updateCacheList<T>({ previous, add }: { previous?: T[]; add?: T }): T[] {
  const newItems = previous ? [...previous] : [] // cannot directly modify previous, need to create new object

  if (add) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentIds = newItems.map((item) => (item as any).id)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!currentIds.includes((add as any).id)) {
      newItems.push(add)
    }
  }

  return newItems
}
