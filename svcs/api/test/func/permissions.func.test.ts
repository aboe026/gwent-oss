import { GraphQLError, graphql } from 'graphql'

import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import schema from '../../src/graphql/schema'

describe('permissions', () => {
  beforeAll(async () => {
    await DbUtil.deleteDatabase()
    await DbUpgrader.run()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  describe('getCurrentUser', () => {
    it('returns error if not authenticated', async () => {
      await expect(
        graphql({
          schema,
          source: `{
            getCurrentUser {
              id
              name
            }
          }`,
        })
      ).resolves.toEqual({
        data: {
          getCurrentUser: null,
        },
        errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
      })
    })
  })
  describe('leaders', () => {
    it('returns error if not authenticated', async () => {
      await expect(
        graphql({
          schema,
          source: `{
            leaders {
              id
              name
            }
          }`,
        })
      ).resolves.toEqual({
        data: null,
        errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
      })
    })
  })
  describe('units', () => {
    it('returns error if not authenticated', async () => {
      await expect(
        graphql({
          schema,
          source: `{
            units {
              id
              name
            }
          }`,
        })
      ).resolves.toEqual({
        data: null,
        errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
      })
    })
  })
})
