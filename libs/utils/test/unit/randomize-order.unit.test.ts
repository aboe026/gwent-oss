import randomizeOrder from '../../src/randomize-order'

describe('randomizeOrder', () => {
  it('returns empty array if given empty array', () => {
    expect(randomizeOrder([])).toEqual([])
  })
  it('returns single item in single item array', () => {
    expect(randomizeOrder([1])).toEqual([1])
  })
  it('returns items in random order in 2 item array', () => {
    const result = randomizeOrder([1, 2])
    expect(result).toContain(1)
    expect(result).toContain(2)
    expect(result).toHaveLength(2)
  })
  it('returns items in random order in 3 item array', () => {
    const result = randomizeOrder([1, 2, 3])
    expect(result).toContain(1)
    expect(result).toContain(2)
    expect(result).toContain(3)
    expect(result).toHaveLength(3)
  })
  it('returns items in random order in 100 item array', () => {
    const input = [...Array(100).keys()]
    const result = randomizeOrder(input)
    for (const num of input) {
      expect(result).toContain(num)
    }
    expect(result).toHaveLength(100)
    expect(result).not.toEqual(input)
  })
})
