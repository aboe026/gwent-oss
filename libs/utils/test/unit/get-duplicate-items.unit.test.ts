import getDuplicateItems from '../../src/get-duplicate-items'

describe('getDuplicateItems', () => {
  it('returns empty array if empty array provied', () => {
    expect(getDuplicateItems([])).toEqual([])
  })
  it('returns empty array if single undefined', () => {
    expect(getDuplicateItems([undefined])).toEqual([])
  })
  it('returns empty array if single null', () => {
    expect(getDuplicateItems([null])).toEqual([])
  })
  it('returns empty array if undefined and null', () => {
    expect(getDuplicateItems([undefined, null])).toEqual([])
  })
  it('returns empty array if multiple undefined', () => {
    expect(getDuplicateItems([undefined, undefined])).toEqual([])
  })
  it('returns empty array if multiple null', () => {
    expect(getDuplicateItems([null, null])).toEqual([])
  })
  it('returns empty array if multiple undefined and null', () => {
    expect(getDuplicateItems([undefined, undefined, null, null])).toEqual([])
  })
  describe('string', () => {
    it('returns empty array if single', () => {
      expect(getDuplicateItems(['a'])).toEqual([])
    })
    it('returns empty array if two different', () => {
      expect(getDuplicateItems(['a', 'b'])).toEqual([])
    })
    it('returns empty array if three different', () => {
      expect(getDuplicateItems(['a', 'b', 'c'])).toEqual([])
    })
    it('returns single item array if two same', () => {
      expect(getDuplicateItems(['a', 'a'])).toEqual(['a'])
    })
    it('returns single item array if three same', () => {
      expect(getDuplicateItems(['a', 'a', 'a'])).toEqual(['a'])
    })
    it('returns two item array if two doubles', () => {
      expect(getDuplicateItems(['a', 'a', 'b', 'b'])).toEqual(['a', 'b'])
    })
    it('returns double item array if two triples', () => {
      expect(getDuplicateItems(['a', 'a', 'a', 'b', 'b', 'b'])).toEqual(['a', 'b'])
    })
    it('returns three item array if three doubles', () => {
      expect(getDuplicateItems(['a', 'a', 'b', 'b', 'c', 'c'])).toEqual(['a', 'b', 'c'])
    })
    it('returns three item array if three triples', () => {
      expect(getDuplicateItems(['a', 'a', 'a', 'b', 'b', 'b', 'c', 'c', 'c'])).toEqual(['a', 'b', 'c'])
    })
  })
  describe('number', () => {
    it('returns empty array if single', () => {
      expect(getDuplicateItems([1])).toEqual([])
    })
    it('returns empty array if two different', () => {
      expect(getDuplicateItems([1, 2])).toEqual([])
    })
    it('returns empty array if three different', () => {
      expect(getDuplicateItems([1, 2, 3])).toEqual([])
    })
    it('returns single item array if two same', () => {
      expect(getDuplicateItems([1, 1])).toEqual([1])
    })
    it('returns single item array if three same', () => {
      expect(getDuplicateItems([1, 1, 1])).toEqual([1])
    })
    it('returns two item array if two doubles', () => {
      expect(getDuplicateItems([1, 1, 2, 2])).toEqual([1, 2])
    })
    it('returns double item array if two triples', () => {
      expect(getDuplicateItems([1, 1, 1, 2, 2, 2])).toEqual([1, 2])
    })
    it('returns three item array if three doubles', () => {
      expect(getDuplicateItems([1, 1, 2, 2, 3, 3])).toEqual([1, 2, 3])
    })
    it('returns three item array if three triples', () => {
      expect(getDuplicateItems([1, 1, 1, 2, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
    })
  })
})
