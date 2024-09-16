import { ObjectId } from 'mongodb'

import PasswordHasher from '../../src/util/password-hasher'
import TestUtil from '../test-util'
import { UserDbObject } from '@gwent/graphql-schema/database-typings'
import UserStore from '../../src/database/stores/user-store'

describe('user-store', () => {
  describe('add', () => {
    it('calls to create method with hashed password', async () => {
      await testAddUser({})
    })
    it('logs and throws error if duplicate user', async () => {
      const username = 'username'
      const error = `User with name "${username}" already exists.`
      await testAddUser({
        username,
        createError: Error('Duplicate user'),
        isMongoError: true,
        error: error,
        errorCalls: [[error]],
      })
    })
    it('logs and throws error not related to duplicate user', async () => {
      const error = 'Connection timeout'
      await testAddUser({
        createError: Error(error),
        isMongoError: false,
        error,
        errorCalls: [[Error(error)]],
      })
    })
  })
  describe('getById', () => {
    it('throws error if getByIds response multiple', async () => {
      const id = new ObjectId()
      await testGetById({
        id,
        getByIdResponse: [
          TestUtil.getDbUser({
            id,
          }),
          TestUtil.getDbUser({
            id,
          }),
        ],
        error: `Multiple users with ID "${id}" found.`,
      })
    })
    it('returns undefined if getByIds response empty', async () => {
      await testGetById({
        getByIdResponse: [],
      })
    })
    it('returns read response if single found', async () => {
      const id = new ObjectId()
      await testGetById({
        id,
        getByIdResponse: [
          TestUtil.getDbUser({
            id,
          }),
        ],
      })
    })
  })
  describe('getByIds', () => {
    it('returns empty array if no ids provided', async () => {
      await testGetByIds({
        ids: [],
        readResponse: [],
      })
    })
    it('calls to read if ids are strings', async () => {
      const id = new ObjectId()
      await testGetByIds({
        ids: [id],
        readResponse: [
          TestUtil.getDbUser({
            id,
          }),
        ],
      })
    })
    it('calls to read if ids are ObjectIds', async () => {
      const id = new ObjectId()
      await testGetByIds({
        ids: [id.toString()],
        readResponse: [
          TestUtil.getDbUser({
            id,
          }),
        ],
      })
    })
  })
  describe('getByNames', () => {
    it('returns empty array if user does not exist', async () => {
      await testGetByNames({
        readResponse: [],
      })
    })
    it('returns users without password if one exists', async () => {
      const name = 'user-name'
      await testGetByNames({
        name,
        readResponse: [
          TestUtil.getDbUser({
            name,
          }),
        ],
      })
    })
  })
  describe('validate', () => {
    it('throws error if user does not exist', async () => {
      const username = 'username'
      await testValidate({
        username,
        users: [],
        error: `Invalid credentials for user "${username}"`,
        debugCalls: [[`User with name "${username}" does not exist.`]],
      })
    })
    it('throws error if more than one user exists', async () => {
      const username = 'username'
      const users = [
        TestUtil.getDbUser({
          name: username,
        }),
        TestUtil.getDbUser({
          name: username,
        }),
      ]
      const error = `More than 1 user exists with name "${username}": "${JSON.stringify(users)}".`
      await testValidate({
        username,
        users,
        error: error,
        errorCalls: [[error]],
      })
    })
    it('throws error password does not match hash', async () => {
      const username = 'username'
      await testValidate({
        username,
        users: [
          TestUtil.getDbUser({
            name: username,
            password: 'invalid',
          }),
        ],
        match: false,
        error: `Invalid credentials for user "${username}"`,
        debugCalls: [[`User "${username}" entered incorrect password`]],
      })
    })
    it('returns user if password matches hash', async () => {
      const username = 'username'
      const _id = new ObjectId()
      const created = new Date()
      await testValidate({
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
          password: '',
        },
      })
    })
  })
})

async function testAddUser({
  username = 'username',
  password = 'password',
  createError,
  isMongoError,
  error,
  errorCalls = [],
}: {
  username?: string
  password?: string
  createError?: Error
  isMongoError?: boolean
  error?: string
  errorCalls?: (string | Error)[][]
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

  const promise = UserStore.add(username, password)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual({
      _id,
      created,
      name: username,
      password: '',
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
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(dateSpy.mock.calls).toEqual([[]])
}

async function testGetById({
  id = new ObjectId(),
  error,
  getByIdResponse,
}: {
  id?: string | ObjectId
  getByIdResponse: UserDbObject[]
  error?: string
}) {
  const errorSpy = jest.fn().mockImplementation()
  UserStore['logger'] = {
    error: errorSpy,
  } as any
  const getByIdsSpy = jest.spyOn(UserStore, 'getByIds').mockResolvedValue(getByIdResponse)

  const promise = UserStore.getById(id)
  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual(getByIdResponse[0])
  }

  expect(getByIdsSpy.mock.calls).toEqual([[[id]]])
  expect(errorSpy.mock.calls).toEqual(error ? [[error]] : [])
}

async function testGetByIds({ ids, readResponse }: { ids: (string | ObjectId)[]; readResponse: UserDbObject[] }) {
  const traceSpy = jest.fn().mockImplementation()
  UserStore['logger'] = {
    trace: traceSpy,
  } as any
  const getByIdsSpy = jest.spyOn(UserStore as any, 'read').mockResolvedValue(readResponse)

  await expect(UserStore.getByIds(ids)).resolves.toEqual(
    readResponse.map((user) => {
      return {
        ...user,
        password: '',
      }
    })
  )

  expect(getByIdsSpy.mock.calls).toEqual([
    [
      {
        filter: {
          _id: {
            $in: ids.map((id) => new ObjectId(id)),
          },
        },
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual([[`Getting users with IDs "${JSON.stringify(ids)}"`]])
}

async function testGetByNames({ name = 'user-name', readResponse }: { name?: string; readResponse: UserDbObject[] }) {
  const traceSpy = jest.fn().mockImplementation()
  UserStore['logger'] = {
    isTraceEnabled: jest.fn().mockReturnValue(true),
    trace: traceSpy,
  } as any
  const readSpy = jest.spyOn(UserStore as any, 'read').mockResolvedValue(readResponse)

  await expect(UserStore.getByNames([name])).resolves.toEqual(
    readResponse.length > 0
      ? [
          {
            ...readResponse[0],
            password: '',
          },
        ]
      : []
  )

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter: {
          name: {
            $in: [name],
          },
        },
        options: undefined,
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual([[`Getting users with names "["${name}"]"`]])
}

async function testValidate({
  username,
  users,
  match,
  expected,
  error,
  errorCalls = [],
  debugCalls = [],
}: {
  username: string
  users: UserDbObject[]
  match?: boolean
  expected?: UserDbObject
  error?: string
  errorCalls?: string[][]
  debugCalls?: string[][]
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

  const promise = UserStore.validate(username, password)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(expected)
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
  expect(debugSpy.mock.calls).toEqual(debugCalls)
  expect(errorSpy.mock.calls).toEqual(errorCalls)
}
