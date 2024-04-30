import { Selector, t } from 'testcafe'

import E2eUtil from '../util/e2e-util'
import { Faction, Leader, UnitStats } from '@gwent/graphql-schema/resolver-typings'
import { HTML_CLASSES, HTML_IDS, ROUTES } from '@gwent/constants'
import { FILTER_FIELD, SORT_FIELD } from '@gwent/graphql-schema/decks-filter'

const container = Selector(`#${HTML_IDS.DecksContainer}`)

export default class DecksPage {
  static elements = {
    Container: container,
    List: container.find(`#${HTML_IDS.DecksList}`),
    NoneCreated: container.find(`#${HTML_IDS.DecksNoneCreated}`),
    NoneFiltered: container.find(`#${HTML_IDS.DecksNoneInFilter}`),
    SortField: container.find(`#${HTML_IDS.DecksSortField}`),
    SortOrder: container.find(`#${HTML_IDS.DecksSortOrder}`),
    FilterName: container.find(`#${HTML_IDS.DecksFilterName}`),
    FitlerAdvanced: container.find(`#${HTML_IDS.DecksFilterAdvanced}`),
    FilterClear: container.find(`#${HTML_IDS.DecksNoneClearFilter}`),
    Error: container.find(`.${HTML_CLASSES.ErrorText}`),
    CreateNew: container.find(`#${HTML_IDS.DecksCreate}`),
  }

  static getUrl(): string {
    return E2eUtil.getUrl(ROUTES.Decks.path)
  }

  static async clickCreate() {
    await t.click(DecksPage.elements.CreateNew)
  }

  static getDeck(name: string) {
    return DecksPage.elements.List.find(`.${HTML_CLASSES.DeckName}`).withText(name)
  }

  static async verifyError(error: string) {
    await t.expect(DecksPage.elements.Error.innerText).eql(error)
  }

  static async verifyNoDecks() {
    await t.expect(DecksPage.elements.List.exists).notOk()
    await t.expect(DecksPage.elements.NoneCreated.exists).ok()
    await t.expect(DecksPage.elements.NoneCreated.visible).ok()
    await t.expect(DecksPage.elements.NoneCreated.innerText).eql('No decks created yet')
  }

  static async verifyNoFilterResults() {
    await t.expect(DecksPage.elements.List.exists).notOk()
    await t.expect(DecksPage.elements.NoneFiltered.exists).ok()
    await t.expect(DecksPage.elements.NoneFiltered.visible).ok()
    await t.expect(DecksPage.elements.NoneFiltered.innerText).eql('No decks match filter(s)')
    await t.expect(DecksPage.elements.FilterClear.exists).ok()
    await t.expect(DecksPage.elements.FilterClear.visible).ok()
  }

  static async verifyName({ deck, name }: { deck: Selector; name: string }) {
    await t.expect(deck.find(`.${HTML_CLASSES.DeckName}`).innerText).eql(name)
  }

  static async verifyCreated({ deck, created }: { deck: Selector; created: Date }) {
    await t.expect(deck.find(`.${HTML_CLASSES.DeckCreated}`).innerText).eql(
      created.toLocaleDateString('en-us', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    )
  }

  static async verifyFaction({ deck, faction }: { deck: Selector; faction: Faction }) {
    await t.expect(deck.find(`.${HTML_CLASSES.DeckFactionName}`).innerText).eql(faction.name)
    await t.expect(deck.find(`.${HTML_CLASSES.DeckFactionImage}`).getAttribute('src')).eql(faction.image)
    await t.expect(deck.find(`.${HTML_CLASSES.DeckFactionAbility}`).innerText).eql(faction.ability || '')
  }

  static async verifyLeader({ deck, leader }: { deck: Selector; leader: Leader }) {
    await t.expect(deck.find(`.${HTML_CLASSES.DeckLeaderName}`).innerText).eql(leader.name)
    await t.expect(deck.find(`.${HTML_CLASSES.DeckLeaderImage}`).getAttribute('src')).eql(leader.image)
    await t.expect(deck.find(`.${HTML_CLASSES.DeckLeaderAbility}`).innerText).eql(leader.ability)
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
    const deck = position !== undefined ? DecksPage.elements.List.child().nth(position) : DecksPage.getDeck(info.name)
    await t.expect(deck.exists).ok()
    await t.expect(deck.visible).ok()
    await DecksPage.verifyName({
      deck,
      name: info.name,
    })
    await DecksPage.verifyCreated({
      deck,
      created: info.created,
    })
    await DecksPage.verifyFaction({
      deck,
      faction: info.faction,
    })
    await DecksPage.verifyLeader({
      deck,
      leader: info.leader,
    })
    await DecksPage.verifyStats({
      deck,
      stats: info.stats,
      faction: info.faction,
    })
  }

  static async verifyContent({ decks = [] }: { decks: DeckInfo[] }) {
    if (decks.length > 0) {
      for (let i = 0; i < decks.length; i++) {
        await DecksPage.verifyDeck({
          info: decks[i],
          position: i,
        })
      }
    } else {
      await DecksPage.verifyNoDecks()
    }
  }

  static async changeSortOrder() {
    await t.click(DecksPage.elements.SortOrder)
  }

  static async setSortField(field: SORT_FIELD) {
    await t.click(DecksPage.elements.SortField)
    await t.click(DecksPage.elements.SortField.find('option').withAttribute('value', field))
  }

  static async filterName(name: string) {
    if (name) {
      await t.typeText(DecksPage.elements.FilterName, name, {
        replace: true,
      })
    } else {
      await t.click(DecksPage.elements.FilterName)
      await t.pressKey('ctrl+a delete')
    }
  }

  static async toggleAdvancedFiltersExpanded() {
    await t.click(DecksPage.elements.FitlerAdvanced)
  }

  static async toggleAdvancedFilter(name: FILTER_FIELD) {
    await t.click(DecksPage.elements.Container.find(`#filter${name}`))
  }

  static async clearFilterNoneFound() {
    await t.click(DecksPage.elements.FilterClear)
  }
}

interface DeckInfo {
  name: string
  created: Date
  faction: Faction
  leader: Leader
  stats: UnitStats
}
