import getRandomNumber from './get-random-number'

export default function getRandomItem<T>({ items }: { items: T[] }): T {
  return items[
    getRandomNumber({
      min: 0,
      max: items.length - 1,
    })
  ]
}
