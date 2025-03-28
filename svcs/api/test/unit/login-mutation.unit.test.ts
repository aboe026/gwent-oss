import { Context } from '@gwent/graphql-schema/context'
import LoginImplementation from '../../src/graphql/resolvers/mutations/login/login-implementation'
import LoginMutation from '../../src/graphql/resolvers/mutations/login/login-mutation'
import LoginValidation from '../../src/graphql/resolvers/mutations/login/login-validation'
import LoginResolution from '../../src/graphql/resolvers/mutations/login/login-resolution'
import { MutationLoginArgs } from '@gwent/graphql-schema/resolver-typings'
import TestUtil from '../util/test-util'

describe('login-mutation', () => {
  describe('loginMutation', () => {
    it('throws error if validation throws error', async () => {
      await testLoginMutation({
        validationError: Error('validation error'),
      })
    })
    it('throws error if implementation throws error', async () => {
      await testLoginMutation({
        implementationError: Error('implementation error'),
      })
    })
    it('throws error if resolution throws error', async () => {
      await testLoginMutation({
        resolutionError: Error('resolution error'),
      })
    })
    it('returns resolution if no errors', async () => {
      await testLoginMutation({})
    })
  })
})

async function testLoginMutation({
  validationError,
  implementationError,
  resolutionError,
}: {
  validationError?: Error
  implementationError?: Error
  resolutionError?: Error
}) {
  const logPrefix = 'log-prefix'
  const args: MutationLoginArgs = {
    name: 'user-name',
    password: 'user-password',
  }
  const context: Context = {
    session: {},
  }
  const user = TestUtil.getDbUser({
    name: args.name,
    password: args.password,
  })
  const resolvedUser = TestUtil.getUserFromDbUser(user)

  const validationSpy = jest.spyOn(LoginValidation, 'loginValidation')
  if (validationError) {
    validationSpy.mockRejectedValue(validationError)
  } else {
    validationSpy.mockResolvedValue({
      logPrefix,
      user,
    })
  }
  const implementationSpy = jest.spyOn(LoginImplementation, 'loginImplementation')
  if (implementationError) {
    implementationSpy.mockImplementation(() => {
      throw implementationError
    })
  } else {
    implementationSpy.mockImplementation()
  }
  const resolutionSpy = jest.spyOn(LoginResolution, 'loginResolution')
  if (resolutionError) {
    resolutionSpy.mockRejectedValue(resolutionError)
  } else {
    resolutionSpy.mockResolvedValue(resolvedUser)
  }

  const error = validationError || implementationError || resolutionError
  const promise = LoginMutation.loginMutation(args, context, null as any)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(resolvedUser)
  }

  expect(validationSpy.mock.calls).toEqual([[args, null]])
  expect(implementationSpy.mock.calls).toEqual(
    validationError
      ? []
      : [
          [
            {
              context,
              logPrefix,
              user,
            },
          ],
        ]
  )
  expect(resolutionSpy.mock.calls).toEqual(
    validationError || implementationError
      ? []
      : [
          [
            {
              logPrefix,
              user,
            },
          ],
        ]
  )
}
