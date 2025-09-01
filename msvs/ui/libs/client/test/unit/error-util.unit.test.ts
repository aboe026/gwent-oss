import {
  CombinedGraphQLErrors,
  CombinedProtocolErrors,
  LocalStateError,
  ServerError,
  ServerParseError,
  UnconventionalError,
} from '@apollo/client/errors'

import { getErrorMessages, retryCheckingAuth } from '../../src/util/error-util'

describe('error-util', () => {
  describe('getErrorMessages', () => {
    it('returns empty string if undefined', () => {
      testGetErrorMessage({
        error: undefined,
        expected: '',
      })
    })
    it('returns empty string if null', () => {
      testGetErrorMessage({
        error: undefined,
        expected: '',
      })
    })
    describe('CombinedGraphQLErrors', () => {
      it('returns message of single error', () => {
        testGetErrorMessage({
          error: new CombinedGraphQLErrors({
            errors: [
              {
                message: 'toast',
              },
            ],
          }),
          expected: 'toast',
        })
      })
      it('returns messages from multiple errors', () => {
        testGetErrorMessage({
          error: new CombinedGraphQLErrors({
            errors: [
              {
                message: 'toast',
              },
              {
                message: 'jelly',
              },
            ],
          }),
          expected: 'toast\njelly',
        })
      })
    })
    describe('CombinedProtocolErrors', () => {
      it('returns message of single error', () => {
        testGetErrorMessage({
          error: new CombinedProtocolErrors([
            {
              message: 'toast',
            },
          ]),
          expected: 'toast',
        })
      })
      it('returns message from multiple errors', () => {
        testGetErrorMessage({
          error: new CombinedProtocolErrors([
            {
              message: 'toast',
            },
            {
              message: 'jelly',
            },
          ]),
          expected: 'toast\njelly',
        })
      })
    })
    describe('LocalStateError', () => {
      it('returns message of error', () => {
        testGetErrorMessage({
          error: new LocalStateError('toast'),
          expected: 'toast',
        })
      })
    })
    describe('ServerError', () => {
      it('returns message of error', () => {
        testGetErrorMessage({
          error: new ServerError('toast', {
            bodyText: 'body-text',
            response: {} as any,
          }),
          expected: 'toast',
        })
      })
    })
    describe('ServerParseError', () => {
      it('returns generic message for error', () => {
        testGetErrorMessage({
          error: new ServerParseError('toast', {
            bodyText: 'body-text',
            response: {} as any,
          }),
          expected: 'Could not parse server response',
        })
      })
    })
    describe('UnconventionalError', () => {
      it('returns generic message from error', () => {
        testGetErrorMessage({
          error: new UnconventionalError('toast'),
          expected: 'An error of unexpected shape occurred.',
        })
      })
    })
    describe('Error', () => {
      it('returns message of error', () => {
        testGetErrorMessage({
          error: new Error('toast'),
          expected: 'toast',
        })
      })
    })
    describe('unknown', () => {
      it('returns JSON stringified error and prints error to console', () => {
        testGetErrorMessage({
          error: { hello: 'world' },
          expected: JSON.stringify({ hello: 'world' }),
          errorCalls: [[{ hello: 'world' }]],
        })
      })
    })
  })
  describe('retryCheckingAuth', () => {
    it('does not call to checkAuth if method promise resolves', async () => {
      await testRetryCheckingAuth({
        method: () => {
          return new Promise((resolve) => {
            resolve('toast')
          })
        },
      })
    })
    it('calls to checkAuth with error and method if method promise rejects', async () => {
      const method = () => {
        return new Promise((resolve, reject) => {
          reject(Error('toast'))
        })
      }
      await testRetryCheckingAuth({
        method,
        checkAuthCalls: [[Error('toast'), method]],
      })
    })
  })
})

function testGetErrorMessage({
  error,
  expected,
  errorCalls = [],
}: {
  error: unknown
  expected: string
  errorCalls?: any[][]
}) {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation()

  expect(getErrorMessages(error)).toEqual(expected)

  expect(errorSpy.mock.calls).toEqual(errorCalls)
}

async function testRetryCheckingAuth({
  method,
  checkAuthCalls = [],
}: {
  method: () => Promise<any>
  checkAuthCalls?: any[][]
}) {
  const checkAuthSpy = jest.fn().mockImplementation()

  await expect(
    retryCheckingAuth({
      checkAuth: checkAuthSpy,
      method,
    })
  ).resolves.toEqual(undefined)

  expect(checkAuthSpy.mock.calls).toEqual(checkAuthCalls)
}
