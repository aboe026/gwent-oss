import { graphql } from 'graphql'

import { addUser } from './util/graphql-util'
import { GraphQLError } from 'graphql/error'
import schema from '../../src/graphql/executable-schema'
import { USERNAME_REQUIREMENTS } from '@gwent-oss/constants'

describe('username-available-query', () => {
  describe('invalid', () => {
    it('throws error if name too short', async () => {
      const username = 'hi'
      await expect(
        graphql({
          schema,
          source: `{
            usernameAvailable(name: "${username}")
          }`,
          contextValue: {},
        })
      ).resolves.toEqual({
        data: null,
        errors: [
          new GraphQLError(
            `Invalid name "${username}": Length "${username.length}" less than minimum length "${USERNAME_REQUIREMENTS.Min}"`
          ),
        ],
      })
    })
    it('throws error if name too long', async () => {
      const username = '012345678901234567890123456789012345678901234567891'
      await expect(
        graphql({
          schema,
          source: `{
            usernameAvailable(name: "${username}")
          }`,
          contextValue: {},
        })
      ).resolves.toEqual({
        data: null,
        errors: [
          new GraphQLError(
            `Invalid name "${username}": Length "${username.length}" greater than maximum length "${USERNAME_REQUIREMENTS.Max}"`
          ),
        ],
      })
    })
    it('throws error if name constains single space', async () => {
      const username = 'sp ace'
      await expect(
        graphql({
          schema,
          source: `{
            usernameAvailable(name: "${username}")
          }`,
          contextValue: {},
        })
      ).resolves.toEqual({
        data: null,
        errors: [new GraphQLError(`Invalid name "${username}": Cannot contain spaces`)],
      })
    })
    it('throws error if name constains multiple spaces', async () => {
      const username = ' sp ace '
      await expect(
        graphql({
          schema,
          source: `{
            usernameAvailable(name: "${username}")
          }`,
          contextValue: {},
        })
      ).resolves.toEqual({
        data: null,
        errors: [new GraphQLError(`Invalid name "${username}": Cannot contain spaces`)],
      })
    })
    it('throws error if name constains single invalid special character', async () => {
      const username = 'inval.d'
      await expect(
        graphql({
          schema,
          source: `{
            usernameAvailable(name: "${username}")
          }`,
          contextValue: {},
        })
      ).resolves.toEqual({
        data: null,
        errors: [new GraphQLError(`Invalid name "${username}": Contains invalid characters "."`)],
      })
    })
    it('throws error if name constains multiple invalid special characters', async () => {
      const username = 'inval.d$'
      await expect(
        graphql({
          schema,
          source: `{
            usernameAvailable(name: "${username}")
          }`,
          contextValue: {},
        })
      ).resolves.toEqual({
        data: null,
        errors: [new GraphQLError(`Invalid name "${username}": Contains invalid characters ".$"`)],
      })
    })
    it('throws error if name constains multiple violations', async () => {
      const username = 'in val.d$ 01234567890123456789012345678901234567890'
      await expect(
        graphql({
          schema,
          source: `{
            usernameAvailable(name: "${username}")
          }`,
          contextValue: {},
        })
      ).resolves.toEqual({
        data: null,
        errors: [
          new GraphQLError(
            `Invalid name "${username}": ${[`Length "${username.length}" greater than maximum length "${USERNAME_REQUIREMENTS.Max}"`, 'Cannot contain spaces', 'Contains invalid characters ".$"'].join(' and ')}`
          ),
        ],
      })
    })
  })
  describe('valid', () => {
    it('returns true if username available', async () => {
      const username = `usrn-av-qry-${Date.now()}`
      await expect(
        graphql({
          schema,
          source: `{
            usernameAvailable(name: "${username}")
          }`,
          contextValue: {},
        })
      ).resolves.toEqual({
        data: {
          usernameAvailable: true,
        },
      })
    })
    it('returns false if username taken', async () => {
      const username = `usrn-av-qry-${Date.now()}`
      await addUser(username)
      await expect(
        graphql({
          schema,
          source: `{
            usernameAvailable(name: "${username}")
          }`,
          contextValue: {},
        })
      ).resolves.toEqual({
        data: {
          usernameAvailable: false,
        },
      })
    })
  })
})
