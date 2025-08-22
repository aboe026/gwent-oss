import getNestedProperty from '../../src/get-nested-property'

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
  it('returns undefined if parent in chain does not exist', () => {
    expect(
      getNestedProperty({
        nestedProperty: 'foo.bar',
        obj: {},
      })
    ).toEqual(undefined)
  })
  it('returns undefined if parent in chain is undefined', () => {
    expect(
      getNestedProperty({
        nestedProperty: 'foo.bar.baz',
        obj: {
          foo: undefined,
        },
      })
    ).toEqual(undefined)
  })
  it('returns undefined if parent in chain is null', () => {
    expect(
      getNestedProperty({
        nestedProperty: 'foo.bar.baz',
        obj: {
          foo: null,
        },
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
