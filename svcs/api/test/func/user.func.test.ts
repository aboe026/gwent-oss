import { GraphQLError, graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import { addUser } from './util/graphql-util'
import DbConnector from '../../src/database/db-connector'
import DbUpgrader from '../../src/database/db-upgrader'
import DbUtil from './util/db-util'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import schema from '../../src/graphql/executable-schema'

describe('user', () => {
  beforeEach(async () => {
    await DbUtil.deleteDatabase()
    await DbUpgrader.run()
  })
  afterAll(async () => {
    await DbConnector.disconnect()
  })
  describe('add', () => {
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
        data: null,
        errors: [new GraphQLError(`User with name "${name}" already exists.`)],
      })

      await verifyUserExists(name, password)
    })
  })
  describe('currentUser', () => {
    it('returns error if no user on session', async () => {
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
    it('returns user if they exist on session', async () => {
      const name = 'test'
      const id = new ObjectId()
      await addUser(name, 'password')

      await expect(
        graphql({
          schema,
          source: `{
            currentUser {
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
          currentUser: {
            id: id.toString(),
            name,
          },
        },
      })
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
        data: null,
        errors: [new GraphQLError(`Invalid credentials for user "${name}".`)],
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
        data: null,
        errors: [new GraphQLError(`Invalid credentials for user "${name}".`)],
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
    data: null,
    errors: [new GraphQLError(`Invalid credentials for user "${name}".`)],
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
