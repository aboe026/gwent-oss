import { Context } from '@gwent-oss/graphql-schema/context'
import LogoutImplementation from '../../src/graphql/resolvers/mutations/logout/logout-implementation'
import LogoutMutation from '../../src/graphql/resolvers/mutations/logout/logout-mutation'
import LogoutValidation from '../../src/graphql/resolvers/mutations/logout/logout-validation'
import TestUtil from '../util/test-util'

describe('logout-mutation', () => {
  describe('logoutMutation', () => {
    it('throws error if validation throws error', async () => {
      await testLogoutMutation({
        validationError: Error('validation error'),
      })
    })
    it('throws error if implementation throws error', async () => {
      await testLogoutMutation({
        implementationError: Error('implementation error'),
      })
    })
    it('returns resolution if no errors and logoutImplementation returns true', async () => {
      await testLogoutMutation({
        loggedOut: true,
      })
    })
    it('returns resolution if no errors and logoutImplementation returns false', async () => {
      await testLogoutMutation({
        loggedOut: false,
      })
    })
  })
})

function testLogoutMutation({
  validationError,
  implementationError,
  loggedOut,
}: {
  validationError?: Error
  implementationError?: Error
  loggedOut?: boolean
}) {
  const logPrefix = 'log-prefix'
  const user = TestUtil.getDbUser({})
  const context: Context = {
    session: {
      user,
    },
  }
  const validationSpy = jest.spyOn(LogoutValidation, 'logoutValidation')
  if (validationError) {
    validationSpy.mockImplementation(() => {
      throw validationError
    })
  } else {
    validationSpy.mockReturnValue({
      logPrefix,
      userId: user._id,
    })
  }
  const implementationSpy = jest.spyOn(LogoutImplementation, 'logoutImplementation')
  if (implementationError) {
    implementationSpy.mockImplementation(() => {
      throw implementationError
    })
  } else {
    implementationSpy.mockReturnValue(!!loggedOut)
  }

  const error = validationError || implementationError
  if (error) {
    expect(() => LogoutMutation.logoutMutation(context, null as any)).toThrow(error)
  } else {
    expect(LogoutMutation.logoutMutation(context, null as any)).toEqual(loggedOut)
  }

  expect(validationSpy.mock.calls).toEqual([[context, null]])
  expect(implementationSpy.mock.calls).toEqual(
    validationError
      ? []
      : [
          [
            {
              context,
              logPrefix,
              userId: user._id,
            },
          ],
        ]
  )
}
