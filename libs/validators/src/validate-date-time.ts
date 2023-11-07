import moment from 'moment'

import { DATE_TIME_FORMAT } from '@gwent/constants'

/**
 * Returns a Date object if it matches the format "YYYY-MM-DDTHH:mm:ss.SSSZ"
 *
 * @param dateTime The string to turn into a Date if of the valid format
 * @returns The Date representation of the dateTime string
 * @throws Error if the string is not of the valid format "YYYY-MM-DDTHH:mm:ss.SSSZ"
 */
export default function validateDateTime(dateTime: string): Date {
  if (!moment(dateTime, DATE_TIME_FORMAT, true).isValid()) {
    throw Error(`Invalid DateTime "${dateTime}", must be of format "${DATE_TIME_FORMAT}".`)
  }
  return moment(dateTime, DATE_TIME_FORMAT).toDate()
}
