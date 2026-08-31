import { Selector, t } from 'testcafe'

import E2eUtil from '../util/e2e-util'
import { HTML_IDS, ROUTES } from '@gwent-oss/constants'
import LoginForm from '../components/login-form'
import { PASSWORD } from '../util/e2e-constants'

export default class SignupPage {
  static elements = {
    switch: Selector(`#${HTML_IDS.LoginDialogModeSwitch}`),
    info: Selector(`#${HTML_IDS.LoginInfoButton}`),
  }

  static getUrl(): string {
    return E2eUtil.getUrl(ROUTES.Signup.path)
  }

  static async signUp({
    username,
    password = PASSWORD,
    submit = true,
    verify = true,
  }: {
    username: string
    password?: string
    submit?: boolean
    verify?: boolean
  }) {
    const currentUrl = await E2eUtil.getCurrentUrl()
    if (currentUrl !== SignupPage.getUrl()) {
      await t.click(LoginForm.elements.Mode)
    }
    if (verify) {
      await SignupPage.verifyNotLoggedIn({})
    }
    await LoginForm.fillIn({
      username,
      password,
      title: 'Welcome!',
      submitLabel: 'Sign Up',
      submit,
      verify,
    })
    if (verify) {
      await SignupPage.verifyLoggedIn()
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
    await E2eUtil.verifyCurrentUrl(SignupPage.getUrl())
    await LoginForm.verifyPresence({
      username,
      password,
      error,
      title: 'Welcome!',
    })
  }

  static async verifyLoggedIn() {
    await t.expect(E2eUtil.getCurrentUrl()).notEql(SignupPage.getUrl())
    await LoginForm.verifyAbscence()
  }

  static async switchToLogin() {
    await LoginForm.switchMode()
  }
}
