import {
  Collection,
  Document,
  Filter,
  FindOneAndUpdateOptions,
  FindOptions,
  MongoError,
  ObjectId,
  UpdateFilter,
  WithId,
} from 'mongodb'

import DbConnector from '../db-connector.mjs'

/**
 * A factory to preform operations on a MongoDB database.
 */
export default abstract class Store {
  static readonly COLLECTION_NAME: string

  /**
   * Gets a collection from a MongoDB database to perform operations against.
   *
   * @param name The name of the collection to get.
   * @returns The MongoDB Collection.
   */
  private static async getCollection<T extends Document>(name: string): Promise<Collection> {
    const database = await DbConnector.connect()
    return database.collection<T | Document>(name)
  }

  /**
   * Add a document to a MongoDB collection.
   *
   * @param doc The document to add.
   * @returns The MongoDB document, including the "_id" that was randomly generated for it (assuming no "_id" was explicitly defined on the input document).
   */
  protected static async create<T extends WithId<Document>>(doc: Document): Promise<T> {
    const collection = await Store.getCollection<T>(this.COLLECTION_NAME)
    const response = await collection.insertOne(doc)
    return {
      ...doc,
      _id: response.insertedId,
    } as T
  }

  /**
   * Retrieves documents from a MongoDB collection matching filter criteria.
   *
   * @param {Object} config The configuration for what documents to return.
   * @param config.filter The MongoDB filter which determines what documents should be returned.
   * @param config.options The options for how the find operation should work when returning documents.
   * @returns The documents from the MongoDB collection matching the filter criteria.
   */
  protected static async read<T extends WithId<Document>[]>({
    filter = {},
    options,
  }: {
    filter?: Filter<Document>
    options?: FindOptions
  }): Promise<T> {
    const collection = await Store.getCollection<T>(this.COLLECTION_NAME)
    return collection.find(filter, options).toArray() as Promise<T>
  }

  /**
   * Edit a document from a MongoDB collection based off its "_id" field.
   *
   * @param doc The document to edit based off its "_id" field.
   * @returns The updated document.
   * @throws Error if the document does not exist.
   */
  protected static async update<T extends WithId<Document>>({
    filter,
    update,
    options = {},
    verifyExistence = true,
  }: {
    filter: Filter<Document>
    update: UpdateFilter<Document>
    options?: FindOneAndUpdateOptions
    verifyExistence?: boolean
  }): Promise<T> {
    const collection = await Store.getCollection<T>(this.COLLECTION_NAME)
    if (!options.returnDocument) {
      options.returnDocument = 'after'
    }
    const response = await collection.findOneAndUpdate(filter, update, options)
    if (verifyExistence && response === null && filter._id) {
      throw Error(`Invalid ID "${filter._id.toString()}": Does not exist.`)
    }
    return response as T
  }

  /**
   * Remove a document from a MongoDB collection. Throws an error if the document does not exist.
   *
   * @param _id The MongoDB ObjectId of the document to delete.
   * @returns The deleted document.
   * @throws Error if the document does not exist.
   */
  protected static async delete<T extends WithId<Document>>(_id: ObjectId): Promise<T> {
    const collection = await Store.getCollection<T>(this.COLLECTION_NAME)
    const response = await collection.findOneAndDelete({ _id })
    if (response === null) {
      throw Error(`Invalid ID "${_id.toString()}": Does not exist.`)
    }
    return response as T
  }

  /**
   * Whether or not an Error is a MongoError (i.e. returned from the MongoDB driver).
   *
   * @param {Object} config The configuration for determining if the Error is a MongoError.
   * @param config.error The Error object to check.
   * @param config.code An optional error code to validate against. If supplied, will only return true if the code on the error matches the code expected.
   * @returns True if the Error is a MongoError, false otherwise.
   */
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
