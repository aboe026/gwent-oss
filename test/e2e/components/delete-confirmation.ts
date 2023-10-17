import { Selector, t } from 'testcafe'

const container = Selector('#deleteMovie')

export default class DeleteConfirmation {
  static elements = {
    Container: container,
    Message: container.find('.confirm-message'),
    No: container.find('button.secondary'),
    Yes: container.find('button.primary'),
  }

  static async confirm(accept = true) {
    await t.click(accept ? DeleteConfirmation.elements.Yes : DeleteConfirmation.elements.No)
  }
}
