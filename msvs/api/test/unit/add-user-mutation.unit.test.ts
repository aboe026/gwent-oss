import AddUserImplementation from '../../src/graphql/resolvers/mutations/add-user/add-user-implementation'
import AddUserMutation from '../../src/graphql/resolvers/mutations/add-user/add-user-mutation'
import AddUserResolution from '../../src/graphql/resolvers/mutations/add-user/add-user-resolution'
import AddUserValidation from '../../src/graphql/resolvers/mutations/add-user/add-user-validation'
import { MutationAddUserArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import TestUtil from '../util/test-util'

describe('add-user-mutation', () => {
  describe('addUserMutation', () => {
    it('throws error if validation throws error', async () => {
      await testAddUserMutation({
        validationError: Error('validation error'),
      })
    })
    it('throws error if implementation throws error', async () => {
      await testAddUserMutation({
        implementationError: Error('implementation error'),
      })
    })
    it('throws error if resolution throws error', async () => {
      await testAddUserMutation({
        resolutionError: Error('resolution error'),
      })
    })
    it('returns resolution if no errors', async () => {
      await testAddUserMutation({})
    })
  })
})

async function testAddUserMutation({
  validationError,
  implementationError,
  resolutionError,
}: {
  validationError?: Error
  implementationError?: Error
  resolutionError?: Error
}) {
  const logPrefix = 'log-prefix'
  const args: MutationAddUserArgs = {
    name: 'user-name',
    password: 'user-password',
  }
  const user = TestUtil.getDbUser({
    name: args.name,
    password: args.password,
  })
  const resolvedUser = TestUtil.getUserFromDbUser(user)
  const validationSpy = jest.spyOn(AddUserValidation, 'addUserValidation')
  if (validationError) {
    validationSpy.mockRejectedValue(validationError)
  } else {
    validationSpy.mockResolvedValue({
      logPrefix,
      name: args.name,
      password: args.password,
    })
  }
  const implementationSpy = jest.spyOn(AddUserImplementation, 'addUserImplementation')
  if (implementationError) {
    implementationSpy.mockRejectedValue(implementationError)
  } else {
    implementationSpy.mockResolvedValue(user)
  }
  const resolutionSpy = jest.spyOn(AddUserResolution, 'addUserResolution')
  if (resolutionError) {
    resolutionSpy.mockImplementation(() => {
      throw resolutionError
    })
  } else {
    resolutionSpy.mockReturnValue(resolvedUser)
  }

  const error = validationError || implementationError || resolutionError
  const promise = AddUserMutation.addUserMutation(args, null as any)
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
              logPrefix,
              name: args.name,
              password: args.password,
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
