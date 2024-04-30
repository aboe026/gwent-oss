import { Selector } from 'testcafe'

import { HTML_IDS, ROUTES } from '@gwent/constants'
import E2eUtil from '../util/e2e-util'

const container = Selector(`#${HTML_IDS.LogoutForm}`)

export default class LogoutPage {
  static elements = {
    Container: container,
  }

  static getUrl(): string {
    return E2eUtil.getUrl(ROUTES.Logout.path)
  }
}
