import { UserDbObject } from '../generated/database-typings'

export interface Context {
  session?: {
    user?: UserDbObject
  }
}
