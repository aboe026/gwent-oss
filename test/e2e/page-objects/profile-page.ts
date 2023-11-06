import { Selector, t } from 'testcafe'

import { HTML_IDS } from '@gwent/constants'

const container = Selector(`#${HTML_IDS.Profile}`)

export default class ProfilePage {
  static elements = {
    Container: container,
    Logout: container.find(`#${HTML_IDS.ProfileLogout}`),
    LogoutError: container.find(`#${HTML_IDS.ProfileLogoutError}`),
    Username: container.find(`#${HTML_IDS.ProfileUsername}`),
  }

  static async verifyUsername(expected: string) {
    await t.expect(ProfilePage.elements.Username.innerText).eql(expected)
  }

  static async logout() {
    await t.click(ProfilePage.elements.Logout)
  }
}
