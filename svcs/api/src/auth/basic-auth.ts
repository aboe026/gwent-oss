import basicAuth from 'basic-auth'
import { NextFunction, Response } from 'express'

import UserStore from '../database/user-store'

/**
 * A class for handling Basic Authentication
 */
export default class BasicAuth {
  /**
   * Attempt to authenticate a user with Basic Auth
   *
   * @param req The incoming request
   * @param res The outgoing response
   * @param next A method to trigger then next middleware in the chain
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async authenticate(req: any, res: Response, next?: NextFunction) {
    const basicUser = basicAuth(req)
    if (basicUser) {
      const user = await UserStore.validateUser(basicUser.name, basicUser.pass)
      if (req?.session) {
        req.session.user = user
      } else {
        req.session = {
          user,
        }
      }
    }
    if (next) {
      next()
    }
  }
}
