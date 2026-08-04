import { Selector, t } from 'testcafe'

import { HTML_IDS } from '@gwent-oss/constants'

const container = Selector(`#${HTML_IDS.NotFoundContainer}`)

export default class NotFoundPage {
  static elements = {
    Container: container,
    HomeLink: container.find(`#${HTML_IDS.NotFoundHomeLink}`),
  }

  static async verify(exists = true) {
    await t.expect(NotFoundPage.elements.Container.exists).eql(exists)
  }

  static async clickHomeLInk() {
    await t.click(NotFoundPage.elements.HomeLink)
  }
}
