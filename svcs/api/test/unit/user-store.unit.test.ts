import { ObjectId } from 'mongodb'

import PasswordHasher from '../../src/util/password-hasher'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserStore from '../../src/database/stores/user-store'

describe('user-store', () => {
  describe('add', () => {
    it('calls to create method with hashed password', async () => {
      await testAddUser({
        username: 'username',
        password: 'password',
      })
    })
    it('logs and throws error if duplicate user', async () => {
      const username = 'username'
      await testAddUser({
        username,
        password: 'password',
        createError: Error('Duplicate user'),
        isMongoError: true,
        error: `User "${username}" already exists`,
        errors: [[`User "${username}" already exists`]],
      })
    })
    it('logs and throws error not related to duplicate user', async () => {
      const error = 'Connection timeout'
      await testAddUser({
        username: 'username',
        password: 'password',
        createError: Error(error),
        isMongoError: false,
        error,
        errors: [[Error(error)]],
      })
    })
  })
  describe('get', () => {
    it('throws error if read response empty', async () => {
      const id = new ObjectId()
      await testGet({
        id,
        readResponse: [],
        error: true,
        errorCalls: [[`User with ID "${id}" does not exist`]],
      })
    })
    it('returns read response if not empty', async () => {
      const id = new ObjectId()
      await testGet({
        id,
        readResponse: [
          {
            _id: id,
            created: new Date(),
            name: 'name',
          },
        ],
      })
    })
  })
  describe('validate', () => {
    it('throws error if user does not exist', async () => {
      const username = 'username'
      await testValidateUser({
        username,
        users: [],
        error: `Invalid credentials for user "${username}"`,
        debugs: [[`User "${username}" does not exist`]],
      })
    })
    it('throws error if more than one user exists', async () => {
      const username = 'username'
      const users = [
        {
          _id: new ObjectId(),
          name: username,
        },
        {
          _id: new ObjectId(),
          name: username,
        },
      ]
      await testValidateUser({
        username,
        users,
        error: `More than 1 user exists with name "${username}": "${JSON.stringify(users)}"`,
        errors: [[`More than 1 user exists with name "${username}": "${JSON.stringify(users)}"`]],
      })
    })
    it('throws error password does not match hash', async () => {
      const username = 'username'
      await testValidateUser({
        username,
        users: [
          {
            _id: new ObjectId(),
            name: username,
            password: 'invalid',
          },
        ],
        match: false,
        error: `Invalid credentials for user "${username}"`,
        debugs: [[`User "${username}" entered incorrect password`]],
      })
    })
    it('returns user if password matches hash', async () => {
      const username = 'username'
      const _id = new ObjectId()
      const created = new Date()
      await testValidateUser({
        username,
        users: [
          {
            _id,
            name: username,
            password: 'hashedPassword',
            created,
          },
        ],
        match: true,
        expected: {
          _id,
          name: username,
          created,
        },
      })
    })
  })
})

async function testAddUser({
  username,
  password,
  createError,
  isMongoError,
  error,
  errors = [],
}: {
  username: string
  password: string
  createError?: Error
  isMongoError?: boolean
  error?: string
  errors?: (string | Error)[][]
}) {
  const hashedPassword = 'hashedPassword'
  const _id = new ObjectId()
  const created = new Date()
  const dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => created)
  const hashSpy = jest.spyOn(PasswordHasher, 'hash').mockResolvedValue(hashedPassword)
  const createSpy = jest.spyOn(UserStore as any, 'create')
  const isMongoErrorSpy = jest.spyOn(UserStore, 'isMongoError')
  if (isMongoError !== undefined) {
    isMongoErrorSpy.mockReturnValue(isMongoError)
  }
  if (createError) {
    createSpy.mockRejectedValue(createError)
  } else {
    createSpy.mockResolvedValue({
      _id,
      created,
      name: username,
      password: hashedPassword,
    })
  }
  const traceSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  UserStore['logger'] = {
    trace: traceSpy,
    error: errorSpy,
  } as any

  if (error) {
    await expect(UserStore.add(username, password)).rejects.toThrow(error)
  } else {
    await expect(UserStore.add(username, password)).resolves.toEqual({
      _id,
      created,
      name: username,
    })
  }

  expect(hashSpy.mock.calls).toEqual([[password]])
  expect(createSpy.mock.calls).toEqual([
    [
      {
        name: username,
        password: hashedPassword,
        created,
      },
    ],
  ])
  expect(isMongoErrorSpy.mock.calls).toEqual(
    createError
      ? [
          [
            {
              error: createError,
              code: 11000,
            },
          ],
        ]
      : []
  )
  expect(traceSpy.mock.calls).toEqual([[`Adding user "${username}"`]])
  expect(errorSpy.mock.calls).toEqual(errors)
  expect(dateSpy.mock.calls).toEqual([[]])
}

async function testGet({
  id,
  error,
  errorCalls = [],
  readResponse,
}: {
  id: string | ObjectId
  readResponse: UserDbObject[]
  error?: boolean
  errorCalls?: string[][]
}) {
  const traceSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  UserStore['logger'] = {
    trace: traceSpy,
    error: errorSpy,
  } as any
  const readSpy = jest.spyOn(UserStore as any, 'read').mockResolvedValue(readResponse)

  if (error) {
    await expect(UserStore.get(id)).rejects.toThrow(`User with ID "${id}" does not exist`)
  } else {
    await expect(UserStore.get(id)).resolves.toEqual(readResponse[0])
  }

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter: {
          _id: id,
        },
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual([[`Getting user with ID "${id}"`]])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}

async function testValidateUser({
  username,
  users,
  match,
  expected,
  error,
  errors = [],
  debugs = [],
}: {
  username: string
  users: any[]
  match?: boolean
  expected?: UserDbObject
  error?: string
  errors?: string[][]
  debugs?: string[][]
}) {
  const password = 'password'
  const expectedPassword = match === undefined ? '' : users[0].password
  const readSpy = jest.spyOn(UserStore as any, 'read').mockResolvedValue(users)
  const matchSpy = jest.spyOn(PasswordHasher, 'match')
  if (match !== undefined) {
    matchSpy.mockResolvedValue(match)
  }
  const debugSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  UserStore['logger'] = {
    debug: debugSpy,
    error: errorSpy,
  } as any

  if (error) {
    await expect(UserStore.validate(username, password)).rejects.toThrow(error)
  } else {
    await expect(UserStore.validate(username, password)).resolves.toEqual(expected)
  }

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter: {
          name: username,
        },
      },
    ],
  ])
  expect(matchSpy.mock.calls).toEqual(match === undefined ? [] : [[password, expectedPassword]])
  expect(debugSpy.mock.calls).toEqual(debugs)
  expect(errorSpy.mock.calls).toEqual(errors)
}
