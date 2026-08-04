import { sleep } from '@gwent-oss/utils'

jest.mock('log4js', () => ({
  configure: jest.fn().mockImplementation(),
  getLogger: jest.fn().mockReturnValue({
    fatal: jest.fn().mockImplementation(),
  }),
}))

describe('index', () => {
  it('exits with successful code if no error thrown', async () => {
    jest.mock('../../src/server', () => ({
      run: jest.fn().mockResolvedValue(undefined),
    }))
    process.exitCode = 0

    await jest.isolateModules(async () => {
      require('../../src/index') // eslint-disable-line @typescript-eslint/no-require-imports
    })

    await sleep(0.25) // need explicit sleep here because isolateModules does not await :/
    expect(process.exitCode).toEqual(0)
  }, 10000) // Needed to pass in CI
  it('exits with unsuccessful code if error thrown', async () => {
    jest.mock('../../src/server', () => ({
      run: jest.fn().mockRejectedValue(undefined),
    }))
    process.exitCode = 0

    await jest.isolateModules(() => {
      require('../../src/index') // eslint-disable-line @typescript-eslint/no-require-imports
    })

    await sleep(0.25) // need explicit sleep here because isolateModules does not await thrown error :/
    expect(process.exitCode).toEqual(1)
  }, 10000) // Needed to pass in CI
})
