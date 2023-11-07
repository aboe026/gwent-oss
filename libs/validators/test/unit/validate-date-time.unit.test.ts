import validateDateTime from '../../src/validate-date-time'

import { DATE_TIME_FORMAT } from '@gwent/constants'

describe('validate-date-time', () => {
  describe('validateDateTime', () => {
    it('throws error if empty string', () => {
      const dateTime = ''
      expect(() => validateDateTime(dateTime)).toThrow(
        `Invalid DateTime "${dateTime}", must be of format "${DATE_TIME_FORMAT}".`
      )
    })
    it('throws error if just date', () => {
      const dateTime = '2023-11-06'
      expect(() => validateDateTime(dateTime)).toThrow(
        `Invalid DateTime "${dateTime}", must be of format "${DATE_TIME_FORMAT}".`
      )
    })
    it('throws error if just time', () => {
      const dateTime = '19:26:02.987Z'
      expect(() => validateDateTime(dateTime)).toThrow(
        `Invalid DateTime "${dateTime}", must be of format "${DATE_TIME_FORMAT}".`
      )
    })
    it('returns dateTime as Date if format valid', () => {
      const dateTime = '2023-11-06T19:26:02.987Z'
      expect(validateDateTime(dateTime)).toEqual(new Date(dateTime))
    })
  })
})
