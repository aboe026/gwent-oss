import getRandomSubset from '../../src/get-random-subset'

describe('getRandomSubset', () => {
  it('returns empty array if given empty array', () => {
    expect(
      getRandomSubset({
        items: [],
        size: 1,
      })
    ).toEqual([])
  })
  it('returns only item if single item array and requesting 1', () => {
    expect(
      getRandomSubset({
        items: [1],
        size: 1,
      })
    ).toEqual([1])
  })
  it('returns only item if single item array and requesting 2', () => {
    expect(
      getRandomSubset({
        items: [1],
        size: 2,
      })
    ).toEqual([1])
  })
  it('returns all items if multi item array and request all items', () => {
    expect(
      getRandomSubset({
        items: [1, 2],
        size: 2,
      })
    ).toEqual(expect.arrayContaining([1, 2]))
  })
  it('returns random item in array if multi item array and request one item', () => {
    const response = getRandomSubset({
      items: [1, 2],
      size: 1,
    })
    expect([1, 2]).toEqual(expect.arrayContaining(response))
    expect(response).toHaveLength(1)
  })
  it('returns random item in array if multi item array and request two items', () => {
    const response = getRandomSubset({
      items: [1, 2, 3],
      size: 2,
    })
    expect([1, 2, 3]).toEqual(expect.arrayContaining(response))
    expect(response).toHaveLength(2)
  })
})
