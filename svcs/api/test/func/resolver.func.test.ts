import { GraphQLError, graphql } from 'graphql'

import cards from '../../src/database/upgrades/cards.json'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { Leader, Unit } from '../../src/graphql/generated-typings'
import { normalizeLeader, normalizeUnit } from '../../src/database/upgrades/upgrade-2'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import { ObjectId } from 'mongodb'
import schema from '../../src/graphql/schema'
import { version } from '../../package.json'

describe('resolver', () => {
  beforeEach(async () => {
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
        schema,
        source: `{
          leaders {
            id
            name
            faction
            dlc
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
        schema,
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
          schema,
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
          schema,
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
  describe('addUser', () => {
    it('adds a user if they do not already exist', async () => {
      const name = 'test'
      const password = 'password'
      await verifyUserDoesNotExist(name, password)

      await addUser(name, password)

      await verifyUserExists(name, password)
    })

    it('returns error if user already exists', async () => {
      const name = 'test'
      const password = 'password'
      await verifyUserDoesNotExist(name, password)
      await addUser(name, password)
      await verifyUserExists(name, password)

      await expect(
        graphql({
          schema,
          source: `mutation AddUser($name: String!, $password: String!) {
            addUser(name: $name, password: $password) {
              id
              name
            }
          }`,
          variableValues: {
            name,
            password,
          },
        })
      ).resolves.toEqual({
        data: {
          addUser: null,
        },
        errors: [new GraphQLError(`User "${name}" already exists`)],
      })

      await verifyUserExists(name, password)
    })
  })
  describe('login', () => {
    it('returns user if credentials valid', async () => {
      const name = 'test'
      const password = 'password'
      await addUser(name, password)

      await verifyUserExists(name, password)
    })
    it('returns error if user does not exist', async () => {
      const name = 'test'

      await expect(
        graphql({
          schema,
          source: `mutation Login($name: String!, $password: String!) {
            login(name: $name, password: $password) {
              id
              name
            }
          }`,
          variableValues: {
            name,
            password: 'password',
          },
        })
      ).resolves.toEqual({
        data: {
          login: null,
        },
        errors: [new GraphQLError(`Invalid credentials for user "${name}"`)],
      })
    })
    it('returns error if wrong password', async () => {
      const name = 'test'
      await addUser(name, 'password')

      await expect(
        graphql({
          schema,
          source: `mutation Login($name: String!, $password: String!) {
            login(name: $name, password: $password) {
              id
              name
            }
          }`,
          variableValues: {
            name,
            password: 'invalid',
          },
        })
      ).resolves.toEqual({
        data: {
          login: null,
        },
        errors: [new GraphQLError(`Invalid credentials for user "${name}"`)],
      })
    })
  })
  describe('getCurrentUser', () => {
    it('returns error if no user on session', async () => {
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
    it('returns user if they exist on session', async () => {
      const name = 'test'
      const id = new ObjectId()
      await addUser(name, 'password')

      await expect(
        graphql({
          schema,
          source: `{
            getCurrentUser {
              id
              name
            }
          }`,
          contextValue: {
            session: {
              user: {
                name,
                _id: id,
              },
            },
          },
        })
      ).resolves.toEqual({
        data: {
          getCurrentUser: {
            id: id.toString(),
            name,
          },
        },
      })
    })
  })
  describe('logout', () => {
    it('returns false if user does not exist on session', async () => {
      await expect(
        graphql({
          schema,
          source: `mutation {
            logout
          }`,
        })
      ).resolves.toEqual({
        data: {
          logout: false,
        },
      })
    })
    it('returns true if user exists on session', async () => {
      await expect(
        graphql({
          schema,
          source: `mutation {
            logout
          }`,
          contextValue: {
            session: {
              user: {
                _id: new ObjectId(),
              },
            },
          },
        })
      ).resolves.toEqual({
        data: {
          logout: true,
        },
      })
    })
  })
})

async function verifyUserDoesNotExist(name: string, password: string) {
  await expect(
    graphql({
      schema,
      source: `mutation Login($name: String!, $password: String!) {
        login(name: $name, password: $password) {
          id
          name
        }
      }`,
      variableValues: {
        name,
        password,
      },
    })
  ).resolves.toEqual({
    data: {
      login: null,
    },
    errors: [new GraphQLError(`Invalid credentials for user "${name}"`)],
  })
}

async function addUser(name: string, password: string) {
  await expect(
    graphql({
      schema,
      source: `mutation AddUser($name: String!, $password: String!) {
        addUser(name: $name, password: $password) {
          id
          name
        }
      }`,
      variableValues: {
        name,
        password,
      },
    })
  ).resolves.toEqual({
    data: {
      addUser: {
        id: expect.any(String),
        name,
      },
    },
  })
}

async function verifyUserExists(name: string, password: string) {
  await expect(
    graphql({
      schema,
      source: `mutation Login($name: String!, $password: String!) {
        login(name: $name, password: $password) {
          id
          name
        }
      }`,
      variableValues: {
        name,
        password,
      },
    })
  ).resolves.toEqual({
    data: {
      login: {
        id: expect.any(String),
        name,
      },
    },
  })
}
