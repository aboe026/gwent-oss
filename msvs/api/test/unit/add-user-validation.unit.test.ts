import AddUserValidation, { ValidatedAddUser } from '../../src/graphql/resolvers/mutations/add-user/add-user-validation'
import { PASSWORD } from '../func/util/func-constants'
import { PASSWORD_REQUIREMENTS, USERNAME_REQUIREMENTS } from '@gwent-oss/constants'
import ResolverUtil from '../../src/graphql/resolvers/resolver-util'

describe('add-user-validation', () => {
  describe('invalid', () => {
    it('throws error if username too short', async () => {
      const name = 'hi'
      const message = `Invalid name "${name}": Length "${name.length}" less than minimum length "${USERNAME_REQUIREMENTS.Min}"`
      await testAddUserValidation({
        name,
        password: PASSWORD,
        expected: Error(message),
        warnCalls: [[`addUser for user "${name}" failed: ${message}`]],
      })
    })
    it('throws error if username too long', async () => {
      const name = '123456789012345678901234567890123456789012345678901'
      const message = `Invalid name "${name}": Length "${name.length}" greater than maximum length "${USERNAME_REQUIREMENTS.Max}"`
      await testAddUserValidation({
        name,
        password: PASSWORD,
        expected: Error(message),
        warnCalls: [[`addUser for user "${name}" failed: ${message}`]],
      })
    })
    it('throws error if username contains space', async () => {
      const name = 'sp ace'
      const message = `Invalid name "${name}": Cannot contain spaces`
      await testAddUserValidation({
        name,
        password: PASSWORD,
        expected: Error(message),
        warnCalls: [[`addUser for user "${name}" failed: ${message}`]],
      })
    })
    it('throws error if username contains bad special character', async () => {
      const name = 'sp$cial'
      const message = `Invalid name "${name}": Contains invalid characters "$"`
      await testAddUserValidation({
        name,
        password: PASSWORD,
        expected: Error(message),
        warnCalls: [[`addUser for user "${name}" failed: ${message}`]],
      })
    })
    it('throws error if password too short', async () => {
      const name = 'valid'
      const password = 'p@ssW0r'
      const message = `Invalid password: Length "${password.length}" less than minimum length "${PASSWORD_REQUIREMENTS.Min}"`
      await testAddUserValidation({
        name,
        password,
        expected: Error(message),
        warnCalls: [[`addUser for user "${name}" failed: ${message}`]],
      })
    })
    it('throws error if password too long', async () => {
      const name = 'valid'
      const password = 'p@ssW0rdddp@ssW0rdddp@ssW0rdddp@ssW0rdddp@ssW0rdddp'
      const message = `Invalid password: Length "${password.length}" greater than maximum length "${PASSWORD_REQUIREMENTS.Max}"`
      await testAddUserValidation({
        name,
        password,
        expected: Error(message),
        warnCalls: [[`addUser for user "${name}" failed: ${message}`]],
      })
    })
    it('throws error if password contains space', async () => {
      const name = 'valid'
      const password = 'p@ss W0rd'
      const message = `Invalid password: Cannot contain spaces`
      await testAddUserValidation({
        name,
        password,
        expected: Error(message),
        warnCalls: [[`addUser for user "${name}" failed: ${message}`]],
      })
    })
    it('throws error if password does not contain uppercase', async () => {
      const name = 'valid'
      const password = 'p@ssw0rd'
      const message = `Invalid password: Must contain an uppercase letter`
      await testAddUserValidation({
        name,
        password,
        expected: Error(message),
        warnCalls: [[`addUser for user "${name}" failed: ${message}`]],
      })
    })
    it('throws error if password does not contain lowercase', async () => {
      const name = 'valid'
      const password = 'P@SSW0RD'
      const message = `Invalid password: Must contain a lowercase letter`
      await testAddUserValidation({
        name,
        password,
        expected: Error(message),
        warnCalls: [[`addUser for user "${name}" failed: ${message}`]],
      })
    })
    it('throws error if password does not contain number', async () => {
      const name = 'valid'
      const password = 'p@ssWord'
      const message = `Invalid password: Must contain a number`
      await testAddUserValidation({
        name,
        password,
        expected: Error(message),
        warnCalls: [[`addUser for user "${name}" failed: ${message}`]],
      })
    })
    it('throws error if password does not contain special', async () => {
      const name = 'valid'
      const password = 'passW0rd'
      const message = `Invalid password: Must contain a special character`
      await testAddUserValidation({
        name,
        password,
        expected: Error(message),
        warnCalls: [[`addUser for user "${name}" failed: ${message}`]],
      })
    })
    it('throws error if password does contains invalid special', async () => {
      const name = 'valid'
      const password = 'p@ssW0rd$'
      const message = `Invalid password: Contains invalid characters "$"`
      await testAddUserValidation({
        name,
        password,
        expected: Error(message),
        warnCalls: [[`addUser for user "${name}" failed: ${message}`]],
      })
    })
  })
  it('returns name and password if valid', async () => {
    const name = 'name-arg'
    const password = PASSWORD
    await testAddUserValidation({
      name,
      password,
      expected: {
        logPrefix: `addUser for user "${name}"`,
        name,
        password,
      },
    })
  })
})

async function testAddUserValidation({
  name = '',
  password = '',
  expected,
  warnCalls = [],
}: {
  name?: string
  password?: string
  expected: ValidatedAddUser | Error
  warnCalls?: string[][]
}) {
  const args = {
    name,
    password,
  }
  const logRequestInfoSpy = jest.spyOn(ResolverUtil.prototype, 'logRequestInfo').mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  AddUserValidation['logger'] = {
    warn: warnSpy,
  } as any

  const promise = AddUserValidation.addUserValidation(args, null as any)
  if (expected instanceof Error) {
    await expect(promise).rejects.toThrow(expected)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(logRequestInfoSpy.mock.calls).toEqual([
    [
      {
        args,
        info: null,
        secureKeys: ['password'],
      },
    ],
  ])
  expect(warnSpy.mock.calls).toEqual(warnCalls)
}
