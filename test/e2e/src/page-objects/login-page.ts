import { Selector, t } from 'testcafe'

import E2eUtil from '../util/e2e-util'
import { HTML_IDS, ROUTES } from '@gwent-oss/constants'
import LoginForm from '../components/login-form'
import { PASSWORD } from '../util/e2e-constants'
import SignupPage from './signup-page'

export default class LoginPage {
  static elements = {
    switch: Selector(`#${HTML_IDS.LoginDialogModeSwitch}`),
  }

  static getUrl(): string {
    return E2eUtil.getUrl(ROUTES.Login.path)
  }

  static async login({
    username,
    initialUsername,
    password = PASSWORD,
    navigateToLogin = true,
    verify = true,
  }: {
    username: string
    initialUsername?: string
    password?: string
    navigateToLogin?: boolean
    verify?: boolean
  }) {
    const currentUrl = await E2eUtil.getCurrentUrl()
    if (navigateToLogin && currentUrl !== LoginPage.getUrl()) {
      if (currentUrl === SignupPage.getUrl()) {
        await SignupPage.switchToLogin()
      } else {
        await E2eUtil.goTo(LoginPage.getUrl())
      }
    }
    if (verify) {
      await LoginPage.verifyNotLoggedIn({
        username: initialUsername,
      })
    }
    await LoginForm.fillIn({
      username,
      initialUsername: initialUsername,
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

  static async switchToSignup() {
    await LoginForm.switchMode()
  }
}
