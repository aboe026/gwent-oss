import { Selector, t } from 'testcafe'

import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'

const container = Selector(`#${HTML_IDS.LoginForm}`)

export default class LoginPage {
  static elements = {
    Errors: container.find(`.${HTML_CLASSES.FormErrors}`),
    Form: container,
    Mode: container.find(`.${HTML_CLASSES.Secondary}`),
    Password: container.find(`#${HTML_IDS.LoginPassword}`),
    Submit: container.find(`.${HTML_CLASSES.Primary}`),
    Username: container.find(`#${HTML_IDS.LoginUsername}`),
  }

  static async signUp(username: string, password: string) {
    await t.click(LoginPage.elements.Mode)
    await LoginPage.login(username, password)
  }

  static async login(username: string, password: string) {
    await t
      .typeText(LoginPage.elements.Username, username)
      .typeText(LoginPage.elements.Password, password)
      .click(LoginPage.elements.Submit)
  }

  static async verifyError(expected: string) {
    await t.expect(LoginPage.elements.Errors.innerText).eql(expected)
  }
}
