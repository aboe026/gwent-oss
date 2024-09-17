import DeckEditor from '../components/deck-editor'
import E2eUtil from '../util/e2e-util'
import { Faction, Leader } from '@gwent/graphql-schema/resolver-typings'
import { ROUTES } from '@gwent/constants'

export default class DeckPage {
  static getUrl(deckId?: string): string {
    return E2eUtil.getUrl(ROUTES.Deck.path.replace(':deckId', deckId || 'new'))
  }

  static async verify({
    name = '',
    faction,
    leader,
    selectedUnits,
    availableUnits,
  }: {
    name?: string
    faction?: Faction
    leader?: Leader
    selectedUnits?: string[]
    availableUnits?: string[]
  }) {
    await DeckEditor.verifyName(name)
    await DeckEditor.verifyFaction(faction)
    await DeckEditor.verifyLeader(leader, faction !== undefined)
    await DeckEditor.verifySelectedUnits(selectedUnits)
    await DeckEditor.verifyAvailableUnits(availableUnits)
  }

  static async createDeck({
    name,
    faction,
    leader,
    units,
    pickers = false,
    verify = true,
  }: {
    name: string
    faction: Faction
    leader: Leader
    units: string[]
    pickers?: boolean
    verify?: boolean
  }) {
    if (verify) {
      await DeckPage.verify({})
    }
    await DeckEditor.setName(name)
    await DeckEditor.setFaction({
      faction,
      picker: pickers,
      verify,
    })
    if (verify) {
      await DeckEditor.verifyValid(false)
    }
    await DeckEditor.setLeader({
      leader,
      picker: pickers,
      verify,
    })
    if (verify) {
      await DeckEditor.verifyValid(false)
    }
    await DeckEditor.setUnits(units)
    if (verify) {
      await DeckEditor.verify({
        faction,
        leader,
        name,
        selectedUnits: units,
      })
      await DeckEditor.verifyValid(true)
    }
    await DeckEditor.save()
    if (verify) {
      await E2eUtil.verifyCurrentUrl(ROUTES.Decks.path)
    }
  }
}
