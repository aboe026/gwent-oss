import { Selector, t } from 'testcafe'

import E2eUtil from '../util/e2e-util'
import { Combat, EffectKey, Faction, Leader } from '@gwent/graphql-schema/resolver-typings'
import { HTML_CLASSES, HTML_IDS, ROUTES } from '@gwent/constants'
import { SORT_FIELD } from '@gwent/graphql-schema/deck-filter'

const container = Selector(`#${HTML_IDS.DeckContainer}`)

export default class DeckPage {
  static elements = {
    Container: container,
    Name: container.find(`#${HTML_IDS.DeckName}`),
    Error: container.find(`#${HTML_IDS.DeckError}`),
    Faction: container.find(`#${HTML_IDS.DeckFaction}`),
    FactionError: container.find(`#${HTML_IDS.DeckFactionError}`),
    FactionChange: container.find(`#${HTML_IDS.DeckFactionChange}`),
    FactionImage: container.find(`#${HTML_IDS.DeckFactionImage}`),
    FactionName: container.find(`#${HTML_IDS.DeckFactionName}`),
    FactionAbility: container.find(`#${HTML_IDS.DeckFactionAbility}`),
    FactionPicker: container.find(`#${HTML_IDS.DeckFactionPicker}`),
    Leader: container.find(`#${HTML_IDS.DeckLeader}`),
    LeaderError: container.find(`#${HTML_IDS.DeckLeaderError}`),
    LeaderChange: container.find(`#${HTML_IDS.DeckLeaderChange}`),
    LeaderPicker: container.find(`#${HTML_IDS.DeckLeaderPicker}`),
    Save: container.find(`#${HTML_IDS.DeckSave}`),
    UnitsFactionError: container.find(`#${HTML_IDS.DeckUnitsFactionError}`),
    UnitsNeutralError: container.find(`#${HTML_IDS.DeckUnitsNeutralError}`),
    UnitsAvailableContainer: container.find(`#${HTML_IDS.DeckUnitsAvailableContainer}`),
    UnitsSelectedContainer: container.find(`#${HTML_IDS.DeckUnitsSelectedContainer}`),
    UnitsLockHeaders: container.find(`#${HTML_IDS.DeckUnitsLockHeaders}`),
    UnitStatUnit: container.find(`#${HTML_IDS.DeckUnitStatUnit}`),
    UnitStatSpecial: container.find(`#${HTML_IDS.DeckUnitStatSpecial}`),
    UnitStatHero: container.find(`#${HTML_IDS.DeckUnitStatHero}`),
    UnitStatStrength: container.find(`#${HTML_IDS.DeckUnitStatStrength}`),
    UnitStatCombats: container.find(`#${HTML_IDS.DeckUnitStatCombats}`),
    UnitStatEffects: container.find(`#${HTML_IDS.DeckUnitStatEffects}`),
    AvailableSortField: container.find(`#availableSortField`),
    SelectedSortField: container.find(`#selectedSortField`),
    AvailableSortOrder: container.find('#availableSortOrder'),
    SelectedSortOrder: container.find('#selectedSortOrder'),
    AvailableFilterExpand: container.find('#unitsHeaderFilterExpandAvailable'),
    SelectedFilterExpand: container.find('#unitsHeaderFilterExpandSelected'),
    NameFilterAvailable: container.find('#availableNameFilter'),
    NameFilterSelected: container.find('#selectedNameFilter'),
    UnitsSelectAll: container.find(`#${HTML_IDS.DeckUnitSelectAll}`),
    UnitsRemoveAll: container.find(`#${HTML_IDS.DeckUnitRemoveAll}`),
  }
  static getUrl(deckId?: string): string {
    return E2eUtil.getUrl(ROUTES.Deck.path.replace(':deckId', deckId || 'new'))
  }

  static async verifyName(name: string) {
    await t.expect(DeckPage.elements.Name.exists).ok()
    await t.expect(DeckPage.elements.Name.visible).ok()
    await t.expect(DeckPage.elements.Name.getAttribute('value')).eql(name)
  }

  static async verifyFactionError(error: string) {
    await t.expect(DeckPage.elements.FactionError.innerText).eql(error)
  }

  static async verifyFaction(faction?: Faction) {
    await t.expect(DeckPage.elements.FactionImage.exists).eql(faction !== undefined)
    await t.expect(DeckPage.elements.FactionName.exists).eql(faction !== undefined)
    await t.expect(DeckPage.elements.FactionAbility.exists).eql(faction !== undefined)
    if (faction) {
      await t.expect(DeckPage.elements.Faction.value).eql(faction.key)
      await t.expect(DeckPage.elements.FactionImage.visible).eql(true)
      await t.expect(DeckPage.elements.FactionImage.getAttribute('src')).eql(faction.image)
      await t.expect(DeckPage.elements.FactionName.visible).eql(true)
      await t.expect(DeckPage.elements.FactionName.innerText).eql(faction.name)
      await t.expect(DeckPage.elements.FactionAbility.visible).eql(true)
      await t.expect(DeckPage.elements.FactionAbility.innerText).eql(faction.ability || 'No ability')
    } else {
      await t.expect(DeckPage.elements.Faction.value).eql('')
    }
  }

  static async verifyLeaderError(error: string) {
    await t.expect(DeckPage.elements.LeaderError.innerText).eql(error)
  }

  static async verifyLeader(leader?: Leader) {
    await t.expect(DeckPage.elements.Leader.exists).eql(leader !== undefined)
    if (leader) {
      await t.expect(DeckPage.elements.Leader.value).eql(leader.id)
    }
  }

  static async verifyUnitsError({ factionsError, neutralError }: { factionsError?: string; neutralError?: string }) {
    if (factionsError) {
      await t.expect(DeckPage.elements.UnitsFactionError.innerText).eql(factionsError)
    } else {
      await t.expect(DeckPage.elements.UnitsFactionError.exists).notOk()
    }
    if (neutralError) {
      await t.expect(DeckPage.elements.UnitsNeutralError.innerText).eql(neutralError)
    } else {
      await t.expect(DeckPage.elements.UnitsNeutralError.exists).notOk()
    }
  }

  static async verifySelectedUnits(names?: string[]) {
    const actual = await DeckPage.getUnits(DeckPage.elements.UnitsSelectedContainer)
    await t.expect(actual).eql(names || [])
  }

  static async verifyAvailableUnits(names?: string[]) {
    if (names) {
      const actual = await DeckPage.getUnits(DeckPage.elements.UnitsAvailableContainer)
      await t.expect(actual).eql(names)
    }
  }

  private static async getUnits(container: Selector): Promise<string[]> {
    const selectedCards = container.find(`.${HTML_CLASSES.UnitCardContainer}`)
    const totalSelected = await selectedCards.count
    const names: string[] = []
    for (let i = 0; i < totalSelected; i++) {
      names.push(await selectedCards.nth(i).find(`.${HTML_CLASSES.UnitCardName}`).innerText)
    }
    return names
  }

  static async verifyCreateError(error: string) {
    await t.expect(DeckPage.elements.Error.innerText).eql(error)
  }

  static async verifyContent({
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
    await DeckPage.verifyName(name)
    await DeckPage.verifyFaction(faction)
    await DeckPage.verifyLeader(leader)
    await DeckPage.verifySelectedUnits(selectedUnits)
    await DeckPage.verifyAvailableUnits(availableUnits)
  }

  static async verifyValid(valid: boolean) {
    await t.expect(DeckPage.elements.Save.hasAttribute('disabled')).eql(!valid)
  }

  static async setName(name: string) {
    if (name) {
      await t.typeText(DeckPage.elements.Name, name, {
        replace: true,
      })
    } else {
      await t.click(DeckPage.elements.Name)
      await t.pressKey('ctrl+a delete')
    }
  }

  static async setFaction({
    faction,
    picker = false,
    verify = false,
  }: {
    faction: Faction
    picker?: boolean
    verify?: boolean
  }) {
    if (picker) {
      await t.click(DeckPage.elements.FactionChange)
      if (verify) {
        await t.expect(DeckPage.elements.FactionPicker.exists).ok()
        await t.expect(DeckPage.elements.FactionPicker.visible).ok()
      }
      await t.click(DeckPage.elements.FactionPicker.find(`.${HTML_CLASSES.FactionPickerName}`).withText(faction.name))
      if (verify) {
        if (verify) {
          await t.expect(DeckPage.elements.FactionPicker.exists).notOk()
        }
      }
    } else {
      await t.click(DeckPage.elements.Faction)
      await t.click(DeckPage.elements.Faction.find('option').withAttribute('value', faction.key))
    }
  }

  static async setLeader({
    leader,
    picker = false,
    verify = true,
  }: {
    leader: Leader
    picker?: boolean
    verify?: boolean
  }) {
    if (picker) {
      await t.click(DeckPage.elements.LeaderChange)
      if (verify) {
        await t.expect(DeckPage.elements.LeaderPicker.exists).ok()
        await t.expect(DeckPage.elements.LeaderPicker.visible).ok()
      }
      await t.click(DeckPage.elements.LeaderPicker.find(`.${HTML_CLASSES.LeaderPickerName}`).withText(leader.name))
      if (verify) {
        if (verify) {
          await t.expect(DeckPage.elements.LeaderPicker.exists).notOk()
        }
      }
    } else {
      await t.click(DeckPage.elements.Leader)
      await t.click(DeckPage.elements.Leader.find('option').withAttribute('value', leader.id))
    }
  }

  static async setUnits(names: string[]) {
    const current = await DeckPage.getUnits(DeckPage.elements.UnitsSelectedContainer)
    const unitsToAdd: string[] = []
    for (const name of names) {
      const index = current.indexOf(name)
      if (index < 0) {
        unitsToAdd.push(name) // unit has not been selected yet
      }
      current.splice(index, 1) // remove from current selected cards to account for duplicate names
    }
    const unitsToRemove = current // any currently selected cards that were not in the "names" list need to be removed
    await DeckPage.addUnits(unitsToAdd)
    await DeckPage.removeUnits(unitsToRemove)
  }

  static async addUnits(names: string[]) {
    for (const name of names) {
      await t.click(
        DeckPage.elements.UnitsAvailableContainer.find(`.${HTML_CLASSES.UnitCardContainer}`).withAttribute(
          'title',
          name
        )
      )
    }
  }

  static async removeUnits(names: string[]) {
    for (const name of names) {
      await t.click(
        DeckPage.elements.UnitsSelectedContainer.find(`.${HTML_CLASSES.UnitCardContainer}`).withAttribute('title', name)
      )
    }
  }

  static async setAvailableSortField(field: SORT_FIELD) {
    await t.click(DeckPage.elements.AvailableSortField)
    await t.click(DeckPage.elements.AvailableSortField.find('option').withAttribute('value', field))
  }

  static async setSelectedSortField(field: SORT_FIELD) {
    await t.expect(DeckPage.elements.SelectedSortField.getAttribute('disabled')).eql(null)
    await t.click(DeckPage.elements.SelectedSortField)
    await t.click(DeckPage.elements.SelectedSortField.find('option').withAttribute('value', field))
  }

  static async changeAvailableSortOrder() {
    await t.click(DeckPage.elements.AvailableSortOrder)
  }

  static async changeSelectedSortOrder() {
    await t.click(DeckPage.elements.SelectedSortOrder)
  }

  static async toggleUnitsLock() {
    await t.click(DeckPage.elements.UnitsLockHeaders)
  }

  static async filterOnMainStat(selector: Selector) {
    await t.click(selector)
  }

  static async toggleCombatsExpanded() {
    await t.click(DeckPage.elements.UnitStatCombats)
  }

  static async toggleEffectsExpanded() {
    await t.click(DeckPage.elements.UnitStatEffects)
  }

  static async filterOnAdvancedStat(field: Combat | EffectKey) {
    await t.click(
      DeckPage.elements.Container.find(
        `#deckUnitStat${field.toString().substring(0, 1)}${field.toString().substring(1).toLowerCase()}`
      )
    )
  }

  static async toggleAvailableFiltersExpanded() {
    await t.click(DeckPage.elements.AvailableFilterExpand)
  }

  static async toggleSelectedFiltersExpanded() {
    await t.click(DeckPage.elements.SelectedFilterExpand)
  }

  static async toggleAdvancedFilter(name: string) {
    await t.click(DeckPage.elements.Container.find(`#${name}`))
  }

  static async filterByName({ name, available = true }: { name: string; available?: boolean }) {
    const element = available ? DeckPage.elements.NameFilterAvailable : DeckPage.elements.NameFilterSelected
    if (name) {
      await t.typeText(element, name, {
        replace: true,
      })
    } else {
      await t.click(element)
      await t.pressKey('ctrl+a delete')
    }
  }

  static async selectAll(remove = false) {
    await t.click(remove ? DeckPage.elements.UnitsRemoveAll : DeckPage.elements.UnitsSelectAll)
  }

  static async save() {
    await t.click(DeckPage.elements.Save)
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
      await DeckPage.verifyContent({})
    }
    await DeckPage.setName(name)
    await DeckPage.setFaction({
      faction,
      picker: pickers,
      verify,
    })
    if (verify) {
      await DeckPage.verifyValid(false)
    }
    await DeckPage.setLeader({
      leader,
      picker: pickers,
      verify,
    })
    if (verify) {
      await DeckPage.verifyValid(false)
    }
    await DeckPage.setUnits(units)
    if (verify) {
      await DeckPage.verifyContent({
        faction,
        leader,
        name,
        selectedUnits: units,
      })
      await DeckPage.verifyValid(true)
    }
    await DeckPage.save()
    if (verify) {
      await E2eUtil.verifyCurrentUrl(ROUTES.Decks.path)
    }
  }
}
