import { Selector, t } from 'testcafe'

import E2eUtil from '../util/e2e-util'
import { HTML_IDS } from '@gwent/constants'

export default class HomePage {
  static elements = {
    Welcome: Selector(`#${HTML_IDS.HomeGreeting}`),
    Options: Selector(`#${HTML_IDS.HomeOptions}`),
    CreateDeck: Selector(`#${HTML_IDS.HomeOptionsCreateDeck}`),
    ViewDecks: Selector(`#${HTML_IDS.HomeOptionsViewDecks}`),
    CreateGame: Selector(`#${HTML_IDS.HomeOptionsCreateGame}`),
    ViewGames: Selector(`#${HTML_IDS.HomeOptionsViewGames}`),
    ViewProfile: Selector(`#${HTML_IDS.HomeOptionsViewProfile}`),
  }

  static getUrl(): string {
    return E2eUtil.getUrl('')
  }

  static async verify(username: string) {
    await t.expect(HomePage.elements.Welcome.exists).eql(!!username)
    await t.expect(HomePage.elements.Options.exists).eql(!!username)
    await t.expect(HomePage.elements.CreateDeck.exists).eql(!!username)
    await t.expect(HomePage.elements.ViewDecks.exists).eql(!!username)
    await t.expect(HomePage.elements.ViewProfile.exists).eql(!!username)
    if (!!username) {
      await t.expect(HomePage.elements.Welcome.visible).ok()
      await t.expect(HomePage.elements.Welcome.innerText).eql(`Welcome ${username}!`)
      await t.expect(HomePage.elements.Options.visible).ok()
      await t.expect(HomePage.elements.CreateDeck.visible).ok()
      await t.expect(HomePage.elements.ViewDecks.visible).ok()
      await t.expect(HomePage.elements.ViewProfile.visible).ok()
    }
  }

  static async goTo(homeOption: Selector) {
    await t.click(homeOption)
  }
}
