import addToCacheList from '../../src/util/add-to-cache-list'

describe('add-to-cache-list', () => {
  describe('addToCacheList', () => {
    it('returns empty array if previous and add undefined', () => {
      expect(addToCacheList({})).toEqual([])
    })
    it('returns existing item if previous exists and add undefined', () => {
      expect(
        addToCacheList({
          previous: [{ id: 'foo' }],
        })
      ).toEqual([{ id: 'foo' }])
    })
    it('returns added item if previous undefined and add defined', () => {
      expect(
        addToCacheList({
          add: { id: 'foo' },
        })
      ).toEqual([{ id: 'foo' }])
    })
    it('returns added items if previous and add defined', () => {
      expect(
        addToCacheList({
          previous: [{ id: 'foo' }],
          add: { id: 'bar' },
        })
      ).toEqual([{ id: 'foo' }, { id: 'bar' }])
    })
    it('returns single item if previous and add share same id', () => {
      expect(
        addToCacheList({
          previous: [{ id: 'foo' }],
          add: { id: 'foo' },
        })
      ).toEqual([{ id: 'foo' }])
    })
    it('returns multiple items if first previous and add share same id', () => {
      expect(
        addToCacheList({
          previous: [{ id: 'foo' }, { id: 'bar' }],
          add: { id: 'foo' },
        })
      ).toEqual([{ id: 'foo' }, { id: 'bar' }])
    })
    it('returns multiple items if last previous and add share same id', () => {
      expect(
        addToCacheList({
          previous: [{ id: 'foo' }, { id: 'bar' }],
          add: { id: 'bar' },
        })
      ).toEqual([{ id: 'foo' }, { id: 'bar' }])
    })
  })
})
