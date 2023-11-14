import { Selector, t } from 'testcafe'

import { HTML_IDS } from '@gwent/constants'

export default class HomePage {
  static elements = {
    Welcome: Selector(`#${HTML_IDS.Home}`),
  }

  static async verifyContent(exists = true) {
    if (exists) {
      await t.expect(HomePage.elements.Welcome.innerText).eql('Welcome Home!')
    } else {
      await t.expect(HomePage.elements.Welcome.exists).notOk()
    }
  }
}
