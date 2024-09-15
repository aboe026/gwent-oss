import { ApolloError } from '@apollo/client'

import { getApolloError, retryCheckingAuth } from '../../src/util/error-util'

describe('error-util', () => {
  describe('getApolloError', () => {
    it('returns empty string if undefined', () => {
      expect(getApolloError(undefined)).toEqual('')
    })
    it('returns graphqlError if one exists', () => {
      const error = 'toast'
      expect(
        getApolloError({
          graphQLErrors: [
            {
              message: error,
            },
          ],
        } as any)
      ).toEqual(error)
    })
    it('returns graphqlErrors if multiple exists', () => {
      const error1 = 'toast'
      const error2 = 'jelly'
      expect(
        getApolloError({
          graphQLErrors: [
            {
              message: error1,
            },
            {
              message: error2,
            },
          ],
        } as any)
      ).toEqual(`${error1}\n${error2}`)
    })
    it('does not return duplicate graphqlErrors', () => {
      const error1 = 'toast'
      const error2 = 'toast'
      expect(
        getApolloError({
          graphQLErrors: [
            {
              message: error1,
            },
            {
              message: error2,
            },
          ],
        } as any)
      ).toEqual(error1)
    })
    it('returns clientError if one exists', () => {
      const error = 'toast'
      expect(
        getApolloError({
          clientErrors: [
            {
              message: error,
            },
          ],
        } as any)
      ).toEqual(error)
    })
    it('returns clientErrors if multiple exists', () => {
      const error1 = 'toast'
      const error2 = 'jelly'
      expect(
        getApolloError({
          clientErrors: [
            {
              message: error1,
            },
            {
              message: error2,
            },
          ],
        } as any)
      ).toEqual(`${error1}\n${error2}`)
    })
    it('does not return duplicate clientErrors', () => {
      const error1 = 'toast'
      const error2 = 'toast'
      expect(
        getApolloError({
          clientErrors: [
            {
              message: error1,
            },
            {
              message: error2,
            },
          ],
        } as any)
      ).toEqual(error1)
    })
    it('returns protocolError if one exists', () => {
      const error = 'toast'
      expect(
        getApolloError({
          protocolErrors: [
            {
              message: error,
            },
          ],
        } as any)
      ).toEqual(error)
    })
    it('returns protocolErrors if multiple exists', () => {
      const error1 = 'toast'
      const error2 = 'jelly'
      expect(
        getApolloError({
          protocolErrors: [
            {
              message: error1,
            },
            {
              message: error2,
            },
          ],
        } as any)
      ).toEqual(`${error1}\n${error2}`)
    })
    it('does not return duplicate protocolErrors', () => {
      const error1 = 'toast'
      const error2 = 'toast'
      expect(
        getApolloError({
          protocolErrors: [
            {
              message: error1,
            },
            {
              message: error2,
            },
          ],
        } as any)
      ).toEqual(error1)
    })
    it('returns networkError if it exists', () => {
      const error = 'toast'
      expect(
        getApolloError({
          networkError: {
            message: error,
          },
        } as any)
      ).toEqual(error)
    })
    it('returns message if it exists', () => {
      const error = 'toast'
      expect(
        getApolloError({
          message: error,
        } as any)
      ).toEqual(error)
    })
    it('returns joined errors if all errors exist', () => {
      const graphqlError1 = 'ge1'
      const graphqlError2 = 'ge2'
      const clientError1 = 'ce1'
      const clientError2 = 'ce2'
      const protocolError1 = 'pe1'
      const protocolError2 = 'pe2'
      const networkError = 'ne'
      const error = 'e'
      expect(
        getApolloError({
          graphQLErrors: [
            {
              message: graphqlError1,
            },
            {
              message: graphqlError2,
            },
          ],
          clientErrors: [
            {
              message: clientError1,
            },
            {
              message: clientError2,
            },
          ],
          protocolErrors: [
            {
              message: protocolError1,
            },
            {
              message: protocolError2,
            },
          ],
          networkError: {
            message: networkError,
          },
          message: error,
        } as any)
      ).toEqual(
        [
          graphqlError1,
          graphqlError2,
          clientError1,
          clientError2,
          protocolError1,
          protocolError2,
          networkError,
          error,
        ].join('\n')
      )
    })
    it('does not return duplicate errors across types', () => {
      const error = 'error'
      expect(
        getApolloError({
          graphQLErrors: [
            {
              message: error,
            },
            {
              message: error,
            },
          ],
          clientErrors: [
            {
              message: error,
            },
            {
              message: error,
            },
          ],
          protocolErrors: [
            {
              message: error,
            },
            {
              message: error,
            },
          ],
          networkError: {
            message: error,
          },
          message: error,
        } as any)
      ).toEqual(error)
    })
  })
  describe('retryCheckingAuth', () => {
    it('calls checkAuth with method if error is ApolloError', async () => {
      const error = new ApolloError({})
      const method = jest.fn().mockImplementation().mockRejectedValue(error)
      const checkAuth = jest.fn().mockImplementation()

      await expect(
        retryCheckingAuth({
          checkAuth,
          method,
        })
      ).resolves.toEqual(undefined)

      expect(method.mock.calls).toEqual([[]])
      expect(checkAuth.mock.calls).toEqual([[error, method]])
    })
    it('throws error if it is not ApolloError', async () => {
      const error = new Error('network timeout')
      const method = jest.fn().mockImplementation().mockRejectedValue(error)
      const checkAuth = jest.fn().mockImplementation()

      await expect(
        retryCheckingAuth({
          checkAuth,
          method,
        })
      ).rejects.toThrow(error)

      expect(method.mock.calls).toEqual([[]])
      expect(checkAuth.mock.calls).toEqual([])
    })
  })
})
