import { ObjectId } from 'mongodb'

export default function deepClone<T>(item: T): T {
  let newItem: any
  if (item instanceof ObjectId) {
    newItem = new ObjectId(item)
  } else if (item instanceof Date) {
    newItem = new Date(item)
  } else if (Array.isArray(item)) {
    newItem = []
    for (const arrayItem of item) {
      newItem.push(deepClone(arrayItem))
    }
  } else if (typeof item === 'object') {
    newItem = {}
    const itemObj = item as object
    for (const key of Object.keys(itemObj)) {
      newItem[key] = deepClone((itemObj as any)[key])
    }
  } else if (typeof item === 'number') {
    newItem = Number(item)
  } else if (typeof item === 'string') {
    newItem = item.toString()
  } else if (typeof item === 'boolean') {
    newItem = Boolean(item)
  }
  return newItem as T
}
