import { graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { expectizeFactions, verifyMongoIds } from './util/expect-util'
import { getFactionFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'

describe('factions', () => {
  beforeEach(async () => {
    await DbUtil.deleteDatabase()
    await DbUpgrader.run()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  describe('stats', () => {
    it('returns all factions if no inputs provided', async () => {
      const response = await graphql({
        schema,
        source: `{
          factions {
            ${getFactionFragment({})}
          }
        }`,
        contextValue: {
          session: {
            user: {
              _id: new ObjectId(),
            },
          },
        },
      })
      expect(response).toEqual({
        data: {
          factions: expectizeFactions(),
        },
      })
      verifyMongoIds(response.data?.factions)
    })
  })
})
