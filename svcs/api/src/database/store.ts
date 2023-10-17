import { Collection, Document, Filter, FindOptions, MongoError, ObjectId, WithId } from 'mongodb'

import DbConnector from './db-connector'

export default abstract class Store {
  static readonly COLLECTION_NAME: string

  private static async getCollection<T extends Document>(name: string): Promise<Collection> {
    const database = await DbConnector.connect()
    return database.collection<T | Document>(name)
  }

  static async create<T extends WithId<Document>>(doc: Document): Promise<T> {
    const collection = await Store.getCollection<T>(this.COLLECTION_NAME)
    const response = await collection.insertOne(doc)
    return {
      ...doc,
      _id: response.insertedId,
    } as T
  }

  static async read<T extends WithId<Document>[]>({
    filter = {},
    options,
  }: {
    filter?: Filter<Document>
    options?: FindOptions
  }): Promise<T> {
    const collection = await Store.getCollection<T>(this.COLLECTION_NAME)
    return collection.find(filter, options).toArray() as Promise<T>
  }

  static async update<T extends WithId<Document>>(doc: WithId<Document>): Promise<T> {
    const collection = await Store.getCollection<T>(this.COLLECTION_NAME)
    const response = await collection.findOneAndUpdate(
      { _id: doc._id },
      {
        $set: doc,
      },
      {
        returnDocument: 'after',
      }
    )
    if (response.lastErrorObject?.n === 0) {
      throw Error(`Invalid ID "${doc._id.toString()}": Does not exist.`)
    }
    return response.value as T
  }

  static async delete<T extends WithId<Document>>(_id: ObjectId): Promise<T> {
    const collection = await Store.getCollection<T>(this.COLLECTION_NAME)
    const response = await collection.findOneAndDelete({ _id })
    if (response.lastErrorObject?.n === 0) {
      throw Error(`Invalid ID "${_id.toString()}": Does not exist.`)
    }
    return response.value as T
  }

  static isMongoError({ error, code }: { error: unknown; code?: number }): boolean {
    if (error instanceof MongoError) {
      if (code !== undefined) {
        return error.code?.toString() === code.toString()
      }
      return true
    }
    return false
  }
}
