import sortObjectArray, { getNestedProperty, getSortOrder } from '../../src/sort'

describe('sort', () => {
  describe('sortObjectArray', () => {
    describe('empty', () => {
      it('returns empty array if no array', () => {
        expect(
          sortObjectArray({
            sortProperties: ['foo'],
          })
        ).toEqual([])
      })
      it('returns empty array if undefined', () => {
        expect(
          sortObjectArray({
            array: undefined,
            sortProperties: ['foo'],
          })
        ).toEqual([])
      })
      it('returns empty array if null', () => {
        expect(
          sortObjectArray({
            array: null,
            sortProperties: ['foo'],
          })
        ).toEqual([])
      })
      it('returns empty array if empty', () => {
        expect(
          sortObjectArray({
            array: [],
            sortProperties: ['foo'],
          })
        ).toEqual([])
      })
    })
    describe('non-reversed', () => {
      describe('numbers', () => {
        it('sorts when already in order', () => {
          const array = [
            {
              foo: 1,
            },
            {
              foo: 2,
            },
          ]

          expect(
            sortObjectArray({
              sortProperties: ['foo'],
              array,
            })
          ).toEqual([
            {
              foo: 1,
            },
            {
              foo: 2,
            },
          ])

          expect(array).toEqual([
            {
              foo: 1,
            },
            {
              foo: 2,
            },
          ])
        })
        it('sorts when out of order', () => {
          const array = [
            {
              foo: 2,
            },
            {
              foo: 1,
            },
          ]

          expect(
            sortObjectArray({
              sortProperties: ['foo'],
              array,
            })
          ).toEqual([
            {
              foo: 1,
            },
            {
              foo: 2,
            },
          ])

          expect(array).toEqual([
            {
              foo: 2,
            },
            {
              foo: 1,
            },
          ])
        })
        it('sorts when same with tie break on secondary property', () => {
          const array = [
            {
              foo: 2,
              bar: 2,
            },
            {
              foo: 2,
              bar: 1,
            },
          ]

          expect(
            sortObjectArray({
              sortProperties: ['foo', 'bar'],
              array,
            })
          ).toEqual([
            {
              foo: 2,
              bar: 1,
            },
            {
              foo: 2,
              bar: 2,
            },
          ])

          expect(array).toEqual([
            {
              foo: 2,
              bar: 2,
            },
            {
              foo: 2,
              bar: 1,
            },
          ])
        })
      })
      describe('string', () => {
        it('sorts when already in order', () => {
          const array = [
            {
              foo: 'a',
            },
            {
              foo: 'b',
            },
          ]

          expect(
            sortObjectArray({
              sortProperties: ['foo'],
              array,
            })
          ).toEqual([
            {
              foo: 'a',
            },
            {
              foo: 'b',
            },
          ])

          expect(array).toEqual([
            {
              foo: 'a',
            },
            {
              foo: 'b',
            },
          ])
        })
        it('sorts when out of order', () => {
          const array = [
            {
              foo: 'b',
            },
            {
              foo: 'a',
            },
          ]

          expect(
            sortObjectArray({
              sortProperties: ['foo'],
              array,
            })
          ).toEqual([
            {
              foo: 'a',
            },
            {
              foo: 'b',
            },
          ])

          expect(array).toEqual([
            {
              foo: 'b',
            },
            {
              foo: 'a',
            },
          ])
        })
        it('sorts when same with tie break on secondary property', () => {
          const array = [
            {
              foo: 'b',
              bar: 'b',
            },
            {
              foo: 'b',
              bar: 'a',
            },
          ]

          expect(
            sortObjectArray({
              sortProperties: ['foo', 'bar'],
              array,
            })
          ).toEqual([
            {
              foo: 'b',
              bar: 'a',
            },
            {
              foo: 'b',
              bar: 'b',
            },
          ])

          expect(array).toEqual([
            {
              foo: 'b',
              bar: 'b',
            },
            {
              foo: 'b',
              bar: 'a',
            },
          ])
        })
        it('sorts case insensitively', () => {
          const array = [
            {
              foo: 'B',
            },
            {
              foo: 'a',
            },
          ]

          expect(
            sortObjectArray({
              sortProperties: ['foo'],
              array,
            })
          ).toEqual([
            {
              foo: 'a',
            },
            {
              foo: 'B',
            },
          ])

          expect(array).toEqual([
            {
              foo: 'B',
            },
            {
              foo: 'a',
            },
          ])
        })
        it('sorts case insensitively on tie', () => {
          const array = [
            {
              foo: 'a',
              bar: 'B',
            },
            {
              foo: 'a',
              bar: 'a',
            },
          ]

          expect(
            sortObjectArray({
              sortProperties: ['foo', 'bar'],
              array,
            })
          ).toEqual([
            {
              foo: 'a',
              bar: 'a',
            },
            {
              foo: 'a',
              bar: 'B',
            },
          ])

          expect(array).toEqual([
            {
              foo: 'a',
              bar: 'B',
            },
            {
              foo: 'a',
              bar: 'a',
            },
          ])
        })
      })
    })
    describe('reversed', () => {
      describe('numbers', () => {
        it('sorts when already in order', () => {
          const array = [
            {
              foo: 2,
            },
            {
              foo: 1,
            },
          ]

          expect(
            sortObjectArray({
              sortProperties: ['foo'],
              array,
              reverse: true,
            })
          ).toEqual([
            {
              foo: 2,
            },
            {
              foo: 1,
            },
          ])

          expect(array).toEqual([
            {
              foo: 2,
            },
            {
              foo: 1,
            },
          ])
        })
        it('sorts when out of order', () => {
          const array = [
            {
              foo: 1,
            },
            {
              foo: 2,
            },
          ]

          expect(
            sortObjectArray({
              sortProperties: ['foo'],
              array,
              reverse: true,
            })
          ).toEqual([
            {
              foo: 2,
            },
            {
              foo: 1,
            },
          ])

          expect(array).toEqual([
            {
              foo: 1,
            },
            {
              foo: 2,
            },
          ])
        })
        it('sorts when same with tie break on secondary property', () => {
          const array = [
            {
              foo: 2,
              bar: 1,
            },
            {
              foo: 2,
              bar: 2,
            },
          ]

          expect(
            sortObjectArray({
              sortProperties: ['foo', 'bar'],
              array,
              reverse: true,
            })
          ).toEqual([
            {
              foo: 2,
              bar: 2,
            },
            {
              foo: 2,
              bar: 1,
            },
          ])

          expect(array).toEqual([
            {
              foo: 2,
              bar: 1,
            },
            {
              foo: 2,
              bar: 2,
            },
          ])
        })
      })
      describe('string', () => {
        it('sorts when already in order', () => {
          const array = [
            {
              foo: 'b',
            },
            {
              foo: 'a',
            },
          ]

          expect(
            sortObjectArray({
              sortProperties: ['foo'],
              array,
              reverse: true,
            })
          ).toEqual([
            {
              foo: 'b',
            },
            {
              foo: 'a',
            },
          ])

          expect(array).toEqual([
            {
              foo: 'b',
            },
            {
              foo: 'a',
            },
          ])
        })
        it('sorts when out of order', () => {
          const array = [
            {
              foo: 'a',
            },
            {
              foo: 'b',
            },
          ]

          expect(
            sortObjectArray({
              sortProperties: ['foo'],
              array,
              reverse: true,
            })
          ).toEqual([
            {
              foo: 'b',
            },
            {
              foo: 'a',
            },
          ])

          expect(array).toEqual([
            {
              foo: 'a',
            },
            {
              foo: 'b',
            },
          ])
        })
        it('sorts when same with tie break on secondary property', () => {
          const array = [
            {
              foo: 'b',
              bar: 'a',
            },
            {
              foo: 'b',
              bar: 'b',
            },
          ]

          expect(
            sortObjectArray({
              sortProperties: ['foo', 'bar'],
              array,
              reverse: true,
            })
          ).toEqual([
            {
              foo: 'b',
              bar: 'b',
            },
            {
              foo: 'b',
              bar: 'a',
            },
          ])

          expect(array).toEqual([
            {
              foo: 'b',
              bar: 'a',
            },
            {
              foo: 'b',
              bar: 'b',
            },
          ])
        })
        it('sorts case insensitively', () => {
          const array = [
            {
              foo: 'a',
            },
            {
              foo: 'B',
            },
          ]

          expect(
            sortObjectArray({
              sortProperties: ['foo'],
              array,
              reverse: true,
            })
          ).toEqual([
            {
              foo: 'B',
            },
            {
              foo: 'a',
            },
          ])

          expect(array).toEqual([
            {
              foo: 'a',
            },
            {
              foo: 'B',
            },
          ])
        })
        it('sorts case insensitively on tie', () => {
          const array = [
            {
              foo: 'a',
              bar: 'a',
            },
            {
              foo: 'a',
              bar: 'B',
            },
          ]

          expect(
            sortObjectArray({
              sortProperties: ['foo', 'bar'],
              array,
              reverse: true,
            })
          ).toEqual([
            {
              foo: 'a',
              bar: 'B',
            },
            {
              foo: 'a',
              bar: 'a',
            },
          ])

          expect(array).toEqual([
            {
              foo: 'a',
              bar: 'a',
            },
            {
              foo: 'a',
              bar: 'B',
            },
          ])
        })
      })
    })
  })
  describe('getNestedProperty', () => {
    it('returns undefined if undefined', () => {
      expect(
        getNestedProperty({
          nestedProperty: 'foo',
          obj: undefined,
        })
      ).toEqual(undefined)
    })
    it('returns undefined if property does not exist', () => {
      expect(
        getNestedProperty({
          nestedProperty: 'foo',
          obj: {},
        })
      ).toEqual(undefined)
    })
    it('returns root level property', () => {
      expect(
        getNestedProperty({
          nestedProperty: 'foo',
          obj: {
            foo: 'bar',
          },
        })
      ).toEqual('bar')
    })
    it('returns nested property', () => {
      expect(
        getNestedProperty({
          nestedProperty: 'foo.bar',
          obj: {
            foo: {
              bar: 1,
            },
          },
        })
      ).toEqual(1)
    })
    it('returns deeply nested property', () => {
      expect(
        getNestedProperty({
          nestedProperty: 'foo.bar.biz',
          obj: {
            foo: {
              bar: {
                biz: 1,
              },
            },
          },
        })
      ).toEqual(1)
    })
  })
  describe('getSortOrder', () => {
    it('returns 0 if values undefined', () => {
      expect(
        getSortOrder({
          firstComparator: undefined,
          secondComparator: undefined,
          propertyIndex: 0,
          sortProperties: [''],
        })
      ).toEqual(0)
    })
    it('returns 0 if values identical', () => {
      expect(
        getSortOrder({
          firstComparator: {
            foo: 1,
          },
          secondComparator: {
            foo: 1,
          },
          propertyIndex: 0,
          sortProperties: ['foo'],
        })
      ).toEqual(0)
    })
    describe('non-reverse', () => {
      it('returns -1 if first not defined but second is', () => {
        expect(
          getSortOrder({
            firstComparator: {},
            secondComparator: {
              foo: 1,
            },
            propertyIndex: 0,
            sortProperties: ['foo'],
          })
        ).toEqual(-1)
      })
      it('returns -1 if first value less than second value', () => {
        expect(
          getSortOrder({
            firstComparator: {
              foo: 1,
            },
            secondComparator: {
              foo: 2,
            },
            propertyIndex: 0,
            sortProperties: ['foo'],
          })
        ).toEqual(-1)
      })
      it('returns 1 if first defined but second value not', () => {
        expect(
          getSortOrder({
            firstComparator: {
              foo: 1,
            },
            secondComparator: {},
            propertyIndex: 0,
            sortProperties: ['foo'],
          })
        ).toEqual(1)
      })
      it('returns 1 if first value greater than second value', () => {
        expect(
          getSortOrder({
            firstComparator: {
              foo: 2,
            },
            secondComparator: {
              foo: 1,
            },
            propertyIndex: 0,
            sortProperties: ['foo'],
          })
        ).toEqual(1)
      })
      it('lowercases string values', () => {
        expect(
          getSortOrder({
            firstComparator: {
              foo: 'B',
            },
            secondComparator: {
              foo: 'a',
            },
            propertyIndex: 0,
            sortProperties: ['foo'],
          })
        ).toEqual(1)
      })
      it('recurses for nested properties', () => {
        expect(
          getSortOrder({
            firstComparator: {
              foo: 'a',
              bar: 'B',
            },
            secondComparator: {
              foo: 'a',
              bar: 'a',
            },
            propertyIndex: 0,
            sortProperties: ['foo', 'bar'],
          })
        ).toEqual(1)
      })
    })
    describe('reverse', () => {
      it('returns 1 if first not defined but second is', () => {
        expect(
          getSortOrder({
            firstComparator: {},
            secondComparator: {
              foo: 1,
            },
            propertyIndex: 0,
            sortProperties: ['foo'],
            reverse: true,
          })
        ).toEqual(1)
      })
      it('returns 1 if first value less than second value', () => {
        expect(
          getSortOrder({
            firstComparator: {
              foo: 1,
            },
            secondComparator: {
              foo: 2,
            },
            propertyIndex: 0,
            sortProperties: ['foo'],
            reverse: true,
          })
        ).toEqual(1)
      })
      it('returns -1 if first defined but second value not', () => {
        expect(
          getSortOrder({
            firstComparator: {
              foo: 1,
            },
            secondComparator: {},
            propertyIndex: 0,
            sortProperties: ['foo'],
            reverse: true,
          })
        ).toEqual(-1)
      })
      it('returns -1 if first value greater than second value', () => {
        expect(
          getSortOrder({
            firstComparator: {
              foo: 2,
            },
            secondComparator: {
              foo: 1,
            },
            propertyIndex: 0,
            sortProperties: ['foo'],
            reverse: true,
          })
        ).toEqual(-1)
      })
      it('lowercases string values', () => {
        expect(
          getSortOrder({
            firstComparator: {
              foo: 'B',
            },
            secondComparator: {
              foo: 'a',
            },
            propertyIndex: 0,
            sortProperties: ['foo'],
            reverse: true,
          })
        ).toEqual(-1)
      })
      it('recurses for nested properties', () => {
        expect(
          getSortOrder({
            firstComparator: {
              foo: 'a',
              bar: 'B',
            },
            secondComparator: {
              foo: 'a',
              bar: 'a',
            },
            propertyIndex: 0,
            sortProperties: ['foo', 'bar'],
            reverse: true,
          })
        ).toEqual(-1)
      })
    })
  })
})
