import { Selector, t } from 'testcafe'

import { HTML_IDS } from '@gwent-oss/constants'

const container = Selector(`#${HTML_IDS.LoginDialogContainer}`)

export default class LoginForm {
  static elements = {
    Container: container,
    Title: container.find(`#${HTML_IDS.LoginDialogTitle}`),
    Errors: container.find(`#${HTML_IDS.LoginDialogError}`),
    Mode: container.find(`#${HTML_IDS.LoginDialogModeSwitch}`),
    Password: container.find(`#${HTML_IDS.LoginDialogPassword}`),
    Submit: container.find(`#${HTML_IDS.LoginDialogSubmit}`),
    Username: container.find(`#${HTML_IDS.LoginDialogUsername}`),
  }

  static async fillIn({
    username,
    password = 'password',
    verify = true,
    title,
  }: {
    username: string
    password?: string
    verify?: boolean
    title?: string
  }) {
    if (verify) {
      await LoginForm.verifyPresence({
        title,
      })
    }
    await t.typeText(LoginForm.elements.Username, username)
    await t.typeText(LoginForm.elements.Password, password)
    await t.click(LoginForm.elements.Submit)
    if (verify) {
      await LoginForm.verifyAbscence()
    }
  }

  static async verifyPresence({
    username = '',
    password = '',
    error = '',
    title,
    usernameDisabled = false,
  }: {
    username?: string
    password?: string
    error?: string
    title?: string
    usernameDisabled?: boolean
  }) {
    await t.expect(LoginForm.elements.Container.exists).ok()
    await t.expect(LoginForm.elements.Container.visible).ok()
    await t.expect(LoginForm.elements.Title.exists).ok()
    await t.expect(LoginForm.elements.Title.visible).ok()
    await t.expect(LoginForm.elements.Username.exists).ok()
    await t.expect(LoginForm.elements.Username.visible).ok()
    await t.expect(LoginForm.elements.Username.hasAttribute('disabled')).eql(usernameDisabled)
    await t.expect(LoginForm.elements.Username.value).eql(username)
    await t.expect(LoginForm.elements.Password.exists).ok()
    await t.expect(LoginForm.elements.Password.visible).ok()
    await t.expect(LoginForm.elements.Password.value).eql(password)
    await t.expect(LoginForm.elements.Errors.exists).eql(!!error)
    if (title !== undefined) {
      await t.expect(LoginForm.elements.Title.innerText).eql(title)
    }
    if (error) {
      await t.expect(LoginForm.elements.Errors.visible).ok()
      await t.expect(LoginForm.elements.Errors.innerText).eql(error)
    }
  }

  static async verifyAbscence() {
    await t.expect(LoginForm.elements.Container.exists).notOk()
    await t.expect(LoginForm.elements.Username.exists).notOk()
    await t.expect(LoginForm.elements.Password.exists).notOk()
    await t.expect(LoginForm.elements.Errors.exists).notOk()
  }
}
