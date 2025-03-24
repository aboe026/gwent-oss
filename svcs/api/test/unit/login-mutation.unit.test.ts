import LoginMutation from '../../src/graphql/resolvers/mutations/login/login-mutation'
import { MutationLoginArgs, User } from '@gwent/graphql-schema/resolver-typings'
import TestUtil from '../util/test-util'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserStore from '../../src/database/stores/user-store'

describe('login-mutation', () => {
  describe('login', () => {
    const name = 'james.bond@mi6.com'
    it('throws error if credentials invalid', async () => {
      const error = `Invalid credentials for user "${name}"`
      await testLogin({
        name,
        userValidateResponse: Error(error),
        error: Error(`${error}.`),
      })
    })
    it('throws error if not invalid credentials', async () => {
      const error = Error('Connection refused')
      await testLogin({
        userValidateResponse: error,
        error,
      })
    })
    it('sets user on context if context undefined', async () => {
      await testLogin({
        context: undefined,
      })
    })
    it('sets user on context if context session undefined', async () => {
      await testLogin({
        context: {},
      })
    })
    it('sets user on context if context session does not have user', async () => {
      await testLogin({
        context: {
          session: {},
        },
      })
    })
    it('sets user on context if context session already has user', async () => {
      await testLogin({
        context: {
          session: {
            user: TestUtil.getDbUser({}),
          },
        },
      })
    })
  })
})

async function testLogin({
  name = 'james.bond@mi6.com',
  context,
  userValidateResponse = TestUtil.getDbUser({}),
  error,
}: {
  name?: string
  context?: any
  userValidateResponse?: UserDbObject | Error
  error?: Error
}) {
  const args: MutationLoginArgs = {
    name,
    password: 'secret',
  }
  let user: User | undefined
  const validateSpy = jest.spyOn(UserStore, 'validate')
  if (userValidateResponse instanceof Error) {
    validateSpy.mockRejectedValue(userValidateResponse)
  } else {
    validateSpy.mockResolvedValue(userValidateResponse as UserDbObject)
    user = TestUtil.getUserFromDbUser(userValidateResponse as UserDbObject)
  }

  const promise = LoginMutation.loginMutation(args, context, null as any)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(user)
  }

  expect(validateSpy.mock.calls).toEqual([[args.name, args.password]])
  expect(context).toEqual(
    userValidateResponse instanceof Error || !context
      ? undefined
      : {
          session: {
            user: userValidateResponse,
          },
        }
  )
}
