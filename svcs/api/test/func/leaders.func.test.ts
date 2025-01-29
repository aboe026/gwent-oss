import { graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import { expectizeLeaders, verifyMongoIds } from './util/expect-util'
import { FactionKey } from '@gwent/graphql-schema/database-typings'
import { getLeaderFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'

describe('leaders', () => {
  describe('factions', () => {
    it('returns no leaders if factions empty', async () => {
      const response = await graphql({
        schema,
        source: `{
          leaders(factions: []) {
            ${getLeaderFragment()}
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
          leaders: [],
        },
      })
    })
    it('returns scoped leaders if monsters faction specified', async () => {
      const faction = FactionKey.Monsters
      const response = await graphql({
        schema,
        source: `{
          leaders(factions: [${faction}]) {
            ${getLeaderFragment()}
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
          leaders: expectizeLeaders().filter((leader) => leader.faction?.key === faction),
        },
      })
      verifyMongoIds(response?.data?.leaders)
    })
    it('returns no leaders if neutral faction specified', async () => {
      const response = await graphql({
        schema,
        source: `{
          leaders(factions: [${FactionKey.Neutral}]) {
            ${getLeaderFragment()}
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
          leaders: [],
        },
      })
    })
    it('returns scoped leaders if nilfgaardian empire faction specified', async () => {
      const faction = FactionKey.NilfgaardianEmpire
      const response = await graphql({
        schema,
        source: `{
          leaders(factions: [${faction}]) {
            ${getLeaderFragment()}
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
          leaders: expectizeLeaders().filter((leader) => leader.faction?.key === faction),
        },
      })
      verifyMongoIds(response?.data?.leaders)
    })
    it('returns scoped leaders if northern realms faction specified', async () => {
      const faction = FactionKey.NorthernRealms
      const response = await graphql({
        schema,
        source: `{
          leaders(factions: [${faction}]) {
            ${getLeaderFragment()}
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
          leaders: expectizeLeaders().filter((leader) => leader.faction?.key === faction),
        },
      })
      verifyMongoIds(response?.data?.leaders)
    })
    it('returns scoped leaders if scoiatael faction specified', async () => {
      const faction = FactionKey.ScoiaTael
      const response = await graphql({
        schema,
        source: `{
          leaders(factions: [${faction}]) {
            ${getLeaderFragment()}
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
          leaders: expectizeLeaders().filter((leader) => leader.faction?.key === faction),
        },
      })
      verifyMongoIds(response?.data?.leaders)
    })
    it('returns scoped leaders if skellige faction specified', async () => {
      const faction = FactionKey.Skellige
      const response = await graphql({
        schema,
        source: `{
          leaders(factions: [${faction}]) {
            ${getLeaderFragment()}
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
          leaders: expectizeLeaders().filter((leader) => leader.faction?.key === faction),
        },
      })
      verifyMongoIds(response?.data?.leaders)
    })
    it('returns scoped leaders if monsters and skellige faction specified', async () => {
      const factions = `[${FactionKey.Monsters}, ${FactionKey.Skellige}]`
      const response = await graphql({
        schema,
        source: `{
          leaders(factions: ${factions}) {
            ${getLeaderFragment()}
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
          leaders: expectizeLeaders().filter(
            (leader) => leader.faction?.key === FactionKey.Monsters || leader.faction?.key === FactionKey.Skellige
          ),
        },
      })
      verifyMongoIds(response?.data?.leaders)
    })
    it('returns all leaders if all factions specified', async () => {
      const factions = `[${FactionKey.Monsters}, ${FactionKey.Neutral}, ${FactionKey.NilfgaardianEmpire}, ${FactionKey.NorthernRealms}, ${FactionKey.ScoiaTael}, ${FactionKey.Skellige}]`
      const response = await graphql({
        schema,
        source: `{
          leaders(factions: ${factions}) {
            ${getLeaderFragment()}
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
          leaders: expectizeLeaders(),
        },
      })
      verifyMongoIds(response?.data?.leaders)
    })
  })
})
