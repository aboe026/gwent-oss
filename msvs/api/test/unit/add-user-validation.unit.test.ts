import AddUserValidation from '../../src/graphql/resolvers/mutations/add-user/add-user-validation'
import { MutationAddUserArgs } from '@gwent-oss/graphql-schema/database-typings'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'

describe('add-user-validation', () => {
  it('returns objects', async () => {
    const args: MutationAddUserArgs = {
      name: 'name-arg',
      password: 'password-arg',
    }
    const logRequestInfoSpy = jest.spyOn(ResolverUtil.prototype, 'logRequestInfo').mockImplementation()

    await expect(AddUserValidation.addUserValidation(args, null as any)).resolves.toEqual({
      logPrefix: `addUser for user "${args.name}"`,
      name: args.name,
      password: args.password,
    })

    expect(logRequestInfoSpy.mock.calls).toEqual([
      [
        {
          args,
          info: null,
          secureKeys: ['password'],
        },
      ],
    ])
  })
})
