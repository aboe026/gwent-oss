import { GraphQLError, graphql } from 'graphql'

import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import { getLeaderId, getUnitsInput } from './util/graphql-util'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import schema from '../../src/graphql/executable-schema'

describe('permissions', () => {
  beforeAll(async () => {
    await DbUtil.deleteDatabase()
    await DbUpgrader.run()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  describe('query', () => {
    describe('currentUser', () => {
      it('returns error if not authenticated', async () => {
        await expect(
          graphql({
            schema,
            source: `{
              currentUser {
                id
                name
              }
            }`,
          })
        ).resolves.toEqual({
          data: {
            currentUser: null,
          },
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
    })
    describe('decks', () => {
      it('returns error if not authenticated', async () => {
        await expect(
          graphql({
            schema,
            source: `{
              decks {
                id
                name
              }
            }`,
          })
        ).resolves.toEqual({
          data: {
            decks: null,
          },
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
    })
    describe('factions', () => {
      it('returns error if not authenticated', async () => {
        await expect(
          graphql({
            schema,
            source: `{
              factions {
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
    describe('settings', () => {
      it('returns error if not authenticated', async () => {
        await expect(
          graphql({
            schema,
            source: `{
              settings {
                key
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
  describe('mutation', () => {
    describe('addDeck', () => {
      it('returns error if not authenticated', async () => {
        await expect(
          graphql({
            schema,
            source: `mutation {
              addDeck(
                name: "Deck unauthenticated",
                faction: MONSTERS,
                leader: "${await getLeaderId({ name: 'Eredin Bringer of Death' })}",
                units: [${await getUnitsInput(FactionKey.Monsters)}]
              ) {
                id
                name
              }
            }`,
          })
        ).resolves.toEqual({
          data: {
            addDeck: null,
          },
          errors: [new GraphQLError(NOT_AUTHENTICATED_MESSAGE)],
        })
      })
    })
  })
})
