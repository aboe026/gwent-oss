import { t } from 'testcafe'

import DeckList, { DeckInfo } from '../components/deck-list'
import E2eUtil from '../util/e2e-util'
import { ROUTES } from '@gwent/constants'

export default class DecksPage {
  static getUrl(): string {
    return E2eUtil.getUrl(ROUTES.Decks.path)
  }

  static async clickCreate() {
    await t.click(DeckList.elements.CreateNew)
  }

  static async clickCreateNone() {
    await t.click(DeckList.elements.CreateNone)
  }

  static async verify({ decks = [] }: { decks: DeckInfo[] }) {
    await DeckList.verify({
      decks,
    })
  }
}
