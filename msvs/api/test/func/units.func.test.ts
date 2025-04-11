import { graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import { expectizeUnits, verifyMongoIds } from './util/expect-util'
import { FactionKey } from '@gwent/graphql-schema/resolver-typings'
import { getUnitFragment } from './util/fragment-util'
import schema from '../../src/graphql/executable-schema'

describe('units', () => {
  describe('deckable', () => {
    it('returns all units if deckable not provided', async () => {
      const response = await graphql({
        schema,
        source: `{
          units {
            ${getUnitFragment()}
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
          units: expectizeUnits(),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns only deckable units if deckable true', async () => {
      const response = await graphql({
        schema,
        source: `{
          units(deckable: true) {
            ${getUnitFragment()}
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
          units: expectizeUnits().filter((unit) => unit.deckable === true),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns only non-deckable units if deckable false', async () => {
      const response = await graphql({
        schema,
        source: `{
          units(deckable: false) {
            ${getUnitFragment()}
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
          units: expectizeUnits().filter((unit) => unit.deckable === false),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
  })
  describe('factions', () => {
    it('returns no units if factions empty', async () => {
      const response = await graphql({
        schema,
        source: `{
          units(factions: []) {
            ${getUnitFragment()}
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
          units: [],
        },
      })
    })
    it('returns scoped units if monsters faction specified', async () => {
      const faction = FactionKey.Monsters
      const response = await graphql({
        schema,
        source: `{
          units(factions: [${faction}]) {
            ${getUnitFragment()}
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
          units: expectizeUnits().filter((unit) => unit.faction.key === faction),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns scoped units if neutral faction specified', async () => {
      const faction = FactionKey.Neutral
      const response = await graphql({
        schema,
        source: `{
          units(factions: [${faction}]) {
            ${getUnitFragment()}
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
          units: expectizeUnits().filter((unit) => unit.faction.key === faction),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns scoped units if nilfgaardian empire faction specified', async () => {
      const faction = FactionKey.NilfgaardianEmpire
      const response = await graphql({
        schema,
        source: `{
          units(factions: [${faction}]) {
            ${getUnitFragment()}
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
          units: expectizeUnits().filter((unit) => unit.faction.key === faction),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns scoped units if northern realms faction specified', async () => {
      const faction = FactionKey.NorthernRealms
      const response = await graphql({
        schema,
        source: `{
          units(factions: [${faction}]) {
            ${getUnitFragment()}
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
          units: expectizeUnits().filter((unit) => unit.faction.key === faction),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns scoped units if scoiatael faction specified', async () => {
      const faction = FactionKey.ScoiaTael
      const response = await graphql({
        schema,
        source: `{
          units(factions: [${faction}]) {
            ${getUnitFragment()}
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
          units: expectizeUnits().filter((unit) => unit.faction.key === faction),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns scoped units if skellige faction specified', async () => {
      const faction = FactionKey.Skellige
      const response = await graphql({
        schema,
        source: `{
          units(factions: [${faction}]) {
            ${getUnitFragment()}
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
          units: expectizeUnits().filter((unit) => unit.faction.key === faction),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns scoped units if monster and neutral factions specified', async () => {
      const factions = `[${FactionKey.Monsters}, ${FactionKey.Neutral}]`
      const response = await graphql({
        schema,
        source: `{
          units(factions: ${factions}) {
            ${getUnitFragment()}
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
          units: expectizeUnits().filter(
            (unit) => unit.faction.key === FactionKey.Monsters || unit.faction.key === FactionKey.Neutral
          ),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
    it('returns all units if all factions specified', async () => {
      const factions = `[${FactionKey.Monsters}, ${FactionKey.Neutral}, ${FactionKey.NilfgaardianEmpire}, ${FactionKey.NorthernRealms}, ${FactionKey.ScoiaTael}, ${FactionKey.Skellige}]`
      const response = await graphql({
        schema,
        source: `{
          units(factions: ${factions}) {
            ${getUnitFragment()}
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
          units: expectizeUnits(),
        },
      })
      verifyMongoIds(response?.data?.units)
    })
  })
})
