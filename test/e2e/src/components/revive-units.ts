import { Selector, t } from 'testcafe'

import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'

const container = Selector(`#${HTML_IDS.GameReviveDialog}`)

export default class ReviveUnits {
  static elements = {
    Container: container,
    Units: container.find(`#${HTML_IDS.GameReviveUnits}`),
    Empty: container.find(`#${HTML_IDS.GameReviveEmpty}`),
  }

  // TODO: fill out
  static async verfiy({
    open = true,
    medicName,
    disards,
    revivals,
  }: {
    open?: boolean
    medicName?: string
    disards?: string[]
    revivals?: string[]
  }) {
    await t.expect(container.exists).eql(open)
    if (open) {
      await t.expect(container.visible).ok()
    }
  }

  static async selectUnitToRevive(unitName: string) {
    await t.click(
      ReviveUnits.elements.Units.find(`.${HTML_CLASSES.UnitGameCardContainer}`).withAttribute('title', unitName)
    )
    await t.click(ReviveUnits.elements.Empty)
  }
}
