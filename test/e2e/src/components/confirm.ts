import { Selector, t } from 'testcafe'

import { HTML_CLASSES } from '@gwent/constants'

export default class Confirm {
  elements: {
    Container: Selector
    Confirm: Selector
    Cancel: Selector
  }

  constructor(id: string) {
    const container = Selector(`#${id}`)
    this.elements = {
      Container: container,
      Confirm: container.find(`.${HTML_CLASSES.ActionsContainer}`).find(`button.${HTML_CLASSES.ActionsPrimary}`),
      Cancel: container.find(`.${HTML_CLASSES.ActionsContainer}`).find(`button.${HTML_CLASSES.ActionsSecondary}`),
    }
  }

  async confirm() {
    await t.click(this.elements.Confirm)
  }

  async cancel() {
    await t.click(this.elements.Cancel)
  }
}
