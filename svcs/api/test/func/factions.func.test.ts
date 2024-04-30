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
    it('returns all factions without neutral stats if no inputs provided', async () => {
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
          factions: expectizeFactions({
            neutrals: false,
          }),
        },
      })
      verifyMongoIds(response.data?.factions)
    })
    it('returns all factions without neutral stats if explicit neutrals false provided', async () => {
      const response = await graphql({
        schema,
        source: `{
          factions {
            ${getFactionFragment({
              statsModifier: '(neutrals: false)',
            })}
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
          factions: expectizeFactions({
            neutrals: false,
          }),
        },
      })
      verifyMongoIds(response.data?.factions)
    })
    it('returns all factions with neutral stats if explicit neutrals true provided', async () => {
      const response = await graphql({
        schema,
        source: `{
          factions {
            ${getFactionFragment({
              statsModifier: '(neutrals: true)',
            })}
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
          factions: expectizeFactions({
            neutrals: true,
          }),
        },
      })
      verifyMongoIds(response.data?.factions)
    })
  })
})
