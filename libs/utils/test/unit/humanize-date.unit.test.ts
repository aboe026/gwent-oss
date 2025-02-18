import { humanizeDay, humanizeTime } from '../../src/humanize-date'

describe('format-date', () => {
  describe('humanizeDay', () => {
    it('returns human readable day from iso string', () => {
      const iso = '2024-09-03T21:25:02.835Z'
      expect(humanizeDay(iso)).toEqual('September 3, 2024')
    })
  })
  describe('humanizeTime', () => {
    it('returns human readable time from iso string', () => {
      const iso = '2024-09-03T21:25:02.835Z'
      // needed to stub/spy out this method because otherwise
      // this test fails in CI due to (seemingly) timezone differences
      // (i.e. it fails with "9:25 PM" instead of "2:25 PM")
      const toLocaleTimeStringSpy = jest.spyOn(Date.prototype, 'toLocaleTimeString').mockReturnValue('2:25 PM')

      expect(humanizeTime(iso)).toEqual('2:25 PM')

      expect(toLocaleTimeStringSpy.mock.calls).toEqual([
        [
          'en-us',
          {
            hour: 'numeric',
            minute: 'numeric',
            hour12: true,
          },
        ],
      ])
    })
  })
})
