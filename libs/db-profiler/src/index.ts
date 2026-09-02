import { Collection, Db, MongoClient, ProfilingLevel } from 'mongodb'
import fs from 'fs/promises'
import { fileExists, getFileJson } from '@gwent-oss/node-utils'
import path from 'path'

/**
 * A class for profiling a MongoDB instance for improper operations.
 */
export default class DbProfiler {
  private _url: string
  private _dbName: string
  private _db: Db | undefined = undefined
  private _collection: Collection | undefined = undefined

  /**
   * Instantiate a new instance of the Database Profiler.
   *
   * @param config The configuration used to instantiate the Database Profiling instance.
   * @param config.mongoUrl The Connection String to use when connecting to the MongoDB instance.
   * @param config.mongoDb The database inside the MongoDB instance to utilize.
   */
  constructor({ mongoUrl, mongoDb }: { mongoUrl: string; mongoDb: string }) {
    this._url = mongoUrl
    this._dbName = mongoDb
  }

  /**
   * Initialize a connection to a MongoDB database instance.
   *
   * @returns The database and system profiling collection.
   */
  private async connect(): Promise<{
    db: Db
    collection: Collection
  }> {
    let db = this._db
    let collection = this._collection
    if (!db || !collection) {
      const client = await MongoClient.connect(this._url)
      db = client.db(this._dbName)
      collection = db.collection(Db.SYSTEM_PROFILE_COLLECTION)
    }
    this._db = db
    this._collection = collection
    return {
      db: this._db,
      collection: this._collection,
    }
  }

  /**
   * Start capturing profiling information on the database.
   */
  async start() {
    const { db, collection } = await this.connect()
    await db.setProfilingLevel(ProfilingLevel.off)
    await collection.drop()
    await db.setProfilingLevel(ProfilingLevel.all)
  }

  /**
   * Stop capturing profiling information on the database.
   */
  async stop() {
    const { db } = await this.connect()
    await db.setProfilingLevel(ProfilingLevel.off)
  }

  /**
   * Save MongoDB operations to a file for analysis.
   *
   * @param filePath The full file path (including name) to save results to.
   */
  async recordToFile(filePath: string) {
    await fileExists(path.dirname(filePath))
    const { collection } = await this.connect()
    const docs = await collection.find().toArray()
    await fs.writeFile(filePath, JSON.stringify(docs, null, 2))
  }

  /**
   * Get operation violations from a given profiling result file.
   *
   * @param profilingFilePath The path to the profiling result file to analyze for violations.
   * @returns A list of any operations which are unacceptable and need addressing.
   */
  async getViolations(profilingFilePath: string): Promise<string[]> {
    const results = await getFileJson<ProfileResult[]>(profilingFilePath)
    if (!results) {
      throw Error(`No results found in file "${profilingFilePath}"`)
    }
    const violations: string[] = []
    violations.push(
      ...this.getIndexViolations({
        results,
        ignores: [
          {
            command: {
              filter: {},
            },
            ns: 'factions',
            op: ProfileOperation.Query,
          },
        ],
      })
    )
    return violations
  }

  /**
   * Get list of operations from the MongoDB instance that did not utilize an index.
   *
   * @param config The configuration used to determine violoations.
   * @param config.results The operations ran in the MongoDB instance.
   * @param config.ignores A list of database commands to ignore their usage of indexes.
   * @returns A list of operations which did not properly use an index.
   */
  private getIndexViolations({
    results,
    ignores,
  }: {
    results: ProfileResult[]
    ignores?: CollscansToIgnore[]
  }): string[] {
    const violations: string[] = []
    for (const result of results) {
      if (result.planSummary === PlanSummaryPrefix.Collection) {
        if (
          !this.isIndexIgnored({
            result,
            ignores,
          })
        ) {
          violations.push(
            `No index used for operation "${result.op}" in namespace "${result.ns}" with command "${JSON.stringify(
              result.command
            )}"`
          )
        }
      }
    }
    return violations
  }

  /**
   * Whether or not an index was used for the given results.
   *
   * @param config The configuration used to determine index usage.
   * @param config.result The profile results of the operations performed in the MongoDB database, which may contain scans that did not use an index.
   * @param config.ignores A list of database commands to ignore their usage of indexes.
   * @returns True if all expected operations used an index, false if there was an unexpected operation which did not use an index.
   */
  private isIndexIgnored({ result, ignores }: { result: ProfileResult; ignores?: CollscansToIgnore[] }) {
    if (ignores) {
      for (const ignore of ignores) {
        const nsWithoutDb = result.ns.split('.')[1]
        if (ignore.op === result.op && ignore.ns === nsWithoutDb) {
          let shouldIgnore = true
          for (const key of Object.keys(ignore.command)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (JSON.stringify((ignore.command as any)[key]) !== JSON.stringify((result.command as any)[key])) {
              shouldIgnore = false
            }
          }
          if (shouldIgnore) {
            return true
          }
        }
      }
    }
    return false
  }
}

enum PlanSummaryPrefix {
  Collection = 'COLLSCAN',
  Index = 'IXSCAN',
  Fetch = 'FETCH',
}

enum ProfileOperation {
  Command = 'command',
  Count = 'count',
  Distinct = 'distinct',
  GeoNear = 'geoNear',
  GetMore = 'getMore',
  Group = 'group',
  Insert = 'insert',
  MapReduce = 'mapReduce',
  Query = 'query',
  Remove = 'remove',
  Update = 'update',
}

interface ProfileResult {
  op: ProfileOperation
  ns: string
  command: {
    find?: string
    filter?: any // eslint-disable-line @typescript-eslint/no-explicit-any
    limit?: number
    batchSize?: number
    q?: any // eslint-disable-line @typescript-eslint/no-explicit-any
    u?: any // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  planSummary: string
  keysExamined: number
  docsExamined: number
}

interface CollscansToIgnore {
  op: ProfileOperation
  ns: string
  command: {
    filter: any // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}
