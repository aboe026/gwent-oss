import { Selector, t } from 'testcafe'

import E2eUtil from '../util/e2e-util'
import env from '../util/env'
import { HTML_IDS, ROUTES } from '@gwent/constants'
import { version } from '../../package.json'

const container = Selector(`#${HTML_IDS.About}`)

export default class AboutPage {
  static elements = {
    Container: container,
    Version: container.find(`#${HTML_IDS.AboutVersion}`),
    Build: container.find(`#${HTML_IDS.AboutBuild}`),
  }

  static getUrl(): string {
    return E2eUtil.getUrl(ROUTES.About.path)
  }

  static async verifyBuild() {
    await t.expect(AboutPage.elements.Build.innerText).eql(env.BUILD.toString())
  }

  static async verifyVersion() {
    await t.expect(AboutPage.elements.Version.innerText).eql(version)
  }

  static async verifyContent() {
    await E2eUtil.verifyCurrentUrl(AboutPage.getUrl())
    await AboutPage.verifyBuild()
    await AboutPage.verifyVersion()
  }
}
