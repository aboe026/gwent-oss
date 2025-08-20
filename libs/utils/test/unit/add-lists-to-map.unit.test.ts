import addListsToMap from '../../src/add-lists-to-map'

describe('add-lists-to-map', () => {
  it('does nothing if both maps empty', () => {
    const baseMap = {}
    const newLists = {}

    addListsToMap({
      baseMap,
      newLists,
    })

    expect(baseMap).toEqual({})
  })
  it('does nothing if values empty', () => {
    const baseMap = {
      foo: [],
    }
    const newLists = {
      foo: [],
    }

    addListsToMap({
      baseMap,
      newLists,
    })

    expect(baseMap).toEqual({
      foo: [],
    })
  })
  it('does nothing if baseMap not empty but newLists is empty', () => {
    const baseMap = {
      foo: ['bar'],
    }
    const newLists = {}

    addListsToMap({
      baseMap,
      newLists,
    })

    expect(baseMap).toEqual({
      foo: ['bar'],
    })
  })
  it('creates new property on baseMap if empty and newLists has item', () => {
    const baseMap = {}
    const newLists = {
      foo: ['bar'],
    }

    addListsToMap({
      baseMap,
      newLists,
    })

    expect(baseMap).toEqual({
      foo: ['bar'],
    })
  })
  it('appends to existing property on baseMap if exists and newLists has item', () => {
    const baseMap = {
      foo: ['bar'],
    }
    const newLists = {
      foo: ['biz'],
    }

    addListsToMap({
      baseMap,
      newLists,
    })

    expect(baseMap).toEqual({
      foo: ['bar', 'biz'],
    })
  })
  it('adds multiple new properties to baseMap', () => {
    const baseMap = {}
    const newLists = {
      foo: ['bar'],
      hello: ['world'],
    }

    addListsToMap({
      baseMap,
      newLists,
    })

    expect(baseMap).toEqual({
      foo: ['bar'],
      hello: ['world'],
    })
  })
  it('adds multiple values to baseMap', () => {
    const baseMap = {
      foo: [],
    }
    const newLists = {
      foo: ['bar', 'biz'],
    }

    addListsToMap({
      baseMap,
      newLists,
    })

    expect(baseMap).toEqual({
      foo: ['bar', 'biz'],
    })
  })
})
