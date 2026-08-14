import { GraphQLError, graphql } from 'graphql'
import { ObjectId } from 'mongodb'

import { addUser } from './util/graphql-util'
import { NOT_AUTHENTICATED_MESSAGE, PASSWORD_REQUIREMENTS, USERNAME_REQUIREMENTS } from '@gwent-oss/constants'
import { PASSWORD } from './util/func-constants'
import schema from '../../src/graphql/executable-schema'

describe('user', () => {
  describe('add', () => {
    describe('invalid', () => {
      it('returns error if username too short', async () => {
        const name = 'hi'
        const password = PASSWORD
        await verifyUserDoesNotExist(name, password)

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
          errors: [
            new GraphQLError(
              `Invalid name "${name}": Length "${name.length}" less than minimum length "${USERNAME_REQUIREMENTS.Min}"`
            ),
          ],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if username too long', async () => {
        const name = '123456789012345678901234567890123456789012345678901'
        const password = PASSWORD
        await verifyUserDoesNotExist(name, password)

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
          errors: [
            new GraphQLError(
              `Invalid name "${name}": Length "${name.length}" greater than maximum length "${USERNAME_REQUIREMENTS.Max}"`
            ),
          ],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if username has single space', async () => {
        const name = 'sp ace'
        const password = PASSWORD
        await verifyUserDoesNotExist(name, password)

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
          errors: [new GraphQLError(`Invalid name "${name}": Cannot contain spaces`)],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if username has multiple spaces', async () => {
        const name = ' sp ace '
        const password = PASSWORD
        await verifyUserDoesNotExist(name, password)

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
          errors: [new GraphQLError(`Invalid name "${name}": Cannot contain spaces`)],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if username has single invalid special character', async () => {
        const name = 'inval.d'
        const password = PASSWORD
        await verifyUserDoesNotExist(name, password)

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
          errors: [new GraphQLError(`Invalid name "${name}": Contains invalid characters "."`)],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if username has multiple invalid special characters', async () => {
        const name = 'inval.d$'
        const password = PASSWORD
        await verifyUserDoesNotExist(name, password)

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
          errors: [new GraphQLError(`Invalid name "${name}": Contains invalid characters ".$"`)],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if username has multiple violations', async () => {
        const name = 'i nval.d$ 12345678901234567890123456789012345678901'
        const password = PASSWORD
        await verifyUserDoesNotExist(name, password)

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
          errors: [
            new GraphQLError(
              `Invalid name "${name}": ${[`Length "${name.length}" greater than maximum length "${USERNAME_REQUIREMENTS.Max}"`, 'Cannot contain spaces', 'Contains invalid characters ".$"'].join(' and ')}`
            ),
          ],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if password too short', async () => {
        const name = 'valid'
        const password = 'p@ssW0r'
        await verifyUserDoesNotExist(name, password)

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
          errors: [
            new GraphQLError(
              `Invalid password: Length "${password.length}" less than minimum length "${PASSWORD_REQUIREMENTS.Min}"`
            ),
          ],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if password too long', async () => {
        const name = 'valid'
        const password = 'p@ssW0rddd12345678901234567890123456789012345678901'
        await verifyUserDoesNotExist(name, password)

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
          errors: [
            new GraphQLError(
              `Invalid password: Length "${password.length}" greater than maximum length "${PASSWORD_REQUIREMENTS.Max}"`
            ),
          ],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if password contains single space', async () => {
        const name = 'valid'
        const password = 'p@ss W0rd'
        await verifyUserDoesNotExist(name, password)

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
          errors: [new GraphQLError(`Invalid password: Cannot contain spaces`)],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if password contains multiple spaces', async () => {
        const name = 'valid'
        const password = ' p@ss W0rd '
        await verifyUserDoesNotExist(name, password)

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
          errors: [new GraphQLError(`Invalid password: Cannot contain spaces`)],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if password does not contain uppercase', async () => {
        const name = 'valid'
        const password = 'p@ssw0rd'
        await verifyUserDoesNotExist(name, password)

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
          errors: [new GraphQLError(`Invalid password: Must contain an uppercase letter`)],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if password does not contain lowercase', async () => {
        const name = 'valid'
        const password = 'P@SSW0RD'
        await verifyUserDoesNotExist(name, password)

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
          errors: [new GraphQLError(`Invalid password: Must contain a lowercase letter`)],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if password does not contain number', async () => {
        const name = 'valid'
        const password = 'p@ssWord'
        await verifyUserDoesNotExist(name, password)

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
          errors: [new GraphQLError(`Invalid password: Must contain a number`)],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if password does not contain a special character', async () => {
        const name = 'valid'
        const password = 'passW0rd'
        await verifyUserDoesNotExist(name, password)

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
          errors: [new GraphQLError(`Invalid password: Must contain a special character`)],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if password contains a single invalid special character', async () => {
        const name = 'valid'
        const password = 'p@ssW0rd.'
        await verifyUserDoesNotExist(name, password)

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
          errors: [new GraphQLError(`Invalid password: Contains invalid characters "."`)],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if password contains multiple invalid special characters', async () => {
        const name = 'valid'
        const password = '$p@ssW0rd.'
        await verifyUserDoesNotExist(name, password)

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
          errors: [new GraphQLError(`Invalid password: Contains invalid characters "$."`)],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if password contains multiple violations', async () => {
        const name = 'valid'
        const password = ' .$ '
        await verifyUserDoesNotExist(name, password)

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
          errors: [
            new GraphQLError(
              `Invalid password: ${[
                `Length "${password.length}" less than minimum length "${PASSWORD_REQUIREMENTS.Min}"`,
                'Cannot contain spaces',
                'Must contain an uppercase letter',
                'Must contain a lowercase letter',
                'Must contain a number',
                'Must contain a special character',
                'Contains invalid characters ".$"',
              ].join(' and ')}`
            ),
          ],
        })

        await verifyUserDoesNotExist(name, password)
      })
      it('returns error if user already exists', async () => {
        const name = 'test'
        const password = PASSWORD
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
    describe('valid', () => {
      it('adds a user if they do not already exist', async () => {
        const name = 'test'
        const password = PASSWORD
        await verifyUserDoesNotExist(name, password)

        await addUser(name, password)

        await verifyUserExists(name, password)
      })
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
      await addUser(name, PASSWORD)

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
      const password = PASSWORD
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
            password: PASSWORD,
          },
        })
      ).resolves.toEqual({
        data: null,
        errors: [new GraphQLError(`Invalid credentials for user "${name}".`)],
      })
    })
    it('returns error if wrong password', async () => {
      const name = 'test'
      await addUser(name, PASSWORD)

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
