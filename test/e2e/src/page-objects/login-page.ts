import { t } from 'testcafe'

import E2eUtil from '../util/e2e-util'
import LoginForm from '../components/login-form'
import { ROUTES } from '@gwent/constants'

export default class LoginPage {
  static getUrl(): string {
    return E2eUtil.getUrl(ROUTES.Login.path)
  }

  static async login({
    username,
    password = 'password',
    verify = true,
  }: {
    username: string
    password?: string
    verify?: boolean
  }) {
    if (verify) {
      await LoginPage.verifyNotLoggedIn({})
    }
    await LoginForm.fillIn({
      username,
      password,
      title: 'Welcome Back!',
      verify,
    })
    if (verify) {
      await LoginPage.verifyLoggedIn()
    }
  }

  static async verifyNotLoggedIn({
    username = '',
    password = '',
    error = '',
  }: {
    username?: string
    password?: string
    error?: string
  }) {
    await E2eUtil.verifyCurrentUrl(LoginPage.getUrl())
    await LoginForm.verifyPresence({
      username,
      password,
      error,
      title: 'Welcome Back!',
    })
  }

  static async verifyLoggedIn() {
    await t.expect(E2eUtil.getCurrentUrl()).notEql(LoginPage.getUrl())
    await LoginForm.verifyAbscence()
  }
}
