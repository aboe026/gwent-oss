import { ObjectId } from 'mongodb'
import deepClone from '../util/deep-clone'

describe('deep-clone', () => {
  it('clones string', () => {
    let item = 'test'
    expect(item).toEqual('test')

    const clone = deepClone(item)

    expect(clone).toEqual('test')
    expect(item).toEqual('test')

    item = 'changed'

    expect(clone).toEqual('test')
    expect(item).toEqual('changed')
  })
  it('clones ObjectId', () => {
    let item = new ObjectId('67b540faa8a4d0ce37a3b627')
    expect(item.equals('67b540faa8a4d0ce37a3b627')).toEqual(true)

    const clone = deepClone(item)

    expect(clone instanceof ObjectId).toEqual(true)
    expect(clone.equals('67b540faa8a4d0ce37a3b627')).toEqual(true)
    expect(item.equals('67b540faa8a4d0ce37a3b627')).toEqual(true)

    item = new ObjectId('67b540faa8a4d0ce37a3b628')

    expect(clone.equals('67b540faa8a4d0ce37a3b627')).toEqual(true)
    expect(item.equals('67b540faa8a4d0ce37a3b628')).toEqual(true)
  })
  it('clones Date', () => {
    let item = new Date('2025-02-27T21:41:59.428Z')
    expect(item.toISOString()).toEqual('2025-02-27T21:41:59.428Z')

    const clone = deepClone(item)

    expect(clone instanceof Date).toEqual(true)
    expect(clone.toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect(item.toISOString()).toEqual('2025-02-27T21:41:59.428Z')

    item = new Date('2026-02-27T21:41:59.428Z')

    expect(clone.toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect(item.toISOString()).toEqual('2026-02-27T21:41:59.428Z')
  })
  it('clones number', () => {
    let item = 1
    expect(item).toEqual(1)

    const clone = deepClone(item)

    expect(typeof clone === 'number').toEqual(true)
    expect(clone).toEqual(1)
    expect(item).toEqual(1)

    item = 2

    expect(clone).toEqual(1)
    expect(item).toEqual(2)
  })
  it('clones boolean true', () => {
    let item = true
    expect(item).toEqual(true)

    const clone = deepClone(item)

    expect(typeof clone === 'boolean').toEqual(true)
    expect(clone).toEqual(true)
    expect(item).toEqual(true)

    item = false

    expect(clone).toEqual(true)
    expect(item).toEqual(false)
  })
  it('clones boolean false', () => {
    let item = false
    expect(item).toEqual(false)

    const clone = deepClone(item)

    expect(typeof clone === 'boolean').toEqual(true)
    expect(clone).toEqual(false)
    expect(item).toEqual(false)

    item = true

    expect(clone).toEqual(false)
    expect(item).toEqual(true)
  })
  it('clones array', () => {
    const item = ['a', 1, true, false, new Date('2025-02-27T21:41:59.428Z'), new ObjectId('67b540faa8a4d0ce37a3b627')]
    expect(item[0]).toEqual('a')
    expect(item[1]).toEqual(1)
    expect(item[2]).toEqual(true)
    expect(item[3]).toEqual(false)
    expect((item[4] as Date).toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect((item[5] as ObjectId).equals('67b540faa8a4d0ce37a3b627')).toEqual(true)
    expect(item.length).toEqual(6)

    const clone = deepClone(item)

    expect(Array.isArray(clone)).toEqual(true)
    expect(clone[0]).toEqual('a')
    expect(clone[1]).toEqual(1)
    expect(clone[2]).toEqual(true)
    expect(clone[3]).toEqual(false)
    expect((clone[4] as Date).toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect((clone[5] as ObjectId).equals('67b540faa8a4d0ce37a3b627')).toEqual(true)
    expect(clone.length).toEqual(6)

    expect(item[0]).toEqual('a')
    expect(item[1]).toEqual(1)
    expect(item[2]).toEqual(true)
    expect(item[3]).toEqual(false)
    expect((item[4] as Date).toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect((item[5] as ObjectId).equals('67b540faa8a4d0ce37a3b627')).toEqual(true)
    expect(item.length).toEqual(6)

    item[0] = 'b'
    item[1] = 2
    item[2] = false
    item[3] = true
    item[4] = new Date('2026-02-27T21:41:59.428Z')
    item[5] = new ObjectId('67b540faa8a4d0ce37a3b628')

    expect(item[0]).toEqual('b')
    expect(item[1]).toEqual(2)
    expect(item[2]).toEqual(false)
    expect(item[3]).toEqual(true)
    expect((item[4] as Date).toISOString()).toEqual('2026-02-27T21:41:59.428Z')
    expect((item[5] as ObjectId).equals('67b540faa8a4d0ce37a3b628')).toEqual(true)
    expect(item.length).toEqual(6)
    expect(clone[0]).toEqual('a')
    expect(clone[1]).toEqual(1)
    expect(clone[2]).toEqual(true)
    expect(clone[3]).toEqual(false)
    expect((clone[4] as Date).toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect((clone[5] as ObjectId).equals('67b540faa8a4d0ce37a3b627')).toEqual(true)
    expect(clone.length).toEqual(6)
  })
  it('clones nested array', () => {
    const item = [
      ['a'],
      [1],
      [true],
      [false],
      [new Date('2025-02-27T21:41:59.428Z')],
      [new ObjectId('67b540faa8a4d0ce37a3b627')],
    ]

    expect(item[0][0]).toEqual('a')
    expect(item[1][0]).toEqual(1)
    expect(item[2][0]).toEqual(true)
    expect(item[3][0]).toEqual(false)
    expect((item[4][0] as Date).toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect((item[5][0] as ObjectId).equals('67b540faa8a4d0ce37a3b627')).toEqual(true)
    expect(item[0].length).toEqual(1)
    expect(item[1].length).toEqual(1)
    expect(item[2].length).toEqual(1)
    expect(item[3].length).toEqual(1)
    expect(item[4].length).toEqual(1)
    expect(item[5].length).toEqual(1)
    expect(item.length).toEqual(6)

    const clone = deepClone(item)

    expect(clone[0][0]).toEqual('a')
    expect(clone[1][0]).toEqual(1)
    expect(clone[2][0]).toEqual(true)
    expect(clone[3][0]).toEqual(false)
    expect((clone[4][0] as Date).toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect((clone[5][0] as ObjectId).equals('67b540faa8a4d0ce37a3b627')).toEqual(true)
    expect(clone[0].length).toEqual(1)
    expect(clone[1].length).toEqual(1)
    expect(clone[2].length).toEqual(1)
    expect(clone[3].length).toEqual(1)
    expect(clone[4].length).toEqual(1)
    expect(clone[5].length).toEqual(1)
    expect(clone.length).toEqual(6)

    expect(item[0][0]).toEqual('a')
    expect(item[1][0]).toEqual(1)
    expect(item[2][0]).toEqual(true)
    expect(item[3][0]).toEqual(false)
    expect((item[4][0] as Date).toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect((item[5][0] as ObjectId).equals('67b540faa8a4d0ce37a3b627')).toEqual(true)
    expect(item[0].length).toEqual(1)
    expect(item[1].length).toEqual(1)
    expect(item[2].length).toEqual(1)
    expect(item[3].length).toEqual(1)
    expect(item[4].length).toEqual(1)
    expect(item[5].length).toEqual(1)
    expect(item.length).toEqual(6)

    item[0][0] = 'b'
    item[1][0] = 2
    item[2][0] = false
    item[3][0] = true
    item[4][0] = new Date('2026-02-27T21:41:59.428Z')
    item[5][0] = new ObjectId('67b540faa8a4d0ce37a3b628')

    expect(clone[0][0]).toEqual('a')
    expect(clone[1][0]).toEqual(1)
    expect(clone[2][0]).toEqual(true)
    expect(clone[3][0]).toEqual(false)
    expect((clone[4][0] as Date).toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect((clone[5][0] as ObjectId).equals('67b540faa8a4d0ce37a3b627')).toEqual(true)
    expect(clone[0].length).toEqual(1)
    expect(clone[1].length).toEqual(1)
    expect(clone[2].length).toEqual(1)
    expect(clone[3].length).toEqual(1)
    expect(clone[4].length).toEqual(1)
    expect(clone[5].length).toEqual(1)
    expect(clone.length).toEqual(6)

    expect(item[0][0]).toEqual('b')
    expect(item[1][0]).toEqual(2)
    expect(item[2][0]).toEqual(false)
    expect(item[3][0]).toEqual(true)
    expect((item[4][0] as Date).toISOString()).toEqual('2026-02-27T21:41:59.428Z')
    expect((item[5][0] as ObjectId).equals('67b540faa8a4d0ce37a3b628')).toEqual(true)
    expect(item[0].length).toEqual(1)
    expect(item[1].length).toEqual(1)
    expect(item[2].length).toEqual(1)
    expect(item[3].length).toEqual(1)
    expect(item[4].length).toEqual(1)
    expect(item[5].length).toEqual(1)
    expect(item.length).toEqual(6)
  })
  it('clones object', () => {
    const item = {
      string: 'a',
      number: 1,
      true: true,
      false: false,
      date: new Date('2025-02-27T21:41:59.428Z'),
      id: new ObjectId('67b540faa8a4d0ce37a3b627'),
      array: ['b', 2, false, true, new Date('2026-02-27T21:41:59.428Z'), new ObjectId('67b540faa8a4d0ce37a3b628')],
    }

    expect(item.string).toEqual('a')
    expect(item.number).toEqual(1)
    expect(item.true).toEqual(true)
    expect(item.false).toEqual(false)
    expect(item.date.toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect(item.id.toString()).toEqual('67b540faa8a4d0ce37a3b627')
    expect(Array.isArray(item.array)).toEqual(true)
    expect(item.array[0]).toEqual('b')
    expect(item.array[1]).toEqual(2)
    expect(item.array[2]).toEqual(false)
    expect(item.array[3]).toEqual(true)
    expect((item.array[4] as Date).toISOString()).toEqual('2026-02-27T21:41:59.428Z')
    expect(item.array[5].toString()).toEqual('67b540faa8a4d0ce37a3b628')
    expect(item.array.length).toEqual(6)
    expect(Object.keys(item)).toEqual(['string', 'number', 'true', 'false', 'date', 'id', 'array'])

    const clone = deepClone(item)

    expect(clone.string).toEqual('a')
    expect(clone.number).toEqual(1)
    expect(clone.true).toEqual(true)
    expect(clone.false).toEqual(false)
    expect(clone.date.toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect(clone.id.toString()).toEqual('67b540faa8a4d0ce37a3b627')
    expect(Array.isArray(clone.array)).toEqual(true)
    expect(clone.array[0]).toEqual('b')
    expect(clone.array[1]).toEqual(2)
    expect(clone.array[2]).toEqual(false)
    expect(clone.array[3]).toEqual(true)
    expect((clone.array[4] as Date).toISOString()).toEqual('2026-02-27T21:41:59.428Z')
    expect(clone.array[5].toString()).toEqual('67b540faa8a4d0ce37a3b628')
    expect(clone.array.length).toEqual(6)
    expect(Object.keys(clone)).toEqual(['string', 'number', 'true', 'false', 'date', 'id', 'array'])

    expect(item.string).toEqual('a')
    expect(item.number).toEqual(1)
    expect(item.true).toEqual(true)
    expect(item.false).toEqual(false)
    expect(item.date.toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect(item.id.toString()).toEqual('67b540faa8a4d0ce37a3b627')
    expect(Array.isArray(item.array)).toEqual(true)
    expect(item.array[0]).toEqual('b')
    expect(item.array[1]).toEqual(2)
    expect(item.array[2]).toEqual(false)
    expect(item.array[3]).toEqual(true)
    expect((item.array[4] as Date).toISOString()).toEqual('2026-02-27T21:41:59.428Z')
    expect(item.array[5].toString()).toEqual('67b540faa8a4d0ce37a3b628')
    expect(item.array.length).toEqual(6)
    expect(Object.keys(item)).toEqual(['string', 'number', 'true', 'false', 'date', 'id', 'array'])

    item.string = 'c'
    item.number = 3
    item.true = false
    item.false = true
    item.date = new Date('2027-02-27T21:41:59.428Z')
    item.id = new ObjectId('67b540faa8a4d0ce37a3b629')
    item.array[0] = 'd'
    item.array[1] = 4
    item.array[2] = true
    item.array[3] = false
    item.array[4] = new Date('2028-02-27T21:41:59.428Z')
    item.array[5] = new ObjectId('67b540faa8a4d0ce37a3b620')

    expect(item.string).toEqual('c')
    expect(item.number).toEqual(3)
    expect(item.true).toEqual(false)
    expect(item.false).toEqual(true)
    expect(item.date.toISOString()).toEqual('2027-02-27T21:41:59.428Z')
    expect(item.id.toString()).toEqual('67b540faa8a4d0ce37a3b629')
    expect(Array.isArray(item.array)).toEqual(true)
    expect(item.array[0]).toEqual('d')
    expect(item.array[1]).toEqual(4)
    expect(item.array[2]).toEqual(true)
    expect(item.array[3]).toEqual(false)
    expect((item.array[4] as Date).toISOString()).toEqual('2028-02-27T21:41:59.428Z')
    expect(item.array[5].toString()).toEqual('67b540faa8a4d0ce37a3b620')
    expect(item.array.length).toEqual(6)
    expect(Object.keys(item)).toEqual(['string', 'number', 'true', 'false', 'date', 'id', 'array'])

    expect(clone.string).toEqual('a')
    expect(clone.number).toEqual(1)
    expect(clone.true).toEqual(true)
    expect(clone.false).toEqual(false)
    expect(clone.date.toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect(clone.id.toString()).toEqual('67b540faa8a4d0ce37a3b627')
    expect(Array.isArray(clone.array)).toEqual(true)
    expect(clone.array[0]).toEqual('b')
    expect(clone.array[1]).toEqual(2)
    expect(clone.array[2]).toEqual(false)
    expect(clone.array[3]).toEqual(true)
    expect((clone.array[4] as Date).toISOString()).toEqual('2026-02-27T21:41:59.428Z')
    expect(clone.array[5].toString()).toEqual('67b540faa8a4d0ce37a3b628')
    expect(clone.array.length).toEqual(6)
    expect(Object.keys(clone)).toEqual(['string', 'number', 'true', 'false', 'date', 'id', 'array'])
  })
  it('clones nested object', () => {
    const item = {
      string: 'a',
      number: 1,
      true: true,
      false: false,
      date: new Date('2025-02-27T21:41:59.428Z'),
      id: new ObjectId('67b540faa8a4d0ce37a3b627'),
      array: ['b', 2, false, true, new Date('2026-02-27T21:41:59.428Z'), new ObjectId('67b540faa8a4d0ce37a3b628')],
      nested: {
        string: 'c',
        number: 3,
        true: false,
        false: true,
        date: new Date('2027-02-27T21:41:59.428Z'),
        id: new ObjectId('67b540faa8a4d0ce37a3b629'),
        array: ['d', 4, true, false, new Date('2028-02-27T21:41:59.428Z'), new ObjectId('67b540faa8a4d0ce37a3b620')],
      },
    }

    expect(item.string).toEqual('a')
    expect(item.number).toEqual(1)
    expect(item.true).toEqual(true)
    expect(item.false).toEqual(false)
    expect(item.date.toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect(item.id.toString()).toEqual('67b540faa8a4d0ce37a3b627')
    expect(Array.isArray(item.array)).toEqual(true)
    expect(item.array[0]).toEqual('b')
    expect(item.array[1]).toEqual(2)
    expect(item.array[2]).toEqual(false)
    expect(item.array[3]).toEqual(true)
    expect((item.array[4] as Date).toISOString()).toEqual('2026-02-27T21:41:59.428Z')
    expect(item.array[5].toString()).toEqual('67b540faa8a4d0ce37a3b628')
    expect(item.array.length).toEqual(6)
    expect(item.nested.string).toEqual('c')
    expect(item.nested.number).toEqual(3)
    expect(item.nested.true).toEqual(false)
    expect(item.nested.false).toEqual(true)
    expect(item.nested.date.toISOString()).toEqual('2027-02-27T21:41:59.428Z')
    expect(item.nested.id.toString()).toEqual('67b540faa8a4d0ce37a3b629')
    expect(Array.isArray(item.nested.array))
    expect(item.nested.array[0]).toEqual('d')
    expect(item.nested.array[1]).toEqual(4)
    expect(item.nested.array[2]).toEqual(true)
    expect(item.nested.array[3]).toEqual(false)
    expect((item.nested.array[4] as Date).toISOString()).toEqual('2028-02-27T21:41:59.428Z')
    expect(item.nested.array[5].toString()).toEqual('67b540faa8a4d0ce37a3b620')
    expect(item.nested.array.length).toEqual(6)
    expect(Object.keys(item)).toEqual(['string', 'number', 'true', 'false', 'date', 'id', 'array', 'nested'])

    const clone = deepClone(item)

    expect(clone.string).toEqual('a')
    expect(clone.number).toEqual(1)
    expect(clone.true).toEqual(true)
    expect(clone.false).toEqual(false)
    expect(clone.date.toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect(clone.id.toString()).toEqual('67b540faa8a4d0ce37a3b627')
    expect(Array.isArray(clone.array)).toEqual(true)
    expect(clone.array[0]).toEqual('b')
    expect(clone.array[1]).toEqual(2)
    expect(clone.array[2]).toEqual(false)
    expect(clone.array[3]).toEqual(true)
    expect((clone.array[4] as Date).toISOString()).toEqual('2026-02-27T21:41:59.428Z')
    expect(clone.array[5].toString()).toEqual('67b540faa8a4d0ce37a3b628')
    expect(clone.array.length).toEqual(6)
    expect(clone.nested.string).toEqual('c')
    expect(clone.nested.number).toEqual(3)
    expect(clone.nested.true).toEqual(false)
    expect(clone.nested.false).toEqual(true)
    expect(clone.nested.date.toISOString()).toEqual('2027-02-27T21:41:59.428Z')
    expect(clone.nested.id.toString()).toEqual('67b540faa8a4d0ce37a3b629')
    expect(Array.isArray(clone.nested.array))
    expect(clone.nested.array[0]).toEqual('d')
    expect(clone.nested.array[1]).toEqual(4)
    expect(clone.nested.array[2]).toEqual(true)
    expect(clone.nested.array[3]).toEqual(false)
    expect((clone.nested.array[4] as Date).toISOString()).toEqual('2028-02-27T21:41:59.428Z')
    expect(clone.nested.array[5].toString()).toEqual('67b540faa8a4d0ce37a3b620')
    expect(clone.nested.array.length).toEqual(6)
    expect(Object.keys(clone)).toEqual(['string', 'number', 'true', 'false', 'date', 'id', 'array', 'nested'])

    expect(item.string).toEqual('a')
    expect(item.number).toEqual(1)
    expect(item.true).toEqual(true)
    expect(item.false).toEqual(false)
    expect(item.date.toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect(item.id.toString()).toEqual('67b540faa8a4d0ce37a3b627')
    expect(Array.isArray(item.array)).toEqual(true)
    expect(item.array[0]).toEqual('b')
    expect(item.array[1]).toEqual(2)
    expect(item.array[2]).toEqual(false)
    expect(item.array[3]).toEqual(true)
    expect((item.array[4] as Date).toISOString()).toEqual('2026-02-27T21:41:59.428Z')
    expect(item.array[5].toString()).toEqual('67b540faa8a4d0ce37a3b628')
    expect(item.array.length).toEqual(6)
    expect(item.nested.string).toEqual('c')
    expect(item.nested.number).toEqual(3)
    expect(item.nested.true).toEqual(false)
    expect(item.nested.false).toEqual(true)
    expect(item.nested.date.toISOString()).toEqual('2027-02-27T21:41:59.428Z')
    expect(item.nested.id.toString()).toEqual('67b540faa8a4d0ce37a3b629')
    expect(Array.isArray(item.nested.array))
    expect(item.nested.array[0]).toEqual('d')
    expect(item.nested.array[1]).toEqual(4)
    expect(item.nested.array[2]).toEqual(true)
    expect(item.nested.array[3]).toEqual(false)
    expect((item.nested.array[4] as Date).toISOString()).toEqual('2028-02-27T21:41:59.428Z')
    expect(item.nested.array[5].toString()).toEqual('67b540faa8a4d0ce37a3b620')
    expect(item.nested.array.length).toEqual(6)
    expect(Object.keys(item)).toEqual(['string', 'number', 'true', 'false', 'date', 'id', 'array', 'nested'])

    item.string = 'e'
    item.number = 5
    item.true = false
    item.false = true
    item.date = new Date('2029-02-27T21:41:59.428Z')
    item.id = new ObjectId('67b540faa8a4d0ce37a3b621')
    item.array[0] = 'f'
    item.array[1] = 6
    item.array[2] = false
    item.array[3] = true
    item.array[4] = new Date('2030-02-27T21:41:59.428Z')
    item.array[5] = new ObjectId('67b540faa8a4d0ce37a3b622')
    item.nested.string = 'g'
    item.nested.number = 7
    item.nested.true = false
    item.nested.false = true
    item.nested.date = new Date('2031-02-27T21:41:59.428Z')
    item.nested.id = new ObjectId('67b540faa8a4d0ce37a3b623')
    item.nested.array[0] = 'h'
    item.nested.array[1] = 8
    item.nested.array[2] = true
    item.nested.array[3] = false
    item.nested.array[4] = new Date('2032-02-27T21:41:59.428Z')
    item.nested.array[5] = new ObjectId('67b540faa8a4d0ce37a3b624')

    expect(clone.string).toEqual('a')
    expect(clone.number).toEqual(1)
    expect(clone.true).toEqual(true)
    expect(clone.false).toEqual(false)
    expect(clone.date.toISOString()).toEqual('2025-02-27T21:41:59.428Z')
    expect(clone.id.toString()).toEqual('67b540faa8a4d0ce37a3b627')
    expect(Array.isArray(clone.array)).toEqual(true)
    expect(clone.array[0]).toEqual('b')
    expect(clone.array[1]).toEqual(2)
    expect(clone.array[2]).toEqual(false)
    expect(clone.array[3]).toEqual(true)
    expect((clone.array[4] as Date).toISOString()).toEqual('2026-02-27T21:41:59.428Z')
    expect(clone.array[5].toString()).toEqual('67b540faa8a4d0ce37a3b628')
    expect(clone.array.length).toEqual(6)
    expect(clone.nested.string).toEqual('c')
    expect(clone.nested.number).toEqual(3)
    expect(clone.nested.true).toEqual(false)
    expect(clone.nested.false).toEqual(true)
    expect(clone.nested.date.toISOString()).toEqual('2027-02-27T21:41:59.428Z')
    expect(clone.nested.id.toString()).toEqual('67b540faa8a4d0ce37a3b629')
    expect(Array.isArray(clone.nested.array))
    expect(clone.nested.array[0]).toEqual('d')
    expect(clone.nested.array[1]).toEqual(4)
    expect(clone.nested.array[2]).toEqual(true)
    expect(clone.nested.array[3]).toEqual(false)
    expect((clone.nested.array[4] as Date).toISOString()).toEqual('2028-02-27T21:41:59.428Z')
    expect(clone.nested.array[5].toString()).toEqual('67b540faa8a4d0ce37a3b620')
    expect(clone.nested.array.length).toEqual(6)
    expect(Object.keys(clone)).toEqual(['string', 'number', 'true', 'false', 'date', 'id', 'array', 'nested'])

    expect(item.string).toEqual('e')
    expect(item.number).toEqual(5)
    expect(item.true).toEqual(false)
    expect(item.false).toEqual(true)
    expect(item.date.toISOString()).toEqual('2029-02-27T21:41:59.428Z')
    expect(item.id.toString()).toEqual('67b540faa8a4d0ce37a3b621')
    expect(Array.isArray(item.array)).toEqual(true)
    expect(item.array[0]).toEqual('f')
    expect(item.array[1]).toEqual(6)
    expect(item.array[2]).toEqual(false)
    expect(item.array[3]).toEqual(true)
    expect((item.array[4] as Date).toISOString()).toEqual('2030-02-27T21:41:59.428Z')
    expect(item.array[5].toString()).toEqual('67b540faa8a4d0ce37a3b622')
    expect(item.array.length).toEqual(6)
    expect(item.nested.string).toEqual('g')
    expect(item.nested.number).toEqual(7)
    expect(item.nested.true).toEqual(false)
    expect(item.nested.false).toEqual(true)
    expect(item.nested.date.toISOString()).toEqual('2031-02-27T21:41:59.428Z')
    expect(item.nested.id.toString()).toEqual('67b540faa8a4d0ce37a3b623')
    expect(Array.isArray(item.nested.array))
    expect(item.nested.array[0]).toEqual('h')
    expect(item.nested.array[1]).toEqual(8)
    expect(item.nested.array[2]).toEqual(true)
    expect(item.nested.array[3]).toEqual(false)
    expect((item.nested.array[4] as Date).toISOString()).toEqual('2032-02-27T21:41:59.428Z')
    expect(item.nested.array[5].toString()).toEqual('67b540faa8a4d0ce37a3b624')
    expect(item.nested.array.length).toEqual(6)
    expect(Object.keys(item)).toEqual(['string', 'number', 'true', 'false', 'date', 'id', 'array', 'nested'])
  })
})
