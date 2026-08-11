import { Selector, t } from 'testcafe'

import { HTML_IDS } from '@gwent-oss/constants'
import { PASSWORD } from '../util/e2e-constants'

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
    UsernameAvailableContainer: container.find(`#${HTML_IDS.LoginUsernameAvailableContainer}`),
    UsernameShort: container.find(`#${HTML_IDS.LoginUsernameShort}`),
    UsernameLong: container.find(`#${HTML_IDS.LoginUsernameLong}`),
    UsernameSpaces: container.find(`#${HTML_IDS.LoginUsernameSpaces}`),
    UsernameSpecials: container.find(`#${HTML_IDS.LoginUsernameSpecials}`),
    PasswordShort: container.find(`#${HTML_IDS.LoginPasswordShort}`),
    PasswordLong: container.find(`#${HTML_IDS.LoginPasswordLong}`),
    PasswordSpaces: container.find(`#${HTML_IDS.LoginPasswordSpaces}`),
    PasswordNoSpecials: container.find(`#${HTML_IDS.LoginPasswordNoSpecials}`),
    PasswordBadSpecials: container.find(`#${HTML_IDS.LoginPasswordBadSpecials}`),
    PasswordUppercase: container.find(`#${HTML_IDS.LoginPasswordUppercase}`),
    PasswordLowercase: container.find(`#${HTML_IDS.LoginPasswordLowercase}`),
    PasswordNumbers: container.find(`#${HTML_IDS.LoginPasswordNumbers}`),
  }

  static async fillIn({
    username,
    initialUsername,
    password = PASSWORD,
    verify = true,
    title,
    submit = true,
    submitLabel,
  }: {
    username: string
    initialUsername?: string
    password?: string
    verify?: boolean
    title?: string
    submit?: boolean
    submitLabel?: string
  }) {
    if (verify) {
      await LoginForm.verifyPresence({
        title,
        submitLabel,
        username: initialUsername,
      })
    }
    if (initialUsername !== username) {
      await t.typeText(LoginForm.elements.Username, username, {
        replace: Boolean(initialUsername),
      })
    }
    await t.typeText(LoginForm.elements.Password, password)
    if (verify) {
      await LoginForm.verifyUsernameAvailable(title === 'Welcome Back!' ? undefined : true)
      await LoginForm.verifyUsernameErrors({})
      await LoginForm.verifyPasswordErrors({})
    }
    if (submit) {
      await t.click(LoginForm.elements.Submit)
    }
    if (verify) {
      await LoginForm.verifyAbscence()
    }
  }

  static async switchMode() {
    await t.click(LoginForm.elements.Mode)
  }

  static async verifyPresence({
    username = '',
    password = '',
    error = '',
    title,
    submitLabel,
    usernameDisabled = false,
  }: {
    username?: string
    password?: string
    error?: string
    title?: string
    submitLabel?: string
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
    if (submitLabel !== undefined) {
      await t.expect(LoginForm.elements.Submit.innerText).eql(submitLabel)
    }
    if (error) {
      await t.expect(LoginForm.elements.Errors.visible).ok()
      await t.expect(LoginForm.elements.Errors.innerText).eql(error)
    }
  }

  static async verifyUsernameAvailable(available?: boolean) {
    await t.expect(LoginForm.elements.UsernameAvailableContainer.exists).eql(available !== undefined)
    if (available !== undefined) {
      await t.expect(LoginForm.elements.UsernameAvailableContainer.visible).eql(true)
      await t
        .expect(LoginForm.elements.UsernameAvailableContainer.innerText)
        .eql(available ? 'Available to use' : 'Already taken')
    }
  }

  static async verifyUsernameErrors({
    tooShort = false,
    tooLong = false,
    spaces = false,
    badSpecials = new Set(),
  }: {
    tooShort?: boolean
    tooLong?: boolean
    spaces?: boolean
    badSpecials?: Set<string>
  }) {
    await t.expect(LoginForm.elements.UsernameShort.exists).eql(tooShort)
    if (tooShort) {
      await t.expect(LoginForm.elements.UsernameShort.visible).eql(true)
    }

    await t.expect(LoginForm.elements.UsernameLong.exists).eql(tooLong)
    if (tooLong) {
      await t.expect(LoginForm.elements.UsernameLong.visible).eql(true)
    }

    await t.expect(LoginForm.elements.UsernameSpaces.exists).eql(spaces)
    if (spaces) {
      await t.expect(LoginForm.elements.UsernameSpaces.visible).eql(true)
    }

    await t.expect(LoginForm.elements.UsernameSpecials.exists).eql(badSpecials.size > 0)
    if (badSpecials.size > 0) {
      await t.expect(LoginForm.elements.UsernameSpecials.visible).eql(true)
      await t
        .expect(LoginForm.elements.UsernameSpecials.innerText)
        .eql(`Invalid character${badSpecials.size > 1 ? 's' : ''}: ${[...badSpecials].join('')}`)
    }
  }

  static async verifyPasswordErrors({
    tooShort = false,
    tooLong = false,
    spaces = false,
    numbers = false,
    specials = false,
    uppercase = false,
    lowercase = false,
    badSpecials = new Set(),
  }: {
    tooShort?: boolean
    tooLong?: boolean
    spaces?: boolean
    numbers?: boolean
    specials?: boolean
    uppercase?: boolean
    lowercase?: boolean
    badSpecials?: Set<string>
  }) {
    await t.expect(LoginForm.elements.PasswordShort.exists).eql(tooShort)
    if (tooShort) {
      await t.expect(LoginForm.elements.PasswordShort.visible).eql(true)
    }

    await t.expect(LoginForm.elements.PasswordLong.exists).eql(tooLong)
    if (tooLong) {
      await t.expect(LoginForm.elements.PasswordLong.visible).eql(true)
    }

    await t.expect(LoginForm.elements.PasswordSpaces.exists).eql(spaces)
    if (spaces) {
      await t.expect(LoginForm.elements.PasswordSpaces.visible).eql(true)
    }

    await t.expect(LoginForm.elements.PasswordNoSpecials.exists).eql(specials)
    if (specials) {
      await t.expect(LoginForm.elements.PasswordNoSpecials.visible).eql(true)
    }

    await t.expect(LoginForm.elements.PasswordNumbers.exists).eql(numbers)
    if (numbers) {
      await t.expect(LoginForm.elements.PasswordNumbers.visible).eql(true)
    }

    await t.expect(LoginForm.elements.PasswordUppercase.exists).eql(uppercase)
    if (uppercase) {
      await t.expect(LoginForm.elements.PasswordUppercase.visible).eql(true)
    }

    await t.expect(LoginForm.elements.PasswordLowercase.exists).eql(lowercase)
    if (lowercase) {
      await t.expect(LoginForm.elements.PasswordLowercase.visible).eql(true)
    }

    await t.expect(LoginForm.elements.PasswordBadSpecials.exists).eql(badSpecials.size > 0)
    if (badSpecials.size > 0) {
      await t.expect(LoginForm.elements.PasswordBadSpecials.visible).eql(true)
      await t
        .expect(LoginForm.elements.PasswordBadSpecials.innerText)
        .eql(`Invalid character${badSpecials.size > 1 ? 's' : ''}: ${[...badSpecials].join('')}`)
    }
  }

  static async verifySubmit({ enabled = true, title }: { enabled: boolean; title?: string }) {
    await t.expect(LoginForm.elements.Submit.hasAttribute('disabled')).eql(!enabled)
    if (title) {
      await t.expect(LoginForm.elements.Submit.getAttribute('title')).eql(title)
    }
  }

  static async verifyAbscence() {
    await t.expect(LoginForm.elements.Container.exists).notOk()
    await t.expect(LoginForm.elements.Username.exists).notOk()
    await t.expect(LoginForm.elements.Password.exists).notOk()
    await t.expect(LoginForm.elements.Errors.exists).notOk()
  }
}
