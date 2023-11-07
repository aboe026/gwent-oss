import { ClientFunction, t } from 'testcafe'
import urlJoin from 'url-join'

import env from './env'

export default class E2eUtil {
  static getCurrentUrl = ClientFunction(() => {
    let url = document.location.href
    if (url.endsWith('/')) {
      url = url.substring(0, url.length - 1)
    }
    return url
  })

  static async verifyCurrentUrl(expectedPath: string) {
    await t.expect(E2eUtil.getCurrentUrl()).eql(urlJoin(env.BASE_URL, expectedPath))
  }

  static reload = ClientFunction(() => location.reload())

  static async goToPath(path: string) {
    await t.navigateTo(urlJoin(env.BASE_URL, path))
  }
}
