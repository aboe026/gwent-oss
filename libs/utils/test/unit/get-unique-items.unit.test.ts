import getUniqueItems from '../../src/get-unique-items'

describe('getUniqueItems', () => {
  it('returns empty array if given empty array', () => {
    expect(getUniqueItems([])).toEqual([])
  })
  describe('string', () => {
    it('returns single item if single item array', () => {
      expect(getUniqueItems(['a'])).toEqual(['a'])
    })
    it('returns both items if multi item array without duplicates', () => {
      expect(getUniqueItems(['a', 'b'])).toEqual(['a', 'b'])
    })
    it('returns single item if multi item array with all duplicates', () => {
      expect(getUniqueItems(['a', 'a'])).toEqual(['a'])
    })
    it('returns multiple items if multi item array with some duplicates', () => {
      expect(getUniqueItems(['a', 'a', 'b', 'c', 'c'])).toEqual(['a', 'b', 'c'])
    })
    it('filters out undefined and null items', () => {
      expect(getUniqueItems(['a', null, 'a', 'b', 'c', undefined, 'c'])).toEqual(['a', 'b', 'c'])
    })
  })
  describe('number', () => {
    it('returns single item if single item array', () => {
      expect(getUniqueItems([1])).toEqual([1])
    })
    it('returns both items if multi item array without duplicates', () => {
      expect(getUniqueItems([1, 2])).toEqual([1, 2])
    })
    it('returns single item if multi item array with all duplicates', () => {
      expect(getUniqueItems([1, 1])).toEqual([1])
    })
    it('returns multiple items if multi item array with some duplicates', () => {
      expect(getUniqueItems([1, 1, 2, 3, 3])).toEqual([1, 2, 3])
    })
    it('filters out undefined and null items', () => {
      expect(getUniqueItems([1, null, 1, 2, 3, undefined, 3])).toEqual([1, 2, 3])
    })
  })
})
