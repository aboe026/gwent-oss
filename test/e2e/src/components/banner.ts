import { Selector, t } from 'testcafe'

import { HTML_IDS } from '@gwent/constants'

const container = Selector(`#${HTML_IDS.Banner}`)

export default class Banner {
  static elements = {
    Container: container,
    MainTitle: container.find(`#${HTML_IDS.MainTitle}`),
    Menu: container.find(`#${HTML_IDS.Hamburger}`),
    MenuProfile: Selector(`#${HTML_IDS.MenuItems}`).find(`#${HTML_IDS.MenuItemsProfile}`),
    MenuHome: Selector(`#${HTML_IDS.MenuItems}`).find(`#${HTML_IDS.MenutItemsHome}`),
    Username: container.find(`#${HTML_IDS.BannerUsername}`),
  }

  static async clickMainTitle() {
    await t.click(Banner.elements.MainTitle)
  }

  static async clickUsername() {
    await t.click(Banner.elements.Username)
  }

  static async goTo(menuElement: Selector) {
    await Banner.verifyMenu()
    await t.click(Banner.elements.Menu)
    await Banner.verifyMenu(true)
    await t.click(menuElement)
    await Banner.verifyMenu()
  }

  static async verifyUsername(expected: string) {
    await t.expect(Banner.elements.Username.innerText).eql(expected)
  }

  static async verifyMenu(expectOpen = false) {
    await t
      .expect(Banner.elements.MenuProfile.exists)
      .eql(expectOpen)
      .expect(Banner.elements.MenuHome.exists)
      .eql(expectOpen)
    if (expectOpen) {
      await t.expect(Banner.elements.MenuProfile.visible).ok().expect(Banner.elements.MenuHome.visible).ok()
    }
  }

  static async verifyContent(username: string) {
    const loggedIn = username !== ''
    await t
      .expect(Banner.elements.Container.exists)
      .ok()
      .expect(Banner.elements.Container.visible)
      .ok()
      .expect(Banner.elements.MainTitle.exists)
      .ok()
      .expect(Banner.elements.MainTitle.visible)
      .ok()
      .expect(Banner.elements.Menu.exists)
      .eql(loggedIn)
      .expect(Banner.elements.Username.exists)
      .ok()
      .expect(Banner.elements.Username.visible)
      .eql(loggedIn)
      .expect(Banner.elements.Username.innerText)
      .eql(username)
    if (loggedIn) {
      await t.expect(Banner.elements.Menu.visible).ok()
    }
  }
}
