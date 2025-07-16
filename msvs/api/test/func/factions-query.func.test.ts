import { graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import { expectizeFactions, verifyMongoIds } from './util/expect-util'
import { getFactionFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'

describe('factions-query', () => {
  describe('factions', () => {
    it('returns all factions if no inputs provided', async () => {
      const response = await graphql({
        schema,
        source: `{
          factions {
            ${getFactionFragment()}
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
    it('returns single faction if single key provided', async () => {
      const response = await graphql({
        schema,
        source: `{
          factions(
            keys: [${FactionKey.Neutral}]
          ) {
            ${getFactionFragment()}
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
          factions: expectizeFactions().filter((faction) => faction.key === FactionKey.Neutral),
        },
      })
      verifyMongoIds(response.data?.factions)
    })
    it('returns two factions if two keys provided', async () => {
      const response = await graphql({
        schema,
        source: `{
          factions(
            keys: [${FactionKey.NorthernRealms}, ${FactionKey.Neutral}]
          ) {
            ${getFactionFragment()}
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
          factions: expectizeFactions().filter(
            (faction) => faction.key === FactionKey.NorthernRealms || faction.key === FactionKey.Neutral
          ),
        },
      })
      verifyMongoIds(response.data?.factions)
    })
    it('returns all factions if all keys provided', async () => {
      const response = await graphql({
        schema,
        source: `{
          factions(
            keys: [${FactionKey.Monsters}, ${FactionKey.Neutral}, ${FactionKey.NilfgaardianEmpire}, ${
              FactionKey.NorthernRealms
            }, ${FactionKey.ScoiaTael}, ${FactionKey.Skellige}]
          ) {
            ${getFactionFragment()}
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
