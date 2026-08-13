import { MongoError, ObjectId, ReturnDocument } from 'mongodb'

import DbConnector from '../../src/database/db-connector'
import Store from '../../src/database/stores/store'

describe('store', () => {
  describe('getCollection', () => {
    it('connects to database and returns collection', async () => {
      const collection = 'collection-mock'
      const collectionSpy = jest.fn().mockReturnValue(collection)
      const connectSpy = jest.spyOn(DbConnector, 'connect').mockImplementation(() => {
        return {
          collection: collectionSpy,
        } as any
      })
      const collectionName = 'unit-test'

      await expect(Store['getCollection'](collectionName)).resolves.toEqual(collection)

      expect(connectSpy.mock.calls).toEqual([[]])
      expect(collectionSpy.mock.calls).toEqual([[collectionName]])
    })
  })
  describe('create', () => {
    it('calls to insertOne with document', async () => {
      const doc = {
        name: 'unit-test',
      }
      const id = new ObjectId()
      const insertOneSpy = jest.fn().mockResolvedValue({
        insertedId: id,
      })
      jest.spyOn(Store as any, 'getCollection').mockResolvedValue({
        insertOne: insertOneSpy,
      })

      await expect(Store['create'](doc)).resolves.toEqual({
        _id: id,
        ...doc,
      })

      expect(insertOneSpy.mock.calls).toEqual([[doc]])
    })
  })
  describe('readOne', () => {
    it('calls to findOne with filter and options', async () => {
      const findOneSpy = jest.fn().mockResolvedValue({})
      jest.spyOn(Store as any, 'getCollection').mockResolvedValue({
        findOne: findOneSpy,
      })
      const filter = {
        name: 'unit-test',
      }
      const options = {
        projection: {
          name: 1,
        },
      }
      await expect(
        Store['readOne']({
          filter,
          options,
        })
      ).resolves.toEqual({})

      expect(findOneSpy.mock.calls).toEqual([[filter, options]])
    })
    it('uses empty filter if none specified', async () => {
      const findOneSpy = jest.fn().mockResolvedValue({})
      jest.spyOn(Store as any, 'getCollection').mockResolvedValue({
        findOne: findOneSpy,
      })
      await expect(Store['readOne']({})).resolves.toEqual({})

      expect(findOneSpy.mock.calls).toEqual([[{}]])
    })
  })
  describe('readMany', () => {
    it('calls toArray after find with filter and options', async () => {
      const toArraySpy = jest.fn().mockImplementation()
      const findSpy = jest.fn().mockReturnValue({
        toArray: toArraySpy,
      })
      jest.spyOn(Store as any, 'getCollection').mockResolvedValue({
        find: findSpy,
      })
      const filter = {
        name: 'unit-test',
      }
      const options = {
        projection: {
          name: 1,
        },
      }

      await expect(
        Store['readMany']({
          filter,
          options,
        })
      ).resolves.toEqual(undefined)

      expect(findSpy.mock.calls).toEqual([[filter, options]])
      expect(toArraySpy.mock.calls).toEqual([[]])
    })
    it('uses empty filter if none specified', async () => {
      const toArraySpy = jest.fn().mockImplementation()
      const findSpy = jest.fn().mockReturnValue({
        toArray: toArraySpy,
      })
      jest.spyOn(Store as any, 'getCollection').mockResolvedValue({
        find: findSpy,
      })
      const options = {
        projection: {
          name: 1,
        },
      }

      await expect(
        Store['readMany']({
          options,
        })
      ).resolves.toEqual(undefined)

      expect(findSpy.mock.calls).toEqual([[{}, options]])
      expect(toArraySpy.mock.calls).toEqual([[]])
    })
  })
  describe('update', () => {
    it('calls to findOneAndUpdate with doc _id', async () => {
      const doc = {
        _id: new ObjectId(),
        name: 'unit-test',
      }
      const value = 'toast'
      const findOneAndUpdateSpy = jest.fn().mockResolvedValue(value)
      jest.spyOn(Store as any, 'getCollection').mockResolvedValue({
        findOneAndUpdate: findOneAndUpdateSpy,
      })

      await expect(
        Store['update']({
          filter: {
            _id: doc._id,
          },
          update: doc,
        })
      ).resolves.toEqual(value)

      expect(findOneAndUpdateSpy.mock.calls).toEqual([
        [
          {
            _id: doc._id,
          },
          doc,
          {
            returnDocument: ReturnDocument.AFTER,
          },
        ],
      ])
    })
    it('can set override returnDocument to be before', async () => {
      const doc = {
        _id: new ObjectId(),
        name: 'unit-test',
      }
      const value = 'toast'
      const findOneAndUpdateSpy = jest.fn().mockResolvedValue(value)
      jest.spyOn(Store as any, 'getCollection').mockResolvedValue({
        findOneAndUpdate: findOneAndUpdateSpy,
      })

      await expect(
        Store['update']({
          filter: {
            _id: doc._id,
          },
          update: doc,
          options: {
            returnDocument: ReturnDocument.BEFORE,
          },
        })
      ).resolves.toEqual(value)

      expect(findOneAndUpdateSpy.mock.calls).toEqual([
        [
          {
            _id: doc._id,
          },
          doc,
          {
            returnDocument: ReturnDocument.BEFORE,
          },
        ],
      ])
    })
    it('throws error if doc with _id does not exist', async () => {
      const doc = {
        _id: new ObjectId(),
        name: 'unit-test',
      }
      const findOneAndUpdateSpy = jest.fn().mockResolvedValue(null)
      jest.spyOn(Store as any, 'getCollection').mockResolvedValue({
        findOneAndUpdate: findOneAndUpdateSpy,
      })

      await expect(
        Store['update']({
          filter: {
            _id: doc._id,
          },
          update: doc,
        })
      ).rejects.toThrow(`Invalid ID "${doc._id.toString()}": Does not exist.`)

      expect(findOneAndUpdateSpy.mock.calls).toEqual([
        [
          {
            _id: doc._id,
          },
          doc,
          {
            returnDocument: ReturnDocument.AFTER,
          },
        ],
      ])
    })
  })
  describe('delete', () => {
    it('calls out to findOneAndDelete with _id', async () => {
      const _id = new ObjectId()
      const value = 'toast'
      const findOneAndDeleteSpy = jest.fn().mockResolvedValue(value)
      jest.spyOn(Store as any, 'getCollection').mockResolvedValue({
        findOneAndDelete: findOneAndDeleteSpy,
      })

      await expect(Store['delete'](_id)).resolves.toEqual(value)

      expect(findOneAndDeleteSpy.mock.calls).toEqual([
        [
          {
            _id,
          },
        ],
      ])
    })
    it('throws error if doc with _id does not exist', async () => {
      const _id = new ObjectId()
      const findOneAndDeleteSpy = jest.fn().mockResolvedValue(null)
      jest.spyOn(Store as any, 'getCollection').mockResolvedValue({
        findOneAndDelete: findOneAndDeleteSpy,
      })

      await expect(Store['delete'](_id)).rejects.toThrow(`Invalid ID "${_id.toString()}": Does not exist.`)

      expect(findOneAndDeleteSpy.mock.calls).toEqual([
        [
          {
            _id,
          },
        ],
      ])
    })
  })
  describe('isMongoError', () => {
    it('returns false if error is not instance of MongoError', () => {
      expect(
        Store.isMongoError({
          error: new Error('not mongo error'),
        })
      ).toEqual(false)
    })
    it('returns false if error instance of MongoError but code does not match', () => {
      const error = new MongoError('mongo error wrong code')
      error.code = 1
      expect(
        Store.isMongoError({
          error,
          code: 2,
        })
      ).toEqual(false)
    })
    it('returns true if error is MongoError', () => {
      expect(
        Store.isMongoError({
          error: new MongoError('mongo error'),
        })
      ).toEqual(true)
    })
    it('returns true if error is MongoError and code matches', () => {
      const error = new MongoError('mongo error with matching code')
      error.code = 1
      expect(
        Store.isMongoError({
          error,
          code: 1,
        })
      ).toEqual(true)
    })
  })
})
