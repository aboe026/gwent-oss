import { Logger } from 'log4js'
import Verifier from '../../src/util/verify-objects'
import { ObjectId } from 'mongodb'

describe('verifier', () => {
  describe('checkObjects', () => {
    it('throws error if getMissingKeys is non empty', () => {
      const id = new ObjectId()
      testVerifiyObjects({
        expectedKeys: [id],
        objects: [],
        field: '_id',
        resourceLabelPlural: 'units',
        getMissingKeysResponse: [id.toString()],
        error: `Could not find units "${JSON.stringify([id])}" to resolve.`,
      })
    })
    it('throws error if getExtraKeys is non empty', () => {
      const id = new ObjectId()
      testVerifiyObjects({
        expectedKeys: [],
        objects: [{ _id: id }],
        field: '_id',
        resourceLabelPlural: 'units',
        getExtraKeysResponse: [id.toString()],
        error: `More units resolved "${JSON.stringify([id])}" than requested "[]".`,
      })
    })
    it('returns undefined if no extra or missing keys', () => {
      const id = new ObjectId()
      testVerifiyObjects({
        expectedKeys: [id],
        objects: [{ _id: id }],
        field: '_id',
        resourceLabelPlural: 'units',
      })
    })
  })
  describe('getMissingKeys', () => {
    it('returns empty array if empty expected and objects', () => {
      expect(
        Verifier['getMissingKeys']({
          expectedKeys: [],
          objects: [],
          field: 'foo',
        })
      ).toEqual([])
    })
    it('returns empty array if empty expected', () => {
      expect(
        Verifier['getMissingKeys']({
          expectedKeys: [],
          objects: [{ foo: 'bar' }],
          field: 'foo',
        })
      ).toEqual([])
    })
    it('returns empty array if object and expected match', () => {
      expect(
        Verifier['getMissingKeys']({
          expectedKeys: ['bar'],
          objects: [{ foo: 'bar' }],
          field: 'foo',
        })
      ).toEqual([])
    })
    it('returns empty array if object and expected match with repeat', () => {
      expect(
        Verifier['getMissingKeys']({
          expectedKeys: ['bar'],
          objects: [{ foo: 'bar' }, { foo: 'bar' }],
          field: 'foo',
        })
      ).toEqual([])
    })
    it('returns empty array if both object and expected match with repeat', () => {
      expect(
        Verifier['getMissingKeys']({
          expectedKeys: ['bar', 'bar'],
          objects: [{ foo: 'bar' }, { foo: 'bar' }],
          field: 'foo',
        })
      ).toEqual([])
    })
    it('returns key if empty object', () => {
      expect(
        Verifier['getMissingKeys']({
          expectedKeys: ['bar'],
          objects: [],
          field: 'foo',
        })
      ).toEqual(['bar'])
    })
    it('returns key if expected does not match object', () => {
      expect(
        Verifier['getMissingKeys']({
          expectedKeys: ['bar'],
          objects: [{ foo: 'biz' }],
          field: 'foo',
        })
      ).toEqual(['bar'])
    })
  })
  describe('getExtraKeys', () => {
    it('returns empty array if empty expected and objects', () => {
      expect(
        Verifier['getExtraKeys']({
          expectedKeys: [],
          objects: [],
          field: 'foo',
        })
      ).toEqual([])
    })
    it('returns empty array if empty objects', () => {
      expect(
        Verifier['getExtraKeys']({
          expectedKeys: ['bar'],
          objects: [],
          field: 'foo',
        })
      ).toEqual([])
    })
    it('returns empty array if object and expected match', () => {
      expect(
        Verifier['getExtraKeys']({
          expectedKeys: ['bar'],
          objects: [{ foo: 'bar' }],
          field: 'foo',
        })
      ).toEqual([])
    })
    it('returns empty array if both object and expected match with repeat', () => {
      expect(
        Verifier['getExtraKeys']({
          expectedKeys: ['bar', 'bar'],
          objects: [{ foo: 'bar' }, { foo: 'bar' }],
          field: 'foo',
        })
      ).toEqual([])
    })
    it('returns key if object and empty expected', () => {
      expect(
        Verifier['getExtraKeys']({
          expectedKeys: [],
          objects: [{ foo: 'bar' }],
          field: 'foo',
        })
      ).toEqual(['bar'])
    })
    it('returns key if object and expected do no match', () => {
      expect(
        Verifier['getExtraKeys']({
          expectedKeys: ['biz'],
          objects: [{ foo: 'bar' }],
          field: 'foo',
        })
      ).toEqual(['bar'])
    })
    it('returns key if object and expected match with repeat', () => {
      expect(
        Verifier['getExtraKeys']({
          expectedKeys: ['bar'],
          objects: [{ foo: 'bar' }, { foo: 'bar' }],
          field: 'foo',
        })
      ).toEqual(['bar'])
    })
  })
})

function testVerifiyObjects({
  expectedKeys,
  objects,
  field,
  resourceLabelPlural,
  getMissingKeysResponse = [],
  getExtraKeysResponse = [],
  error,
}: {
  expectedKeys: (ObjectId | string)[]
  objects: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
  field: string
  resourceLabelPlural: string
  getMissingKeysResponse?: string[]
  getExtraKeysResponse?: string[]
  error?: string
}) {
  const getMissingKeysSpy = jest.spyOn(Verifier as any, 'getMissingKeys').mockReturnValue(getMissingKeysResponse)
  const getExtraKeysSpy = jest.spyOn(Verifier as any, 'getExtraKeys').mockReturnValue(getExtraKeysResponse)
  const errorSpy = jest.fn().mockImplementation()
  const logger = {
    error: errorSpy,
  } as any as Logger

  if (error) {
    expect(() =>
      Verifier.checkObjects({
        expectedKeys,
        objects,
        field,
        logger,
        resourceLabelPlural,
      })
    ).toThrow(Error(error))
  } else {
    expect(
      Verifier.checkObjects({
        expectedKeys,
        objects,
        field,
        logger,
        resourceLabelPlural,
      })
    ).toEqual(undefined)
  }

  expect(getMissingKeysSpy.mock.calls).toEqual([
    [
      {
        expectedKeys,
        objects,
        field,
      },
    ],
  ])
  expect(getExtraKeysSpy.mock.calls).toEqual(
    getMissingKeysResponse.length > 0
      ? []
      : [
          [
            {
              expectedKeys,
              objects,
              field,
            },
          ],
        ]
  )
  expect(errorSpy.mock.calls).toEqual(error ? [[Error(error)]] : [])
}
