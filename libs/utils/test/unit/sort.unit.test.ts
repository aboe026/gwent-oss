import sortObjectArray, { getSortOrder } from '../../src/sort'

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
        describe('single property', () => {
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
        describe('multi property', () => {
          it('sorts when already in order', () => {
            const array = [
              {
                bar: 1,
              },
              {
                foo: 2,
              },
            ]

            expect(
              sortObjectArray({
                sortProperties: [['foo', 'bar']],
                array,
              })
            ).toEqual([
              {
                bar: 1,
              },
              {
                foo: 2,
              },
            ])

            expect(array).toEqual([
              {
                bar: 1,
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
                bar: 1,
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
                bar: 1,
              },
            ])
          })
          it('sorts when same with tie break on secondary property', () => {
            const array = [
              {
                foo: 2,
                bizz: 2,
              },
              {
                foo: 2,
                bar: 1,
              },
            ]

            expect(
              sortObjectArray({
                sortProperties: ['foo', ['bar', 'bizz']],
                array,
              })
            ).toEqual([
              {
                foo: 2,
                bar: 1,
              },
              {
                foo: 2,
                bizz: 2,
              },
            ])

            expect(array).toEqual([
              {
                foo: 2,
                bizz: 2,
              },
              {
                foo: 2,
                bar: 1,
              },
            ])
          })
        })
      })
      describe('string', () => {
        describe('single property', () => {
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
        describe('multi property', () => {
          it('sorts when already in order', () => {
            const array = [
              {
                bar: 'a',
              },
              {
                foo: 'b',
              },
            ]

            expect(
              sortObjectArray({
                sortProperties: [['foo', 'bar']],
                array,
              })
            ).toEqual([
              {
                bar: 'a',
              },
              {
                foo: 'b',
              },
            ])

            expect(array).toEqual([
              {
                bar: 'a',
              },
              {
                foo: 'b',
              },
            ])
          })
          it('sorts when out of order', () => {
            const array = [
              {
                bar: 'b',
              },
              {
                foo: 'a',
              },
            ]

            expect(
              sortObjectArray({
                sortProperties: [['foo', 'bar']],
                array,
              })
            ).toEqual([
              {
                foo: 'a',
              },
              {
                bar: 'b',
              },
            ])

            expect(array).toEqual([
              {
                bar: 'b',
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
                bizz: 'a',
              },
            ]

            expect(
              sortObjectArray({
                sortProperties: ['foo', ['bar', 'bizz']],
                array,
              })
            ).toEqual([
              {
                foo: 'b',
                bizz: 'a',
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
                bizz: 'a',
              },
            ])
          })
          it('sorts case insensitively', () => {
            const array = [
              {
                foo: 'B',
              },
              {
                bar: 'a',
              },
            ]

            expect(
              sortObjectArray({
                sortProperties: [['foo', 'bar']],
                array,
              })
            ).toEqual([
              {
                bar: 'a',
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
                bar: 'a',
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
                bizz: 'a',
              },
            ]

            expect(
              sortObjectArray({
                sortProperties: ['foo', ['bar', 'bizz']],
                array,
              })
            ).toEqual([
              {
                foo: 'a',
                bizz: 'a',
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
                bizz: 'a',
              },
            ])
          })
        })
      })
    })
    describe('reversed', () => {
      describe('numbers', () => {
        describe('single property', () => {
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
        describe('multi property', () => {
          it('sorts when already in order', () => {
            const array = [
              {
                foo: 2,
              },
              {
                bar: 1,
              },
            ]

            expect(
              sortObjectArray({
                sortProperties: [['foo', 'bar']],
                array,
                reverse: true,
              })
            ).toEqual([
              {
                foo: 2,
              },
              {
                bar: 1,
              },
            ])

            expect(array).toEqual([
              {
                foo: 2,
              },
              {
                bar: 1,
              },
            ])
          })
          it('sorts when out of order', () => {
            const array = [
              {
                bar: 1,
              },
              {
                foo: 2,
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
              },
              {
                bar: 1,
              },
            ])

            expect(array).toEqual([
              {
                bar: 1,
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
                bizz: 2,
              },
            ]

            expect(
              sortObjectArray({
                sortProperties: ['foo', ['bar', 'bizz']],
                array,
                reverse: true,
              })
            ).toEqual([
              {
                foo: 2,
                bizz: 2,
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
                bizz: 2,
              },
            ])
          })
        })
      })
      describe('string', () => {
        describe('single property', () => {
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
        describe('multi property', () => {
          it('sorts when already in order', () => {
            const array = [
              {
                foo: 'b',
              },
              {
                bar: 'a',
              },
            ]

            expect(
              sortObjectArray({
                sortProperties: [['foo', 'bar']],
                array,
                reverse: true,
              })
            ).toEqual([
              {
                foo: 'b',
              },
              {
                bar: 'a',
              },
            ])

            expect(array).toEqual([
              {
                foo: 'b',
              },
              {
                bar: 'a',
              },
            ])
          })
          it('sorts when out of order', () => {
            const array = [
              {
                foo: 'a',
              },
              {
                bar: 'b',
              },
            ]

            expect(
              sortObjectArray({
                sortProperties: [['foo', 'bar']],
                array,
                reverse: true,
              })
            ).toEqual([
              {
                bar: 'b',
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
                bar: 'b',
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
                bizz: 'b',
              },
            ]

            expect(
              sortObjectArray({
                sortProperties: ['foo', ['bar', 'bizz']],
                array,
                reverse: true,
              })
            ).toEqual([
              {
                foo: 'b',
                bizz: 'b',
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
                bizz: 'b',
              },
            ])
          })
          it('sorts case insensitively', () => {
            const array = [
              {
                foo: 'a',
              },
              {
                bar: 'B',
              },
            ]

            expect(
              sortObjectArray({
                sortProperties: [['foo', 'bar']],
                array,
                reverse: true,
              })
            ).toEqual([
              {
                bar: 'B',
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
                bar: 'B',
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
                bizz: 'B',
              },
            ]

            expect(
              sortObjectArray({
                sortProperties: ['foo', ['bar', 'bizz']],
                array,
                reverse: true,
              })
            ).toEqual([
              {
                foo: 'a',
                bizz: 'B',
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
                bizz: 'B',
              },
            ])
          })
        })
      })
    })
  })
  describe('getSortOrder', () => {
    describe('undefined', () => {
      it('returns 0 if values undefined with single sort property', () => {
        expect(
          getSortOrder({
            firstComparator: undefined,
            secondComparator: undefined,
            propertyIndex: 0,
            sortProperties: ['foo'],
          })
        ).toEqual(0)
      })
      it('returns 0 if values undefined with multi sort property', () => {
        expect(
          getSortOrder({
            firstComparator: undefined,
            secondComparator: undefined,
            propertyIndex: 0,
            sortProperties: [['foo', 'bar']],
          })
        ).toEqual(0)
      })
    })
    describe('identical', () => {
      it('returns 0 if values identical with single sort property', () => {
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
      it('returns 0 if values identical with multiple sort properties', () => {
        expect(
          getSortOrder({
            firstComparator: {
              foo: 1,
              bar: 2,
            },
            secondComparator: {
              foo: 1,
              bar: 2,
            },
            propertyIndex: 0,
            sortProperties: ['foo', 'bar'],
          })
        ).toEqual(0)
      })
      it('returns 0 if values identical with multi sort property both have first', () => {
        expect(
          getSortOrder({
            firstComparator: {
              foo: 1,
            },
            secondComparator: {
              foo: 1,
            },
            propertyIndex: 0,
            sortProperties: [['foo', 'bar']],
          })
        ).toEqual(0)
      })
      it('returns 0 if values identical with multi sort property both have second', () => {
        expect(
          getSortOrder({
            firstComparator: {
              bar: 1,
            },
            secondComparator: {
              bar: 1,
            },
            propertyIndex: 0,
            sortProperties: [['foo', 'bar']],
          })
        ).toEqual(0)
      })
      it('returns 0 if values identical with multi sort property both have first and second', () => {
        expect(
          getSortOrder({
            firstComparator: {
              foo: 1,
              bar: 1,
            },
            secondComparator: {
              foo: 1,
              bar: 1,
            },
            propertyIndex: 0,
            sortProperties: [['foo', 'bar']],
          })
        ).toEqual(0)
      })
    })
    describe('non-reverse', () => {
      describe('single sort property', () => {
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
        it('falls back to second property if both same', () => {
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
        it('recurses for nested properties', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: {
                  bar: 'b',
                },
              },
              secondComparator: {
                foo: {
                  bar: 'a',
                },
              },
              propertyIndex: 0,
              sortProperties: ['foo.bar'],
            })
          ).toEqual(1)
        })
      })
      describe('multi sort property', () => {
        it('returns -1 if first not defined but second is', () => {
          expect(
            getSortOrder({
              firstComparator: {},
              secondComparator: {
                foo: 1,
                bar: 2,
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
            })
          ).toEqual(-1)
        })
        it('returns -1 if first value less than second value without first', () => {
          expect(
            getSortOrder({
              firstComparator: {
                bar: 2,
              },
              secondComparator: {
                foo: 3,
                bar: 1,
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
            })
          ).toEqual(-1)
        })
        it('returns -1 if first value less than second value without second', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 1,
                bar: 2,
              },
              secondComparator: {
                bar: 3,
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
            })
          ).toEqual(-1)
        })
        it('returns 1 if and first defined but second value not', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 1,
                bar: 2,
              },
              secondComparator: {},
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
            })
          ).toEqual(1)
        })
        it('returns 1 if first value greater than second value without first', () => {
          expect(
            getSortOrder({
              firstComparator: {
                bar: 2,
              },
              secondComparator: {
                foo: 1,
                bar: 3,
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
            })
          ).toEqual(1)
        })
        it('returns 1 if first value greater than second value without second', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 3,
                bar: 1,
              },
              secondComparator: {
                bar: 2,
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
            })
          ).toEqual(1)
        })
        it('lowercases string values first defined', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 'B',
              },
              secondComparator: {
                foo: 'a',
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
            })
          ).toEqual(1)
        })
        it('lowercases string values second defined', () => {
          expect(
            getSortOrder({
              firstComparator: {
                bar: 'B',
              },
              secondComparator: {
                bar: 'a',
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
            })
          ).toEqual(1)
        })
        it('lowercases string values first defined first', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 'B',
              },
              secondComparator: {
                bar: 'a',
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
            })
          ).toEqual(1)
        })
        it('lowercases string values first defined second', () => {
          expect(
            getSortOrder({
              firstComparator: {
                bar: 'B',
              },
              secondComparator: {
                foo: 'a',
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
            })
          ).toEqual(1)
        })
        it('falls back to second property undefined neither', () => {
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
              sortProperties: ['foo', ['bar', 'bizz']],
            })
          ).toEqual(1)
        })
        it('falls back to second property undefined both', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 'a',
                bizz: 'B',
              },
              secondComparator: {
                foo: 'a',
                bizz: 'a',
              },
              propertyIndex: 0,
              sortProperties: ['foo', ['bar', 'bizz']],
            })
          ).toEqual(1)
        })
        it('falls back to second property undefined first', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 'a',
                bizz: 'B',
              },
              secondComparator: {
                foo: 'a',
                bar: 'a',
              },
              propertyIndex: 0,
              sortProperties: ['foo', ['bar', 'bizz']],
            })
          ).toEqual(1)
        })
        it('falls back to second property undefined second', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 'a',
                bar: 'B',
              },
              secondComparator: {
                foo: 'a',
                bizz: 'a',
              },
              propertyIndex: 0,
              sortProperties: ['foo', ['bar', 'bizz']],
            })
          ).toEqual(1)
        })
        it('recurses for nested properties undefined neither', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: {
                  bar: 'b',
                },
              },
              secondComparator: {
                foo: {
                  bar: 'a',
                },
              },
              propertyIndex: 0,
              sortProperties: [['foo.bar', 'fizz.buzz']],
            })
          ).toEqual(1)
        })
        it('recurses for nested properties undefined both', () => {
          expect(
            getSortOrder({
              firstComparator: {
                fizz: {
                  buzz: 'b',
                },
              },
              secondComparator: {
                fizz: {
                  buzz: 'a',
                },
              },
              propertyIndex: 0,
              sortProperties: [['foo.bar', 'fizz.buzz']],
            })
          ).toEqual(1)
        })
        it('recurses for nested properties undefined first', () => {
          expect(
            getSortOrder({
              firstComparator: {
                fizz: {
                  buzz: 'b',
                },
              },
              secondComparator: {
                foo: {
                  bar: 'a',
                },
              },
              propertyIndex: 0,
              sortProperties: [['foo.bar', 'fizz.buzz']],
            })
          ).toEqual(1)
        })
        it('recurses for nested properties undefined second', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: {
                  bar: 'b',
                },
              },
              secondComparator: {
                fizz: {
                  buzz: 'a',
                },
              },
              propertyIndex: 0,
              sortProperties: [['foo.bar', 'fizz.buzz']],
            })
          ).toEqual(1)
        })
      })
    })
    describe('reverse', () => {
      describe('single sort property', () => {
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
        it('falls back to second property if both same', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 'a',
                bar: 'a',
              },
              secondComparator: {
                foo: 'a',
                bar: 'B',
              },
              propertyIndex: 0,
              sortProperties: ['foo', 'bar'],
            })
          ).toEqual(-1)
        })
        it('recurses for nested properties', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: {
                  bar: 'a',
                },
              },
              secondComparator: {
                foo: {
                  bar: 'b',
                },
              },
              propertyIndex: 0,
              sortProperties: ['foo.bar'],
            })
          ).toEqual(-1)
        })
      })
      describe('multi sort property', () => {
        it('returns 1 if first not defined but second is', () => {
          expect(
            getSortOrder({
              firstComparator: {},
              secondComparator: {
                foo: 1,
                bar: 2,
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
              reverse: true,
            })
          ).toEqual(1)
        })
        it('returns 1 if first value less than second value without first', () => {
          expect(
            getSortOrder({
              firstComparator: {
                bar: 2,
              },
              secondComparator: {
                foo: 3,
                bar: 1,
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
              reverse: true,
            })
          ).toEqual(1)
        })
        it('returns 1 if first value less than second value without second', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 1,
                bar: 2,
              },
              secondComparator: {
                bar: 3,
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
              reverse: true,
            })
          ).toEqual(1)
        })
        it('returns -1 if and first defined but second value not', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 1,
                bar: 2,
              },
              secondComparator: {},
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
              reverse: true,
            })
          ).toEqual(-1)
        })
        it('returns -1 if first value greater than second value without first', () => {
          expect(
            getSortOrder({
              firstComparator: {
                bar: 2,
              },
              secondComparator: {
                foo: 1,
                bar: 3,
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
              reverse: true,
            })
          ).toEqual(-1)
        })
        it('returns -1 if first value greater than second value without second', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 3,
                bar: 1,
              },
              secondComparator: {
                bar: 2,
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
              reverse: true,
            })
          ).toEqual(-1)
        })
        it('lowercases string values first defined', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 'a',
              },
              secondComparator: {
                foo: 'B',
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
            })
          ).toEqual(-1)
        })
        it('lowercases string values second defined', () => {
          expect(
            getSortOrder({
              firstComparator: {
                bar: 'a',
              },
              secondComparator: {
                bar: 'B',
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
            })
          ).toEqual(-1)
        })
        it('lowercases string values first defined first', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 'a',
              },
              secondComparator: {
                bar: 'B',
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
            })
          ).toEqual(-1)
        })
        it('lowercases string values first defined second', () => {
          expect(
            getSortOrder({
              firstComparator: {
                bar: 'a',
              },
              secondComparator: {
                foo: 'B',
              },
              propertyIndex: 0,
              sortProperties: [['foo', 'bar']],
            })
          ).toEqual(-1)
        })
        it('falls back to second property undefined neither', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 'a',
                bar: 'a',
              },
              secondComparator: {
                foo: 'a',
                bar: 'B',
              },
              propertyIndex: 0,
              sortProperties: ['foo', ['bar', 'bizz']],
            })
          ).toEqual(-1)
        })
        it('falls back to second property undefined both', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 'a',
                bizz: 'a',
              },
              secondComparator: {
                foo: 'a',
                bizz: 'B',
              },
              propertyIndex: 0,
              sortProperties: ['foo', ['bar', 'bizz']],
            })
          ).toEqual(-1)
        })
        it('falls back to second property undefined first', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 'a',
                bizz: 'a',
              },
              secondComparator: {
                foo: 'a',
                bar: 'B',
              },
              propertyIndex: 0,
              sortProperties: ['foo', ['bar', 'bizz']],
            })
          ).toEqual(-1)
        })
        it('falls back to second property undefined second', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: 'a',
                bar: 'a',
              },
              secondComparator: {
                foo: 'a',
                bizz: 'B',
              },
              propertyIndex: 0,
              sortProperties: ['foo', ['bar', 'bizz']],
            })
          ).toEqual(-1)
        })
        it('recurses for nested properties undefined neither', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: {
                  bar: 'a',
                },
              },
              secondComparator: {
                foo: {
                  bar: 'b',
                },
              },
              propertyIndex: 0,
              sortProperties: [['foo.bar', 'fizz.buzz']],
            })
          ).toEqual(-1)
        })
        it('recurses for nested properties undefined both', () => {
          expect(
            getSortOrder({
              firstComparator: {
                fizz: {
                  buzz: 'a',
                },
              },
              secondComparator: {
                fizz: {
                  buzz: 'b',
                },
              },
              propertyIndex: 0,
              sortProperties: [['foo.bar', 'fizz.buzz']],
            })
          ).toEqual(-1)
        })
        it('recurses for nested properties undefined first', () => {
          expect(
            getSortOrder({
              firstComparator: {
                fizz: {
                  buzz: 'a',
                },
              },
              secondComparator: {
                foo: {
                  bar: 'b',
                },
              },
              propertyIndex: 0,
              sortProperties: [['foo.bar', 'fizz.buzz']],
            })
          ).toEqual(-1)
        })
        it('recurses for nested properties undefined second', () => {
          expect(
            getSortOrder({
              firstComparator: {
                foo: {
                  bar: 'a',
                },
              },
              secondComparator: {
                fizz: {
                  buzz: 'b',
                },
              },
              propertyIndex: 0,
              sortProperties: [['foo.bar', 'fizz.buzz']],
            })
          ).toEqual(-1)
        })
      })
    })
  })
})
