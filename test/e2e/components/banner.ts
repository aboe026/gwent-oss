import { Selector, t } from 'testcafe'

import { HTML_IDS } from '@gwent/constants'

const container = Selector(`#${HTML_IDS.Banner}`)

export default class Banner {
  static elements = {
    Container: container,
    Menu: container.find(`#${HTML_IDS.Hamburger}`),
    MenuProfile: Selector(`#${HTML_IDS.MenuItems}`).find(`#${HTML_IDS.MenuItemsProfile}`),
    Username: container.find(`#${HTML_IDS.BannerUsername}`),
  }

  static async verifyUsername(expected: string) {
    await t.expect(Banner.elements.Username.innerText).eql(expected)
  }

  static async goTo(menuElement: Selector) {
    await t.click(Banner.elements.Menu).click(menuElement)
  }
}
