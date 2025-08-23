import groupBy from '../../src/group-by'

describe('groupBy', () => {
  it('returns empty array if given empty array', () => {
    expect(
      groupBy({
        array: [],
        property: '',
      })
    ).toEqual([])
  })
  it('returns single item if single item given without matching property', () => {
    expect(
      groupBy({
        array: [
          {
            foo: 'bar',
          },
        ],
        property: 'hello',
      })
    ).toEqual([
      [
        {
          foo: 'bar',
        },
      ],
    ])
  })
  it('returns single item if single item given with matching property', () => {
    expect(
      groupBy({
        array: [
          {
            foo: 'bar',
          },
        ],
        property: 'foo',
      })
    ).toEqual([
      [
        {
          foo: 'bar',
        },
      ],
    ])
  })
  it('returns multiple items in single array if have same property value', () => {
    expect(
      groupBy({
        array: [
          {
            foo: 'bar',
            biz: 'bazz',
          },
          {
            foo: 'bar',
            hello: 'world',
          },
        ],
        property: 'foo',
      })
    ).toEqual([
      [
        {
          foo: 'bar',
          biz: 'bazz',
        },
        {
          foo: 'bar',
          hello: 'world',
        },
      ],
    ])
  })
  it('returns multiple items in multiple arrays if have different property value with keys', () => {
    expect(
      groupBy({
        array: [
          {
            foo: 'bar',
            biz: 'bazz',
          },
          {
            foo: 'gazi',
            hello: 'world',
          },
        ],
        property: 'foo',
      })
    ).toEqual([
      [
        {
          foo: 'bar',
          biz: 'bazz',
        },
      ],
      [
        {
          foo: 'gazi',
          hello: 'world',
        },
      ],
    ])
  })
  it('returns multiple items in multiple arrays if have different property value without keys', () => {
    expect(
      groupBy({
        array: [
          {
            foo: 'bar',
            biz: 'bazz',
          },
          {
            hello: 'world',
          },
          {
            foo: 'gazi',
            hello: 'world',
          },
          {
            biz: 'bazz',
          },
        ],
        property: 'foo',
      })
    ).toEqual([
      [
        {
          foo: 'bar',
          biz: 'bazz',
        },
      ],
      [
        {
          foo: 'gazi',
          hello: 'world',
        },
      ],
      [
        {
          hello: 'world',
        },
        {
          biz: 'bazz',
        },
      ],
    ])
  })
  it('reverse has no effect if multiple items in single array that have same property value', () => {
    expect(
      groupBy({
        array: [
          {
            foo: 'bar',
            biz: 'bazz',
          },
          {
            foo: 'bar',
            hello: 'world',
          },
        ],
        property: 'foo',
        reverse: true,
      })
    ).toEqual([
      [
        {
          foo: 'bar',
          biz: 'bazz',
        },
        {
          foo: 'bar',
          hello: 'world',
        },
      ],
    ])
  })
  it('reverse effects multiple items in multiple arrays that have different property value', () => {
    expect(
      groupBy({
        array: [
          {
            foo: 'bar',
            biz: 'bazz',
          },
          {
            foo: 'gazi',
            hello: 'world',
          },
        ],
        property: 'foo',
        reverse: true,
      })
    ).toEqual([
      [
        {
          foo: 'gazi',
          hello: 'world',
        },
      ],
      [
        {
          foo: 'bar',
          biz: 'bazz',
        },
      ],
    ])
  })
})
