import path from 'path'

describe('env', () => {
  it('sets dotEnvFilePath to empty string if NODE_ENV is production', () => {
    const getEnv = require('@witcher-3-gwent/env') // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
    const getEnvSpy = jest.spyOn(getEnv, 'default')
    process.env.NODE_ENV = getEnv.NODE_ENV.Prod

    require('../../src/env')

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
    const getEnv = require('@witcher-3-gwent/env') // eslint-disable-line @typescript-eslint/no-unused-vars,@typescript-eslint/no-var-requires
    const getEnvSpy = jest.spyOn(getEnv, 'default')
    process.env.NODE_ENV = getEnv.NODE_ENV.Dev

    require('../../src/env')

    expect(getEnvSpy.mock.calls).toEqual([
      [
        {
          dotEnvFilePath: path.join(__dirname, '../../.env'),
          specs: expect.any(Object),
        },
      ],
    ])
  })
})
