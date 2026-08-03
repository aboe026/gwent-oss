import { Selector, t } from 'testcafe'

import { HTML_IDS } from '@gwent-oss/constants'

const container = Selector(`#${HTML_IDS.BannerContainer}`)

export default class Banner {
  static elements = {
    Container: container,
    MainTitle: container.find(`#${HTML_IDS.BannerMainTitle}`),
    Menu: container.find(`#${HTML_IDS.BannerHamburger}`),
    MenuAbout: Selector(`#${HTML_IDS.BannerMenuItems}`).find(`#${HTML_IDS.BannerMenuItemsAbout}`),
    MenuDecks: Selector(`#${HTML_IDS.BannerMenuItems}`).find(`#${HTML_IDS.BannerMenuItemsDeck}`),
    MenuGames: Selector(`#${HTML_IDS.BannerMenuItems}`).find(`#${HTML_IDS.BannerMenuItemsGames}`),
    MenuProfile: Selector(`#${HTML_IDS.BannerMenuItems}`).find(`#${HTML_IDS.BannerMenuItemsProfile}`),
    MenuHome: Selector(`#${HTML_IDS.BannerMenuItems}`).find(`#${HTML_IDS.BannerMenutItemsHome}`),
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
    await t.expect(Banner.elements.MenuProfile.exists).eql(expectOpen)
    await t.expect(Banner.elements.MenuHome.exists).eql(expectOpen)
    if (expectOpen) {
      await t.expect(Banner.elements.MenuProfile.visible).ok().expect(Banner.elements.MenuHome.visible).ok()
    }
  }

  static async verify(username: string) {
    const loggedIn = username !== ''
    await t.expect(Banner.elements.Container.exists).ok()
    await t.expect(Banner.elements.Container.visible).ok()
    await t.expect(Banner.elements.MainTitle.exists).ok()
    await t.expect(Banner.elements.MainTitle.visible).ok()
    await t.expect(Banner.elements.Menu.exists).eql(loggedIn)
    await t.expect(Banner.elements.Username.exists).ok()
    await t.expect(Banner.elements.Username.visible).eql(loggedIn)
    await t.expect(Banner.elements.Username.innerText).eql(username)
    if (loggedIn) {
      await t.expect(Banner.elements.Menu.visible).ok()
    }
  }
}
