import dotenv from 'dotenv'
import * as envalid from 'envalid'

import getEnv, { bool, email, host, json, num, port, str, url } from '../../src/env.mjs'

jest.mock('envalid', () => {
  return {
    __esModule: true,
    ...jest.requireActual('envalid'),
  }
})

describe('env', () => {
  describe('getEnv', () => {
    describe('config path', () => {
      it('uses dotEnvFilePath if specified', () => {
        try {
          process.env.DOT_ENV_FILE_PATH = ''
          const configSpy = jest.spyOn(dotenv, 'config')
          const customPath = 'custom/file/path'
          getEnv({
            dotEnvFilePath: customPath,
            specs: {},
          })
          expect(configSpy.mock.calls).toEqual([
            [
              {
                path: customPath,
              },
            ],
          ])
        } finally {
          delete process.env.DOT_ENV_FILE_PATH
        }
      })
      it('uses DOT_ENV_FILE_PATH if no dotEnvFilePath specified', () => {
        try {
          const customPath = 'env/var/file/path'
          process.env.DOT_ENV_FILE_PATH = customPath
          const configSpy = jest.spyOn(dotenv, 'config')
          getEnv({
            specs: {},
          })
          expect(configSpy.mock.calls).toEqual([
            [
              {
                path: customPath,
              },
            ],
          ])
        } finally {
          delete process.env.DOT_ENV_FILE_PATH
        }
      })
      it('uses DOT_ENV_FILE_PATH even if dotEnvFilePath specified', () => {
        try {
          const customPath = 'env/var/file/path'
          process.env.DOT_ENV_FILE_PATH = customPath
          const configSpy = jest.spyOn(dotenv, 'config')
          getEnv({
            dotEnvFilePath: 'should-get-overwritten',
            specs: {},
          })
          expect(configSpy.mock.calls).toEqual([
            [
              {
                path: customPath,
              },
            ],
          ])
        } finally {
          delete process.env.DOT_ENV_FILE_PATH
        }
      })
      it('uses default file if nothing else specified', () => {
        const configSpy = jest.spyOn(dotenv, 'config')
        getEnv({
          specs: {},
        })
        expect(configSpy.mock.calls).toEqual([
          [
            {
              path: '.env',
            },
          ],
        ])
      })
      it('ignores dotEnvFilePath if undefined', () => {
        try {
          const customPath = 'env/var/file/path'
          process.env.DOT_ENV_FILE_PATH = customPath
          const configSpy = jest.spyOn(dotenv, 'config')
          getEnv({
            dotEnvFilePath: undefined,
            specs: {},
          })
          expect(configSpy.mock.calls).toEqual([
            [
              {
                path: customPath,
              },
            ],
          ])
        } finally {
          delete process.env.DOT_ENV_FILE_PATH
        }
      })
      it('ignores dotEnvFilePath if empty string', () => {
        try {
          const customPath = 'env/var/file/path'
          process.env.DOT_ENV_FILE_PATH = customPath
          const configSpy = jest.spyOn(dotenv, 'config')
          getEnv({
            dotEnvFilePath: '',
            specs: {},
          })
          expect(configSpy.mock.calls).toEqual([
            [
              {
                path: customPath,
              },
            ],
          ])
        } finally {
          delete process.env.DOT_ENV_FILE_PATH
        }
      })
      it('ignores DOT_ENV_FILE_PATH if empty string', () => {
        try {
          process.env.DOT_ENV_FILE_PATH = ''
          const configSpy = jest.spyOn(dotenv, 'config')
          getEnv({
            specs: {},
          })
          expect(configSpy.mock.calls).toEqual([
            [
              {
                path: '.env',
              },
            ],
          ])
        } finally {
          delete process.env.DOT_ENV_FILE_PATH
        }
      })
    })
    describe('environment', () => {
      it('ignores environment variables if environment option passed', () => {
        try {
          process.env.HELLO = 'world'
          const override = 'earth'
          const cleanEnvSpy = jest.spyOn(envalid, 'cleanEnv').mockImplementation()
          getEnv({
            specs: {
              HELLO: str({}),
            },
            environment: {
              HELLO: override,
            },
          })
          expect(cleanEnvSpy.mock.calls).toMatchObject([
            [
              {
                HELLO: override,
              },
              {
                HELLO: { _parse: expect.any(Function) },
              },
              undefined,
            ],
          ])
        } finally {
          delete process.env.HELLO
        }
      })
      it('uses environment variables if no environment option passed', () => {
        try {
          const value = 'world'
          process.env.HELLO = value
          const cleanEnvSpy = jest.spyOn(envalid, 'cleanEnv').mockImplementation()
          getEnv({
            specs: {
              HELLO: str({}),
            },
          })
          expect(cleanEnvSpy.mock.calls).toMatchObject([
            [
              {
                HELLO: value,
              },
              {
                HELLO: { _parse: expect.any(Function) },
              },
              undefined,
            ],
          ])
        } finally {
          delete process.env.HELLO
        }
      })
    })
    describe('types', () => {
      it('returns boolean type for bool', () => {
        const value = true
        const env = getEnv({
          specs: {
            HELLO: bool({}),
          },
          environment: {
            HELLO: value.toString(),
          },
        })
        expect(env).toHaveProperty('HELLO', value)
      })
      it('returns string type for email', () => {
        const value = 'james.bond@mi6.gov'
        const env = getEnv({
          specs: {
            HELLO: email({}),
          },
          environment: {
            HELLO: value,
          },
        })
        expect(env).toHaveProperty('HELLO', value)
      })
      it('returns string type for host', () => {
        const value = '1.2.3.4'
        const env = getEnv({
          specs: {
            HELLO: host({}),
          },
          environment: {
            HELLO: value,
          },
        })
        expect(env).toHaveProperty('HELLO', value)
      })
      it('returns json type for json', () => {
        const value = {
          foo: 'bar',
        }
        const env = getEnv({
          specs: {
            HELLO: json({}),
          },
          environment: {
            HELLO: JSON.stringify(value),
          },
        })
        expect(env).toHaveProperty('HELLO', value)
      })
      it('returns number type for num', () => {
        const value = 3
        const env = getEnv({
          specs: {
            HELLO: num({}),
          },
          environment: {
            HELLO: value.toString(),
          },
        })
        expect(env).toHaveProperty('HELLO', value)
      })
      it('returns number type for port', () => {
        const value = 8080
        const env = getEnv({
          specs: {
            HELLO: port({}),
          },
          environment: {
            HELLO: value.toString(),
          },
        })
        expect(env).toHaveProperty('HELLO', value)
      })
      it('returns string type for str', () => {
        const value = 'world'
        const env = getEnv({
          specs: {
            HELLO: str({}),
          },
          environment: {
            HELLO: value,
          },
        })
        expect(env).toHaveProperty('HELLO', value)
      })
      it('returns string type for url', () => {
        const value = 'https://domain.com'
        const env = getEnv({
          specs: {
            HELLO: url({}),
          },
          environment: {
            HELLO: value,
          },
        })
        expect(env).toHaveProperty('HELLO', value)
      })
    })
  })
})
