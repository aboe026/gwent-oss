import { UserDbObject } from '../generated/database-typings'

/**
 * The context of an API connection.
 */
export interface Context {
  session?: {
    user?: UserDbObject
  }
}
