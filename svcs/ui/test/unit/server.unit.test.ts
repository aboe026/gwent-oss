jest.mock('express', () => {
  const mockedExpress = () => {
    return {
      get: jest.fn(),
      use: jest.fn(),
      listen: jest.fn().mockImplementation((options, callback) => {
        callback()
      }),
    }
  }
  Object.defineProperty(mockedExpress, 'static', { value: jest.fn() })
  return mockedExpress
})
jest.mock('log4js', () => ({
  configure: jest.fn().mockImplementation(),
  getLogger: jest.fn().mockReturnValue({
    info: jest.fn().mockImplementation(),
    debug: jest.fn().mockImplementation(),
    trace: jest.fn().mockImplementation(),
    error: jest.fn().mockImplementation(),
  }),
}))

describe('server', () => {
  it('exits with successful code if no error thrown', async () => {
    jest.mock('../../src/client-util', () => ({
      getDirectory: jest.fn().mockResolvedValue(undefined),
      setEnvVars: jest.fn().mockImplementation(),
    }))
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation()

    await jest.isolateModules(async () => {
      await import('../../src/server')
    })

    await sleep(0.25) // need explicit sleep here because isolateModules does not await execution :/
    expect(exitSpy.mock.calls).toEqual([])
  })
  it('exits with unsuccessful code if error thrown', async () => {
    jest.mock('../../src/client-util', () => ({
      getDirectory: jest.fn().mockRejectedValue(undefined),
    }))
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation()

    await jest.isolateModules(async () => {
      await import('../../src/server')
    })

    await sleep(0.25) // need explicit sleep here because isolateModules does not await thrown error :/
    expect(exitSpy.mock.calls).toEqual([[1]])
  })
})

async function sleep(seconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000)
  })
}
