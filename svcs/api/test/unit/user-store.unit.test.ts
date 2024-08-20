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
  describe('getById', () => {
    it('throws error if getByIds response empty', async () => {
      const id = new ObjectId()
      await testGetById({
        id,
        getByIdResponse: [],
        error: `User with ID "${id}" does not exist`,
      })
    })
    it('throws error if getByIds response multiple', async () => {
      const id = new ObjectId()
      await testGetById({
        id,
        getByIdResponse: [
          {
            _id: id,
            created: new Date(),
            name: 'name-1',
            password: 'password',
          },
          {
            _id: id,
            created: new Date(),
            name: 'name-2',
            password: 'password',
          },
        ],
        error: `Multiple users with ID "${id}" exist`,
      })
    })
    it('returns read response if not empty', async () => {
      const id = new ObjectId()
      await testGetById({
        id,
        getByIdResponse: [
          {
            _id: id,
            created: new Date(),
            name: 'name',
            password: 'password',
          },
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
          {
            _id: id,
            created: new Date(),
            name: 'user-name',
            password: 'user-password',
          },
        ],
      })
    })
    it('calls to read if ids are ObjectIds', async () => {
      const id = new ObjectId()
      await testGetByIds({
        ids: [id.toString()],
        readResponse: [
          {
            _id: id,
            created: new Date(),
            name: 'user-name',
            password: 'user-password',
          },
        ],
      })
    })
  })
  describe('getByName', () => {
    it('throws error if user does not exist', async () => {
      const name = 'user-name'
      await testGetByName({
        name,
        readResponse: [],
        error: `User with name "${name}" does not exist`,
      })
    })
    it('throws error if multiple users with name exist', async () => {
      const name = 'user-name'
      await testGetByName({
        name,
        readResponse: [
          {
            _id: new ObjectId(),
            created: new Date(),
            name,
            password: 'user-password',
          },
          {
            _id: new ObjectId(),
            created: new Date(),
            name,
            password: 'user-password',
          },
        ],
        error: `Multiple users found with name "${name}"`,
      })
    })
    it('returns user without password if one exists', async () => {
      const name = 'user-name'
      await testGetByName({
        name,
        readResponse: [
          {
            _id: new ObjectId(),
            created: new Date(),
            name,
            password: 'user-password',
          },
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
      await testValidate({
        username,
        users,
        error: `More than 1 user exists with name "${username}": "${JSON.stringify(users)}"`,
        errors: [[`More than 1 user exists with name "${username}": "${JSON.stringify(users)}"`]],
      })
    })
    it('throws error password does not match hash', async () => {
      const username = 'username'
      await testValidate({
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
  expect(errorSpy.mock.calls).toEqual(errors)
  expect(dateSpy.mock.calls).toEqual([[]])
}

async function testGetById({
  id,
  error,
  getByIdResponse,
}: {
  id: string | ObjectId
  getByIdResponse: UserDbObject[]
  error?: string
}) {
  const errorSpy = jest.fn().mockImplementation()
  UserStore['logger'] = {
    error: errorSpy,
  } as any
  const getByIdsSpy = jest.spyOn(UserStore, 'getByIds').mockResolvedValue(getByIdResponse)

  if (error) {
    await expect(UserStore.getById(id)).rejects.toThrow(Error(error))
  } else {
    await expect(UserStore.getById(id)).resolves.toEqual(getByIdResponse[0])
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

async function testGetByName({
  name,
  readResponse,
  error,
}: {
  name: string
  readResponse: UserDbObject[]
  error?: string
}) {
  const traceSpy = jest.fn().mockImplementation()
  const errorSpy = jest.fn().mockImplementation()
  UserStore['logger'] = {
    trace: traceSpy,
    error: errorSpy,
  } as any
  const readSpy = jest.spyOn(UserStore as any, 'read').mockResolvedValue(readResponse)

  if (error) {
    await expect(UserStore.getByName(name)).rejects.toThrow(Error(error))
  } else {
    await expect(UserStore.getByName(name)).resolves.toEqual({
      ...readResponse[0],
      password: '',
    })
  }

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter: {
          name,
        },
      },
    ],
  ])
  expect(traceSpy.mock.calls).toEqual([[`Getting user with name "${name}"`]])
  expect(errorSpy.mock.calls).toEqual(error ? [[error]] : [])
}

async function testValidate({
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
