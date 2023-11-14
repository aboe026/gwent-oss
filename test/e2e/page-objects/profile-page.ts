import { Selector, t } from 'testcafe'

import E2eUtil from '../util/e2e-util'
import { HTML_IDS, ROUTES } from '@gwent/constants'

const container = Selector(`#${HTML_IDS.Profile}`)

export default class ProfilePage {
  static elements = {
    Container: container,
    Logout: container.find(`#${HTML_IDS.ProfileLogout}`),
    Username: container.find(`#${HTML_IDS.ProfileUsername}`),
    Created: container.find(`#${HTML_IDS.ProfileCreated}`),
  }

  static async verifyUsername(expected: string) {
    await t.expect(ProfilePage.elements.Username.innerText).eql(expected)
  }

  static async verifyCreated(expected: Date) {
    await t.expect(ProfilePage.elements.Created.innerText).eql(
      expected.toLocaleDateString('en-us', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    )
  }

  static async verifyLogout() {
    await t.expect(ProfilePage.elements.Logout.exists).ok().expect(ProfilePage.elements.Logout.visible).ok()
  }

  static async verifyContent({ username, created = new Date() }: { username: string; created?: Date }) {
    await E2eUtil.verifyCurrentUrl(ROUTES.Profile.path)
    await ProfilePage.verifyUsername(username)
    await ProfilePage.verifyCreated(created)
    await ProfilePage.verifyLogout()
  }

  static async logout() {
    await t.click(ProfilePage.elements.Logout)
  }
}
