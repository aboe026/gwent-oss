import basicAuth from 'basic-auth'
import { NextFunction, Response } from 'express'

import UserStore from '../database/stores/user-store.mjs'

/**
 * A class for handling Basic Authentication.
 */
export default class BasicAuth {
  /**
   * Attempt to authenticate a user with Basic Auth.
   *
   * @param req The incoming request.
   * @param res The outgoing response.
   * @param next A method to trigger the next middleware in the chain.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static async authenticate(req: any, res: Response, next?: NextFunction) {
    const basicUser = basicAuth(req)
    if (basicUser) {
      const user = await UserStore.validate(basicUser.name, basicUser.pass)
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
