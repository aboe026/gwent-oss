/**
 * Adds items in newLists map to baseMap.
 *
 * @param config The configuration used to add newLists items to baseMap.
 * @param config.baseMap The map to have items added to its lists.
 * @param config.newLists A map containing lists of new items to add to the baseMap.
 */
export default function addListsToMap({ baseMap, newLists }: { baseMap: ListMap; newLists: ListMap }) {
  for (const key in newLists) {
    if (!baseMap[key]) {
      baseMap[key] = []
    }
    for (const item of newLists[key]) {
      baseMap[key].push(item)
    }
  }
}

export interface ListMap {
  [key: string]: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
}
