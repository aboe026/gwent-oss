import { Selector, t } from 'testcafe'

import { HTML_IDS } from '@gwent/constants'

const container = Selector(`#${HTML_IDS.NotFound}`)

export default class NotFoundPage {
  static elements = {
    Container: container,
    HomeLink: container.find(`#${HTML_IDS.NotFoundHomeLink}`),
  }

  static async verifyContent(exists = true) {
    await t.expect(NotFoundPage.elements.Container.exists).eql(exists)
  }

  static async clickHomeLInk() {
    await t.click(NotFoundPage.elements.HomeLink)
  }
}
