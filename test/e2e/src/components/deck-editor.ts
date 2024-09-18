import { Selector, t } from 'testcafe'

import { Combat, EffectKey, Faction, Leader } from '@gwent/graphql-schema/resolver-typings'
import E2eUtil from '../util/e2e-util'
import { HTML_CLASSES, HTML_IDS, ROUTES } from '@gwent/constants'
import { SORT_FIELD } from '@gwent/graphql-schema/deck-filter'

const container = Selector(`#${HTML_IDS.DeckEditorContainer}`)

export default class DeckEditor {
  static elements = {
    Container: container,
    Name: container.find(`#${HTML_IDS.DeckEditorName}`),
    Error: container.find(`#${HTML_IDS.DeckEditorError}`),
    Faction: container.find(`#${HTML_IDS.DeckEditorFaction}`),
    FactionError: container.find(`#${HTML_IDS.DeckEditorFactionError}`),
    FactionChange: container.find(`#${HTML_IDS.DeckEditorFactionChange}`),
    FactionImage: container.find(`#${HTML_IDS.DeckEditorFactionImage}`),
    FactionName: container.find(`#${HTML_IDS.DeckEditorFactionName}`),
    FactionAbility: container.find(`#${HTML_IDS.DeckEditorFactionAbility}`),
    FactionPicker: container.find(`#${HTML_IDS.DeckEditorFactionPicker}`),
    Leader: container.find(`#${HTML_IDS.DeckEditorLeader}`),
    LeaderError: container.find(`#${HTML_IDS.DeckEditorLeaderError}`),
    LeaderChange: container.find(`#${HTML_IDS.DeckEditorLeaderChange}`),
    LeaderPicker: container.find(`#${HTML_IDS.DeckEditorLeaderPicker}`),
    Save: container.find(`#${HTML_IDS.DeckEditorSave}`),
    Cancel: container.find(`#${HTML_IDS.DeckEditorCancel}`),
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

  static async verifyName(name: string) {
    await t.expect(DeckEditor.elements.Name.exists).ok()
    await t.expect(DeckEditor.elements.Name.visible).ok()
    await t.expect(DeckEditor.elements.Name.getAttribute('value')).eql(name)
  }

  static async verifyFactionError(error: string) {
    await t.expect(DeckEditor.elements.FactionError.innerText).eql(error)
  }

  static async verifyFaction(faction?: Faction) {
    await t.expect(DeckEditor.elements.FactionImage.exists).eql(faction !== undefined)
    await t.expect(DeckEditor.elements.FactionName.exists).eql(faction !== undefined)
    await t.expect(DeckEditor.elements.FactionAbility.exists).eql(faction !== undefined)
    if (faction) {
      await t.expect(DeckEditor.elements.Faction.value).eql(faction.key)
      await t.expect(DeckEditor.elements.FactionImage.visible).eql(true)
      await t.expect(DeckEditor.elements.FactionImage.getAttribute('src')).eql(faction.image)
      await t.expect(DeckEditor.elements.FactionName.visible).eql(true)
      await t.expect(DeckEditor.elements.FactionName.innerText).eql(faction.name)
      await t.expect(DeckEditor.elements.FactionAbility.visible).eql(true)
      await t.expect(DeckEditor.elements.FactionAbility.innerText).eql(faction.ability || 'No ability')
    } else {
      await t.expect(DeckEditor.elements.Faction.value).eql('')
    }
  }

  static async verifyLeaderError(error: string) {
    await t.expect(DeckEditor.elements.LeaderError.innerText).eql(error)
  }

  static async verifyLeader(leader?: Leader, selectable = false) {
    await t.expect(DeckEditor.elements.Leader.exists).eql(leader !== undefined || selectable)
    if (leader) {
      await t.expect(DeckEditor.elements.Leader.value).eql(leader.id)
    }
  }

  static async verifyUnitsError({ factionsError, neutralError }: { factionsError?: string; neutralError?: string }) {
    if (factionsError) {
      await t.expect(DeckEditor.elements.UnitsFactionError.innerText).eql(factionsError)
    } else {
      await t.expect(DeckEditor.elements.UnitsFactionError.exists).notOk()
    }
    if (neutralError) {
      await t.expect(DeckEditor.elements.UnitsNeutralError.innerText).eql(neutralError)
    } else {
      await t.expect(DeckEditor.elements.UnitsNeutralError.exists).notOk()
    }
  }

  static async verifySelectedUnits(names?: string[]) {
    const actual = await DeckEditor.getUnits(DeckEditor.elements.UnitsSelectedContainer)
    await t.expect(actual).eql(names || [])
  }

  static async verifyAvailableUnits(names?: string[]) {
    if (names) {
      const actual = await DeckEditor.getUnits(DeckEditor.elements.UnitsAvailableContainer)
      await t.expect(actual).eql(names)
    }
  }

  private static async getUnits(container: Selector): Promise<string[]> {
    const selectedUnits = container.find(`.${HTML_CLASSES.UnitDeckCardContainer}`)
    const totalSelected = await selectedUnits.count
    const names: string[] = []
    for (let i = 0; i < totalSelected; i++) {
      names.push(await selectedUnits.nth(i).find(`.${HTML_CLASSES.UnitDeckCardName}`).innerText)
    }
    return names
  }

  static async verifyCreateError(error: string) {
    await t.expect(DeckEditor.elements.Error.innerText).eql(error)
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

  static async verifyValid(valid: boolean) {
    await t.expect(DeckEditor.elements.Save.hasAttribute('disabled')).eql(!valid)
  }

  static async setName(name: string) {
    if (name) {
      await t.typeText(DeckEditor.elements.Name, name, {
        replace: true,
      })
    } else {
      await t.click(DeckEditor.elements.Name)
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
      await t.click(DeckEditor.elements.FactionChange)
      if (verify) {
        await t.expect(DeckEditor.elements.FactionPicker.exists).ok()
        await t.expect(DeckEditor.elements.FactionPicker.visible).ok()
      }
      await t.click(
        DeckEditor.elements.FactionPicker.find(`.${HTML_CLASSES.DeckEditorFactionPickerName}`).withText(faction.name)
      )
      if (verify) {
        if (verify) {
          await t.expect(DeckEditor.elements.FactionPicker.exists).notOk()
        }
      }
    } else {
      await t.click(DeckEditor.elements.Faction)
      await t.click(DeckEditor.elements.Faction.find('option').withAttribute('value', faction.key))
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
      await t.click(DeckEditor.elements.LeaderChange)
      if (verify) {
        await t.expect(DeckEditor.elements.LeaderPicker.exists).ok()
        await t.expect(DeckEditor.elements.LeaderPicker.visible).ok()
      }
      await t.click(
        DeckEditor.elements.LeaderPicker.find(`.${HTML_CLASSES.DeckEditorLeaderPickerName}`).withText(leader.name)
      )
      if (verify) {
        if (verify) {
          await t.expect(DeckEditor.elements.LeaderPicker.exists).notOk()
        }
      }
    } else {
      await t.click(DeckEditor.elements.Leader)
      await t.click(DeckEditor.elements.Leader.find('option').withAttribute('value', leader.id))
    }
  }

  static async openFullCard(name: string) {
    await t.click(
      DeckEditor.elements.UnitsAvailableContainer.find(`.${HTML_CLASSES.UnitDeckCardContainer}`)
        .withAttribute('title', name)
        .find(`.${HTML_CLASSES.UnitDeckCardMaximize}`)
    )
  }

  static async setUnits(names: string[]) {
    const current = await DeckEditor.getUnits(DeckEditor.elements.UnitsSelectedContainer)
    const unitsToAdd: string[] = []
    for (const name of names) {
      const index = current.indexOf(name)
      if (index < 0) {
        unitsToAdd.push(name) // unit has not been selected yet
      }
      current.splice(index, 1) // remove from current selected units to account for duplicate names
    }
    const unitsToRemove = current // any currently selected units that were not in the "names" list need to be removed
    await DeckEditor.addUnits(unitsToAdd)
    await DeckEditor.removeUnits(unitsToRemove)
  }

  static async addUnits(names: string[]) {
    for (const name of names) {
      await t.click(
        DeckEditor.elements.UnitsAvailableContainer.find(`.${HTML_CLASSES.UnitDeckCardContainer}`).withAttribute(
          'title',
          name
        )
      )
    }
  }

  static async removeUnits(names: string[]) {
    for (const name of names) {
      await t.click(
        DeckEditor.elements.UnitsSelectedContainer.find(`.${HTML_CLASSES.UnitDeckCardContainer}`).withAttribute(
          'title',
          name
        )
      )
    }
  }

  static async setAvailableSortField(field: SORT_FIELD) {
    await t.click(DeckEditor.elements.AvailableSortField)
    await t.click(DeckEditor.elements.AvailableSortField.find('option').withAttribute('value', field))
  }

  static async setSelectedSortField(field: SORT_FIELD) {
    await t.expect(DeckEditor.elements.SelectedSortField.getAttribute('disabled')).eql(null)
    await t.click(DeckEditor.elements.SelectedSortField)
    await t.click(DeckEditor.elements.SelectedSortField.find('option').withAttribute('value', field))
  }

  static async changeAvailableSortOrder() {
    await t.click(DeckEditor.elements.AvailableSortOrder)
  }

  static async changeSelectedSortOrder() {
    await t.click(DeckEditor.elements.SelectedSortOrder)
  }

  static async toggleUnitsLock() {
    await t.click(DeckEditor.elements.UnitsLockHeaders)
  }

  static async filterOnMainStat(selector: Selector) {
    await t.click(selector)
  }

  static async toggleCombatsExpanded() {
    await t.click(DeckEditor.elements.UnitStatCombats)
  }

  static async toggleEffectsExpanded() {
    await t.click(DeckEditor.elements.UnitStatEffects)
  }

  static async filterOnAdvancedStat(field: Combat | EffectKey) {
    await t.click(
      DeckEditor.elements.Container.find(
        `#deckUnitStat${field.toString().substring(0, 1)}${field.toString().substring(1).toLowerCase()}`
      )
    )
  }

  static async toggleAvailableFiltersExpanded() {
    await t.click(DeckEditor.elements.AvailableFilterExpand)
  }

  static async toggleSelectedFiltersExpanded() {
    await t.click(DeckEditor.elements.SelectedFilterExpand)
  }

  static async toggleAdvancedFilter(name: string) {
    await t.click(DeckEditor.elements.Container.find(`#${name}`))
  }

  static async filterByName({ name, available = true }: { name: string; available?: boolean }) {
    const element = available ? DeckEditor.elements.NameFilterAvailable : DeckEditor.elements.NameFilterSelected
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
    await t.click(remove ? DeckEditor.elements.UnitsRemoveAll : DeckEditor.elements.UnitsSelectAll)
  }

  static async save() {
    await t.click(DeckEditor.elements.Save)
  }

  static async cancel() {
    await t.click(DeckEditor.elements.Cancel)
  }

  static async createDeck({
    name,
    faction,
    leader,
    units,
    pickers = false,
    verify = true,
    save = true,
  }: {
    name: string
    faction: Faction
    leader: Leader
    units: string[]
    pickers?: boolean
    verify?: boolean
    save?: boolean
  }) {
    if (verify) {
      await DeckEditor.verify({})
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
    if (save) {
      await DeckEditor.save()
    }
    if (verify) {
      await E2eUtil.verifyCurrentUrl(ROUTES.Decks.path)
    }
  }
}
