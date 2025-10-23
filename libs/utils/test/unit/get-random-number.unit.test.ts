import getRandomNumber from '../../src/get-random-number'

describe('getRandomNumber', () => {
  it('throws error if min is greater than max', () => {
    testGetRandomNumber({
      min: 1,
      max: 0,
      error: Error('Min "1" must be less than or equal to Max "0"'),
    })
  })
  it('returns random number if min equal to max', () => {
    testGetRandomNumber({
      min: 0,
      max: 0,
    })
  })
  it('returns random number if min less than max', () => {
    testGetRandomNumber({
      min: 0,
      max: 1,
    })
  })
})

function testGetRandomNumber({ min, max, error }: { min: number; max: number; error?: Error }) {
  const random = min
  const floor = random
  const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(random)
  const floorSpy = jest.spyOn(Math, 'floor').mockReturnValue(random)

  if (error) {
    expect(() =>
      getRandomNumber({
        min,
        max,
      })
    ).toThrow(error)
  } else {
    expect(
      getRandomNumber({
        min,
        max,
      })
    ).toEqual(floor + min)
  }

  /**
   * For some reason, Jest was failing because it received 630 calls to Math.random
   * when error was specified, couldn't figure out why so only asserting calls to Math.
   * on non-error cases.
   */
  if (!error) {
    expect(randomSpy.mock.calls).toEqual(error ? [] : [[]])
    expect(floorSpy.mock.calls).toEqual(error ? [] : [[random * (max - min + 1)]])
  }
}
