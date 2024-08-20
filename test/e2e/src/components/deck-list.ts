import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import { Faction, Leader, UnitStats } from '@gwent/graphql-schema/resolver-typings'
import { FILTER_FIELD, SORT_FIELD } from '@gwent/graphql-schema/decks-filter'
import { Selector, t } from 'testcafe'

const container = Selector(`#${HTML_IDS.DeckListContainer}`)

export default class DeckList {
  static elements = {
    Container: container,
    List: container.find(`#${HTML_IDS.DeckListContents}`),
    NoneCreated: container.find(`#${HTML_IDS.DeckListNoneCreated}`),
    NoneFiltered: container.find(`#${HTML_IDS.DeckListNoneInFilter}`),
    SortField: container.find(`#${HTML_IDS.DeckListSortField}`),
    SortOrder: container.find(`#${HTML_IDS.DeckListSortOrder}`),
    FilterName: container.find(`#${HTML_IDS.DeckListFilterName}`),
    FitlerAdvanced: container.find(`#${HTML_IDS.DeckListFilterAdvanced}`),
    FilterClear: container.find(`#${HTML_IDS.DeckListNoneClearFilter}`),
    Error: container.find(`.${HTML_CLASSES.ErrorText}`),
    CreateNew: container.find(`#${HTML_IDS.DeckListCreate}`),
    CreateNone: container.find(`#${HTML_IDS.DeckListCreateNone}`),
    Close: container.find(`#${HTML_IDS.DeckListClose}`),
  }

  static async clickCreate() {
    await t.click(DeckList.elements.CreateNew)
  }

  static async clickCreateNone() {
    await t.click(DeckList.elements.CreateNone)
  }

  static getDeck(name: string) {
    return DeckList.elements.List.find(`.${HTML_CLASSES.DeckListDeckName}`)
      .withText(name)
      .parent(`.${HTML_CLASSES.DeckListDeckContainer}`)
  }

  static async verifyNotShown() {
    await t.expect(DeckList.elements.Container.exists).notOk()
    await t.expect(DeckList.elements.Container.visible).notOk()
  }

  static async verifyError(error: string) {
    await t.expect(DeckList.elements.Error.innerText).eql(error)
  }

  static async verifyNoDecks() {
    await t.expect(DeckList.elements.List.exists).notOk()
    await t.expect(DeckList.elements.NoneCreated.exists).ok()
    await t.expect(DeckList.elements.NoneCreated.visible).ok()
    await t.expect(DeckList.elements.NoneCreated.innerText).eql('No decks created yet')
    await t.expect(DeckList.elements.CreateNone.exists).ok()
    await t.expect(DeckList.elements.CreateNone.visible).ok()
  }

  static async verifyNoFilterResults() {
    await t.expect(DeckList.elements.List.exists).notOk()
    await t.expect(DeckList.elements.NoneFiltered.exists).ok()
    await t.expect(DeckList.elements.NoneFiltered.visible).ok()
    await t.expect(DeckList.elements.NoneFiltered.innerText).eql('No decks match filter(s)')
    await t.expect(DeckList.elements.FilterClear.exists).ok()
    await t.expect(DeckList.elements.FilterClear.visible).ok()
  }

  static async verifyName({ deck, name }: { deck: Selector; name: string }) {
    await t.expect(deck.find(`.${HTML_CLASSES.DeckListDeckName}`).innerText).eql(name)
  }

  static async verifyCreated({ deck, created }: { deck: Selector; created: Date | string }) {
    await t.expect(deck.find(`.${HTML_CLASSES.DeckListDeckCreated}`).innerText).eql(
      new Date(created).toLocaleDateString('en-us', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    )
  }

  static async verifyFaction({ deck, faction }: { deck: Selector; faction: Faction }) {
    await t.expect(deck.find(`.${HTML_CLASSES.DeckListDeckFactionName}`).innerText).eql(faction.name)
    await t.expect(deck.find(`.${HTML_CLASSES.DeckListDeckFactionImage}`).getAttribute('src')).eql(faction.image)
    await t.expect(deck.find(`.${HTML_CLASSES.DeckListDeckFactionAbility}`).innerText).eql(faction.ability || '')
  }

  static async verifyLeader({ deck, leader }: { deck: Selector; leader: Leader }) {
    await t.expect(deck.find(`.${HTML_CLASSES.DeckListDeckLeaderName}`).innerText).eql(leader.name)
    await t.expect(deck.find(`.${HTML_CLASSES.DeckListDeckLeaderImage}`).getAttribute('src')).eql(leader.image)
    await t.expect(deck.find(`.${HTML_CLASSES.DeckListDeckLeaderAbility}`).innerText).eql(leader.ability)
  }

  static async verifyStats({ deck, stats, faction }: { deck: Selector; stats: UnitStats; faction: Faction }) {
    const deckListStats = ['units', 'specials', 'heroes', 'strengthTotal', 'close', 'ranged', 'siege', 'agile']
    for (const stat of deckListStats) {
      const selected = (stats as any)[stat].toString()
      const total = (faction.stats as any)[stat].toString()
      await t.expect(deck.find(`.deck-stat-${stat}-value`).innerText).eql(`${selected}/${total}`)
    }
    const avgStr = stats.strengthAverage.toFixed(1).toString()
    await t.expect(deck.find('.deck-stat-strengthAverage-value').innerText).eql(avgStr)
  }

  static async verifyDeck({ info, position }: { info: DeckInfo; position?: number }) {
    const deck = position !== undefined ? DeckList.elements.List.child().nth(position) : DeckList.getDeck(info.name)
    await t.expect(deck.exists).ok()
    await t.expect(deck.visible).ok()
    await DeckList.verifyName({
      deck,
      name: info.name,
    })
    await DeckList.verifyCreated({
      deck,
      created: info.created,
    })
    await DeckList.verifyFaction({
      deck,
      faction: info.faction,
    })
    await DeckList.verifyLeader({
      deck,
      leader: info.leader,
    })
    await DeckList.verifyStats({
      deck,
      stats: info.stats,
      faction: info.faction,
    })
  }

  static async verify({ decks = [] }: { decks: DeckInfo[] }) {
    if (decks.length > 0) {
      for (let i = 0; i < decks.length; i++) {
        await DeckList.verifyDeck({
          info: decks[i],
          position: i,
        })
      }
    } else {
      await DeckList.verifyNoDecks()
    }
  }

  static async changeSortOrder() {
    await t.click(DeckList.elements.SortOrder)
  }

  static async setSortField(field: SORT_FIELD) {
    await t.click(DeckList.elements.SortField)
    await t.click(DeckList.elements.SortField.find('option').withAttribute('value', field))
  }

  static async filterName(name: string) {
    if (name) {
      await t.typeText(DeckList.elements.FilterName, name, {
        replace: true,
      })
    } else {
      await t.click(DeckList.elements.FilterName)
      await t.pressKey('ctrl+a delete')
    }
  }

  static async toggleAdvancedFiltersExpanded() {
    await t.click(DeckList.elements.FitlerAdvanced)
  }

  static async toggleAdvancedFilter(name: FILTER_FIELD) {
    await t.click(DeckList.elements.Container.find(`#filter${name}`))
  }

  static async clearFilterNoneFound() {
    await t.click(DeckList.elements.FilterClear)
  }

  static async selectDeckForGame(name: string) {
    const deck = DeckList.getDeck(name)
    await t.expect(deck.exists).ok()
    await t.expect(deck.visible).ok()
    await t.click(deck.find(`.${HTML_CLASSES.DeckListSetForGame}`))
  }

  static async close() {
    await t.click(DeckList.elements.Close)
  }
}

export interface DeckInfo {
  name: string
  created: Date | string
  faction: Faction
  leader: Leader
  stats: UnitStats
}
