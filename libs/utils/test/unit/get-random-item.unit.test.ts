import getRandomItem from '../../src/get-random-item'
import * as getRandomNumber from '../../src/get-random-number'

describe('getRandomItem', () => {
  it('returns item with getRandomNumber index if empty', () => {
    testGetRandomItem({
      items: [],
    })
  })
  it('returns item with getRandomNumber index if single item', () => {
    testGetRandomItem({
      items: ['apple'],
    })
  })
  it('returns item with getRandomNumber index if single multiple', () => {
    testGetRandomItem({
      items: ['apple', 'banana'],
    })
  })
})

function testGetRandomItem({ items }: { items: any[] }) {
  const getRandomNumberSpy = jest.spyOn(getRandomNumber, 'default').mockReturnValue(0)

  expect(
    getRandomItem({
      items,
    })
  ).toEqual(items[0])

  expect(getRandomNumberSpy.mock.calls).toEqual([
    [
      {
        min: 0,
        max: items.length - 1,
      },
    ],
  ])
}
