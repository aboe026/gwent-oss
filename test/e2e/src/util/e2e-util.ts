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
    await t.expect(E2eUtil.getCurrentUrl()).eql(E2eUtil.getUrl(expectedPath))
  }

  static reload = ClientFunction(() => location.reload())

  static async goTo(path: string) {
    await t.navigateTo(E2eUtil.getUrl(path))
  }

  static getUrl(path: string) {
    return path.startsWith(env.BASE_URL) ? path : urlJoin(env.BASE_URL, path)
  }
}
