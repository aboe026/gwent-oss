import { Selector, t } from 'testcafe'

import { HTML_IDS } from '@gwent/constants'

const container = Selector(`#${HTML_IDS.LogoutForm}`)

export default class LogoutPage {
  static elements = {
    Container: container,
    Message: container.find(`#${HTML_IDS.LogoutMessage}`),
    Login: container.find(`#${HTML_IDS.LogoutLogin}`),
  }

  static async clickLogin() {
    await t.click(LogoutPage.elements.Login)
  }

  static async verifyContent() {
    await t
      .expect(LogoutPage.elements.Container.exists)
      .ok()
      .expect(LogoutPage.elements.Container.visible)
      .ok()
      .expect(LogoutPage.elements.Message.exists)
      .ok()
      .expect(LogoutPage.elements.Message.visible)
      .ok()
      .expect(LogoutPage.elements.Message.innerText)
      .eql('Successfully logged out!')
  }
}
