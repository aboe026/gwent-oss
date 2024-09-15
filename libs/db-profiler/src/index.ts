import { Collection, Db, MongoClient, ProfilingLevel } from 'mongodb'
import fs from 'fs-extra'
import path from 'path'

export default class DbProfiler {
  private _url: string
  private _dbName: string
  private _db: Db | undefined = undefined
  private _collection: Collection | undefined = undefined

  constructor({ mongoUrl, mongoDb }: { mongoUrl: string; mongoDb: string }) {
    this._url = mongoUrl
    this._dbName = mongoDb
  }

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

  async start() {
    const { db, collection } = await this.connect()
    await db.setProfilingLevel(ProfilingLevel.off)
    await collection.drop()
    await db.setProfilingLevel(ProfilingLevel.all)
  }

  async stop() {
    const { db } = await this.connect()
    await db.setProfilingLevel(ProfilingLevel.off)
  }

  async recordToFile(filePath: string) {
    await fs.ensureDir(path.dirname(filePath))
    const { collection } = await this.connect()
    const docs = await collection.find().toArray()
    await fs.writeFile(filePath, JSON.stringify(docs, null, 2))
  }

  async getViolations(profilingFilePath: string): Promise<string[]> {
    const results = (await fs.readJson(profilingFilePath, {
      encoding: 'utf-8',
    })) as ProfileResult[]
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
