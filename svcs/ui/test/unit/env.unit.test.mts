import path from 'path'

import env from '../../src/env.mjs'
import * as getEnv from '@gwent/env'

describe('env', () => {
  it('sets dotEnvFilePath to empty string if NODE_ENV is production', () => {
    const getEnvSpy = jest.spyOn(getEnv, 'default')
    process.env.NODE_ENV = getEnv.NODE_ENV.Prod

    env()

    expect(getEnvSpy.mock.calls).toEqual([
      [
        {
          dotEnvFilePath: '',
          specs: expect.any(Object),
        },
      ],
    ])
  })
  it('sets dotEnvFilePath to env file if NODE_ENV is development', () => {
    const getEnvSpy = jest.spyOn(getEnv, 'default')
    process.env.NODE_ENV = getEnv.NODE_ENV.Dev

    env()

    expect(getEnvSpy.mock.calls).toEqual([
      [
        {
          dotEnvFilePath: path.join(__dirname, '..', '..', '.env'),
          specs: expect.any(Object),
        },
      ],
    ])
  })
})
