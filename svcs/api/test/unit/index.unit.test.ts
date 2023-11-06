import { sleep } from '@gwent/utils'

jest.mock('log4js', () => ({
  configure: jest.fn().mockImplementation(),
  getLogger: jest.fn().mockReturnValue({
    error: jest.fn().mockImplementation(),
  }),
}))

describe('index', () => {
  it('exits with successful code if no error thrown', async () => {
    jest.mock('../../src/api', () => ({
      run: jest.fn().mockResolvedValue(undefined),
    }))
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation()

    await jest.isolateModules(async () => {
      await import('../../src/index')
    })

    await sleep(0.25) // need explicit sleep here because isolateModules does not await :/
    expect(exitSpy.mock.calls).toEqual([])
  }, 10000) // Needed to pass in CI
  it('exits with unsuccessful code if error thrown', async () => {
    jest.mock('../../src/api', () => ({
      run: jest.fn().mockRejectedValue(undefined),
    }))
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation()

    await jest.isolateModules(async () => {
      await import('../../src/index')
    })

    await sleep(0.25) // need explicit sleep here because isolateModules does not await thrown error :/
    expect(exitSpy.mock.calls).toEqual([[1]])
  }, 10000) // Needed to pass in CI
})
