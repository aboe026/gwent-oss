import { formatDay, formatTime } from '../../src/format-date'

describe('format-date', () => {
  describe('formatDay', () => {
    it('returns human readable day from iso string', () => {
      const iso = '2024-09-03T21:25:02.835Z'
      expect(formatDay(iso)).toEqual('September 3, 2024')
    })
  })
  describe('formatTime', () => {
    it('returns human readable time from iso string', () => {
      const iso = '2024-09-03T21:25:02.835Z'
      expect(formatTime(iso)).toEqual('2:25 PM')
    })
  })
})
