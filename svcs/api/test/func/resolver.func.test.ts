import { DIRECTIVES } from '@graphql-codegen/typescript-mongodb'
import { graphql } from 'graphql'
import { makeExecutableSchema } from '@graphql-tools/schema'

import cards from '../../src/database/upgrades/cards.json'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { Leader, Unit } from '../../src/graphql/generated-typings'
import { normalizeLeader, normalizeUnit } from '../../src/database/upgrades/upgrade-2'
import { ObjectId } from 'mongodb'
import resolver from '../../src/graphql/resolvers'
import schema from '../../src/graphql/schema'
import { version } from '../../package.json'

const executableSchema = makeExecutableSchema({
  typeDefs: [DIRECTIVES, schema],
  resolvers: resolver,
})

describe('resolver', () => {
  beforeAll(async () => {
    await DbUtil.deleteDatabase()
    await DbUpgrader.run()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  describe('leaders', () => {
    it('leaders query returns all leader cards', async () => {
      const leaders = cards
        .filter((card) => card.Type === 'Leader')
        .map((card) => {
          return {
            id: expect.any(String),
            ...normalizeLeader(card),
          }
        })
      const response = await graphql({
        schema: executableSchema,
        source: `{
          leaders {
            id
            name
            faction
            dlc
          }
        }`,
      })
      expect(response).toEqual({
        data: {
          leaders,
        },
      })
      if (response?.data?.leaders) {
        for (const leader of response?.data.leaders as Leader[]) {
          expect(ObjectId.isValid(leader.id)).toEqual(true)
        }
      }
    })
  })
  describe('units', () => {
    it('units query returns all unit cards', async () => {
      const units = cards
        .filter((card) => card.Type !== 'Leader')
        .map((card) => {
          return {
            id: expect.any(String),
            ...normalizeUnit(card),
          }
        })
      const response = await graphql({
        schema: executableSchema,
        source: `{
          units {
            id
            name
            faction
            occurrences
            dlc
            hero
            combats
            strength
            effects
            scorchScope
            scorchMin
            musterPrefix
          }
        }`,
      })
      expect(response).toEqual({
        data: {
          units,
        },
      })
      if (response?.data?.units) {
        for (const unit of response?.data.units as Unit[]) {
          expect(ObjectId.isValid(unit.id)).toEqual(true)
        }
      }
    })
  })
  describe('version', () => {
    it('returns package json version', async () => {
      await expect(
        graphql({
          schema: executableSchema,
          source: `{
            version
          }`,
        })
      ).resolves.toEqual({
        data: {
          version,
        },
      })
    })
  })
  describe('build', () => {
    it('returns integer', async () => {
      await expect(
        graphql({
          schema: executableSchema,
          source: `{
            build
          }`,
        })
      ).resolves.toEqual({
        data: {
          build: expect.any(Number),
        },
      })
    })
  })
})
