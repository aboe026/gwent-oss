import { Document, Filter, FindOptions, ObjectId } from 'mongodb'

import PasswordHasher from '../../src/util/password-hasher'
import TestUtil from '../util/test-util'
import { UserDbObject } from '@gwent-oss/graphql-schema/database-typings'
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
        warnCalls: [[error]],
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
    it('returns null if getByIds response null', async () => {
      await testGetById({
        readOneResponse: null,
      })
    })
    it('returns read response if found', async () => {
      const id = new ObjectId()
      await testGetById({
        id,
        readOneResponse: TestUtil.getDbUser({
          id,
        }),
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
    it('logs to debug if enabled', async () => {
      const id = new ObjectId()
      await testGetByIds({
        ids: [id.toString()],
        readResponse: [
          TestUtil.getDbUser({
            id,
          }),
        ],
        debugEnabled: true,
      })
    })
    it('logs to trace if enabled', async () => {
      const id = new ObjectId()
      await testGetByIds({
        ids: [id.toString()],
        readResponse: [
          TestUtil.getDbUser({
            id,
          }),
        ],
        traceEnabled: true,
      })
    })
  })
  describe('getByName', () => {
    it('returns null if not found without options', async () => {
      const name = 'hello'
      await testGetByName({
        name,
        readOneResponse: null,
        expected: null,
      })
    })
    it('returns null if not found with options', async () => {
      const name = 'hello'
      await testGetByName({
        name,
        readOneResponse: null,
        expected: null,
        options: {
          skip: 1,
        },
      })
    })
    it('returns user if found without options', async () => {
      const name = 'hello'
      const user = TestUtil.getDbUser({
        name,
      })
      await testGetByName({
        name,
        readOneResponse: user,
        expected: {
          ...user,
          password: '',
        },
      })
    })
    it('returns user if found with options', async () => {
      const name = 'hello'
      const user = TestUtil.getDbUser({
        name,
      })
      await testGetByName({
        name,
        readOneResponse: user,
        expected: {
          ...user,
          password: '',
        },
        options: {
          skip: 1,
        },
      })
    })
    it('logs to trace if enabled', async () => {
      const name = 'hello'
      const user = TestUtil.getDbUser({
        name,
      })
      await testGetByName({
        name,
        readOneResponse: user,
        expected: {
          ...user,
          password: '',
        },
        options: {
          skip: 1,
        },
        traceEnabled: true,
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
    it('returns using options if passed', async () => {
      const name = 'user-name'
      await testGetByNames({
        name,
        options: {
          sort: {
            name: 1,
            _id: 1,
          },
        },
        readResponse: [
          TestUtil.getDbUser({
            name,
          }),
        ],
      })
    })
    it('logs to debug if enabled', async () => {
      const name = 'user-name'
      await testGetByNames({
        name,
        readResponse: [
          TestUtil.getDbUser({
            name,
          }),
        ],
        debugEnabled: true,
      })
    })
    it('logs to trace if enabled', async () => {
      const name = 'user-name'
      await testGetByNames({
        name,
        readResponse: [
          TestUtil.getDbUser({
            name,
          }),
        ],
        traceEnabled: true,
      })
    })
  })
  describe('validate', () => {
    it('throws error if user does not exist', async () => {
      const username = 'username'
      await testValidate({
        username,
        user: null,
        error: `Invalid credentials for user "${username}"`,
        warnCalls: [[`User with name "${username}" does not exist.`]],
      })
    })
    it('throws error password does not match hash', async () => {
      const username = 'username'
      await testValidate({
        username,
        user: TestUtil.getDbUser({
          name: username,
          password: 'invalid',
        }),
        match: false,
        error: `Invalid credentials for user "${username}"`,
        warnCalls: [[`User "${username}" entered incorrect password.`]],
      })
    })
    it('returns user if password matches hash', async () => {
      const username = 'username'
      const _id = new ObjectId()
      const created = new Date()
      await testValidate({
        username,
        user: TestUtil.getDbUser({
          id: _id,
          name: username,
          password: 'invalid',
          created,
        }),
        match: true,
        expected: {
          _id,
          name: username,
          created,
          password: '',
        },
      })
    })
    it('logs to trace if enabled', async () => {
      const username = 'username'
      const _id = new ObjectId()
      const created = new Date()
      await testValidate({
        username,
        user: TestUtil.getDbUser({
          id: _id,
          name: username,
          password: 'hashedPassword',
          created,
        }),
        match: true,
        expected: {
          _id,
          name: username,
          created,
          password: '',
        },
        traceEnabled: true,
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
  warnCalls = [],
}: {
  username?: string
  password?: string
  createError?: Error
  isMongoError?: boolean
  error?: string
  errorCalls?: (string | Error)[][]
  warnCalls?: (string | Error)[][]
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
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  UserStore['logger'] = {
    debug: debugSpy,
    warn: warnSpy,
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
  expect(dateSpy.mock.calls).toEqual([[]])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(debugSpy.mock.calls).toEqual([[`Adding user with name "${username}"`]])
}

async function testGetById({
  id = new ObjectId(),
  error,
  readOneResponse,
}: {
  id?: string | ObjectId
  readOneResponse: UserDbObject | null
  error?: string
}) {
  const debugSpy = jest.fn().mockImplementation()
  UserStore['logger'] = {
    debug: debugSpy,
  } as any
  const getByIdsSpy = jest.spyOn(UserStore as any, 'readOne').mockResolvedValue(readOneResponse)

  const promise = UserStore.getById(id)
  if (error) {
    await expect(promise).rejects.toThrow(Error(error))
  } else {
    await expect(promise).resolves.toEqual(readOneResponse)
  }

  expect(getByIdsSpy.mock.calls).toEqual([
    [
      {
        filter: {
          _id: id,
        },
      },
    ],
  ])
  expect(debugSpy.mock.calls).toEqual([[`Getting user by id "${id}"`]])
}

async function testGetByIds({
  ids,
  readResponse,
  debugEnabled,
  traceEnabled,
}: {
  ids: (string | ObjectId)[]
  readResponse: UserDbObject[]
  debugEnabled?: boolean
  traceEnabled?: boolean
}) {
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  UserStore['logger'] = {
    isDebugEnabled: jest.fn().mockReturnValue(debugEnabled),
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any
  const getByIdsSpy = jest.spyOn(UserStore as any, 'readMany').mockResolvedValue(readResponse)
  const filter: Filter<Document> = {
    _id: {
      $in: ids.map((id) => new ObjectId(id)),
    },
  }

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
        filter,
      },
    ],
  ])
  expect(debugSpy.mock.calls).toEqual(debugEnabled ? [[`Getting users with IDs "${JSON.stringify(ids)}"`]] : [])
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`getByIds filter: "${JSON.stringify(filter)}`]] : [])
}

async function testGetByName({
  name,
  options,
  readOneResponse,
  expected,
  traceEnabled,
}: {
  name: string
  options?: FindOptions
  readOneResponse: UserDbObject | null
  expected: UserDbObject | null
  traceEnabled?: boolean
}) {
  const filter: Filter<Document> = {
    name,
  }
  const readOneSpy = jest.spyOn(UserStore as any, 'readOne').mockResolvedValue(readOneResponse)
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  UserStore['logger'] = {
    debug: debugSpy,
    trace: traceSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
  } as any

  await expect(UserStore.getByName(name, options)).resolves.toEqual(expected)

  expect(readOneSpy.mock.calls).toEqual([
    [
      {
        filter,
        options,
      },
    ],
  ])
  expect(debugSpy.mock.calls).toEqual([[`Getting user with name "${name}"`]])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [[`getByName filter: "${JSON.stringify(filter)}"`], [`getByName options: "${JSON.stringify(options)}"`]]
      : []
  )
}

async function testGetByNames({
  name = 'user-name',
  options,
  readResponse,
  debugEnabled,
  traceEnabled,
}: {
  name?: string
  options?: FindOptions
  readResponse: UserDbObject[]
  debugEnabled?: boolean
  traceEnabled?: boolean
}) {
  const filter: Filter<Document> = {
    name: {
      $in: [name],
    },
  }
  const readSpy = jest.spyOn(UserStore as any, 'readMany').mockResolvedValue(readResponse)
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  UserStore['logger'] = {
    isDebugEnabled: jest.fn().mockReturnValue(debugEnabled),
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any

  await expect(UserStore.getByNames([name], options)).resolves.toEqual(
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
        filter,
        options,
      },
    ],
  ])
  expect(debugSpy.mock.calls).toEqual(debugEnabled ? [[`Getting users with names "["${name}"]"`]] : [])
  expect(traceSpy.mock.calls).toEqual(
    traceEnabled
      ? [[`getByNames filter: "${JSON.stringify(filter)}`], [`getByNames options: "${JSON.stringify(options)}`]]
      : []
  )
}

async function testValidate({
  username,
  user,
  match,
  expected,
  error,
  errorCalls = [],
  warnCalls = [],
  traceEnabled,
}: {
  username: string
  user: UserDbObject | null
  match?: boolean
  expected?: UserDbObject
  error?: string
  errorCalls?: string[][]
  warnCalls?: string[][]
  traceEnabled?: boolean
}) {
  const password = 'password'
  const expectedPassword = match === undefined ? '' : user?.password
  const readSpy = jest.spyOn(UserStore as any, 'readOne').mockResolvedValue(user)
  const matchSpy = jest.spyOn(PasswordHasher, 'match')
  if (match !== undefined) {
    matchSpy.mockResolvedValue(match)
  }
  const errorSpy = jest.fn().mockImplementation()
  const warnSpy = jest.fn().mockImplementation()
  const debugSpy = jest.fn().mockImplementation()
  const traceSpy = jest.fn().mockImplementation()
  UserStore['logger'] = {
    error: errorSpy,
    warn: warnSpy,
    debug: debugSpy,
    isTraceEnabled: jest.fn().mockReturnValue(traceEnabled),
    trace: traceSpy,
  } as any
  const filter: Filter<Document> = {
    name: username,
  }

  const promise = UserStore.validate(username, password)
  if (error) {
    await expect(promise).rejects.toThrow(error)
  } else {
    await expect(promise).resolves.toEqual(expected)
  }

  expect(readSpy.mock.calls).toEqual([
    [
      {
        filter,
      },
    ],
  ])
  expect(matchSpy.mock.calls).toEqual(match === undefined ? [] : [[password, expectedPassword]])
  expect(errorSpy.mock.calls).toEqual(errorCalls)
  expect(warnSpy.mock.calls).toEqual(warnCalls)
  expect(debugSpy.mock.calls).toEqual([[`Validating user with name "${username}"`]])
  expect(traceSpy.mock.calls).toEqual(traceEnabled ? [[`validate filter: "${JSON.stringify(filter)}`]] : [])
}
