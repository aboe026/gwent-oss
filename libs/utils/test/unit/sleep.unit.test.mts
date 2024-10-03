import sleep from '../../src/sleep.mjs'

describe('sleep', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })
  afterEach(() => {
    jest.useRealTimers()
  })
  it('calls setTimeout with correct number of milliseconds', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

    sleep(1)

    jest.runAllTimers()

    expect(setTimeoutSpy.mock.calls).toEqual([[expect.any(Function), 1000]])
  })
})
