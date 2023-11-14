import { Selector, t } from 'testcafe'

import E2eUtil from '../util/e2e-util'
import { HTML_CLASSES, HTML_IDS, ROUTES } from '@gwent/constants'

const container = Selector(`#${HTML_IDS.LoginForm}`)

export default class LoginPage {
  static elements = {
    Container: container,
    Errors: container.find(`.${HTML_CLASSES.FormErrors}`),
    Mode: container.find(`.${HTML_CLASSES.Secondary}`),
    Password: container.find(`#${HTML_IDS.LoginPassword}`),
    Submit: container.find(`.${HTML_CLASSES.Primary}`),
    Username: container.find(`#${HTML_IDS.LoginUsername}`),
  }

  static async signUp({
    username,
    password = 'password',
    verify = true,
  }: {
    username: string
    password?: string
    verify?: boolean
  }) {
    await t.click(LoginPage.elements.Mode)
    await LoginPage.login({
      username,
      password,
      verify,
    })
  }

  static async login({
    username,
    password = 'password',
    verify = true,
  }: {
    username: string
    password: string
    verify?: boolean
  }) {
    if (verify) {
      await LoginPage.verifyNotLoggedIn({})
    }
    await t
      .typeText(LoginPage.elements.Username, username)
      .typeText(LoginPage.elements.Password, password)
      .click(LoginPage.elements.Submit)
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
    await E2eUtil.verifyCurrentUrl(ROUTES.Login.path)
    await t
      .expect(LoginPage.elements.Container.exists)
      .ok()
      .expect(LoginPage.elements.Container.visible)
      .ok()
      .expect(LoginPage.elements.Username.exists)
      .ok()
      .expect(LoginPage.elements.Username.visible)
      .ok()
      .expect(LoginPage.elements.Username.value)
      .eql(username)
      .expect(LoginPage.elements.Password.exists)
      .ok()
      .expect(LoginPage.elements.Password.visible)
      .ok()
      .expect(LoginPage.elements.Password.value)
      .eql(password)
      .expect(LoginPage.elements.Errors.exists)
      .eql(!!error)
    if (error) {
      await t.expect(LoginPage.elements.Errors.visible).ok()
      await t.expect(LoginPage.elements.Errors.innerText).eql(error)
    }
  }

  static async verifyLoggedIn() {
    await t
      .expect(E2eUtil.getCurrentUrl())
      .notEql(ROUTES.Login.path)
      .expect(LoginPage.elements.Container.exists)
      .notOk()
      .expect(LoginPage.elements.Username.exists)
      .notOk()
      .expect(LoginPage.elements.Password.exists)
      .notOk()
      .expect(LoginPage.elements.Errors.exists)
      .notOk()
  }
}
