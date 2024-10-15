import { Selector, t } from 'testcafe'

import E2eUtil from '../util/e2e-util'
import { FILTER_FIELD, SORT_FIELD } from '@gwent/graphql-schema/games-filter'
import { formatDay, formatTime } from '@gwent/utils'
import { GameStatus } from '@gwent/graphql-schema/resolver-typings'
import { HTML_CLASSES, HTML_IDS, ROUTES } from '@gwent/constants'

const container = Selector(`#${HTML_IDS.GamesContainer}`)

export default class GamesPage {
  static elements = {
    Container: container,
    List: container.find(`#${HTML_IDS.GamesList}`),
    NoneCreated: container.find(`#${HTML_IDS.GamesNoneCreated}`),
    NoneFiltered: container.find(`#${HTML_IDS.GamesNoneInFilter}`),
    Error: container.find(`.${HTML_CLASSES.ErrorText}`),
    CreateNew: container.find(`#${HTML_IDS.GamesCreate}`),
    CreateNone: container.find(`#${HTML_IDS.GamesNoneCreate}`),
    SortOrder: container.find(`#${HTML_IDS.GamesSortOrder}`),
    SortField: container.find(`#${HTML_IDS.GamesSortField}`),
    FilterUser: container.find(`#${HTML_IDS.GamesFilterName}`),
    NoneInFilter: container.find(`#${HTML_IDS.GamesNoneInFilter}`),
    NoneClearFilter: container.find(`#${HTML_IDS.GamesNoneClearFilter}`),
    FilterAdvanced: container.find(`#${HTML_IDS.GamesFilterAdvanced}`),
    Refresh: container.find(`#${HTML_IDS.GamesRefresh}`),
  }

  static getUrl(): string {
    return E2eUtil.getUrl(ROUTES.Games.path)
  }

  static async clickCreateNew() {
    await t.click(GamesPage.elements.CreateNew)
  }

  static async clickCreateNone() {
    await t.click(GamesPage.elements.CreateNone)
  }

  static async verifyError(error: string) {
    await t.expect(GamesPage.elements.Error.innerText).eql(error)
  }

  static async verifyNoGames() {
    await t.expect(GamesPage.elements.List.exists).notOk()
    await t.expect(GamesPage.elements.NoneCreated.exists).ok()
    await t.expect(GamesPage.elements.NoneCreated.visible).ok()
    await t.expect(GamesPage.elements.NoneCreated.innerText).eql('No games created yet')
    await t.expect(GamesPage.elements.CreateNone.exists).ok()
    await t.expect(GamesPage.elements.CreateNone.visible).ok()
  }

  static async verifyNoFilterResults() {
    await t.expect(GamesPage.elements.List.exists).notOk()
    await t.expect(GamesPage.elements.NoneInFilter.exists).ok()
    await t.expect(GamesPage.elements.NoneInFilter.visible).ok()
    await t.expect(GamesPage.elements.NoneInFilter.innerText).eql('No games match filter(s)')
    await t.expect(GamesPage.elements.NoneClearFilter.exists).ok()
    await t.expect(GamesPage.elements.NoneClearFilter.visible).ok()
  }

  static async verify({ games }: { games: GameInList[] }) {
    if (games.length > 0) {
      await t.expect(GamesPage.elements.List.exists).ok()
      await t.expect(GamesPage.elements.List.visible).ok()
      for (let i = 0; i < games.length; i++) {
        const game = games[i]
        const gameRow = GamesPage.elements.List.child().nth(i)
        await t.expect(gameRow.find(`.${HTML_CLASSES.GameRowCreatedDay}`).innerText).eql(formatDay(game.created))
        await t.expect(gameRow.find(`.${HTML_CLASSES.GameRowCreatedTime}`).innerText).eql(formatTime(game.created))
        await t.expect(gameRow.find(`.${HTML_CLASSES.GameRowCreator}`).innerText).eql(game.owner)
        const playersCount = await gameRow.find(`.${HTML_CLASSES.GameRowPlayer}`).count
        const actualPlayers: string[] = []
        for (let j = 0; j < playersCount; j++) {
          const actualPlayer = await gameRow.find(`.${HTML_CLASSES.GameRowPlayer}`).nth(j).innerText
          if (actualPlayer) {
            actualPlayers.push(actualPlayer)
          }
        }
        await t.expect(actualPlayers).eql(game.players)
        const factionsCount = await gameRow.find(`.${HTML_CLASSES.GameRowFaction}`).count
        const actualFactions: string[] = []
        for (let j = 0; j < factionsCount; j++) {
          const actualFaction = await gameRow.find(`.${HTML_CLASSES.GameRowFaction}`).nth(j).innerText
          if (actualFaction) {
            actualFactions.push(actualFaction)
          }
        }
        await t.expect(actualFactions).eql(game.factions || [])
        const expectedStatus =
          game.status === GameStatus.Decking
            ? 'Choosing Decks'
            : game.status === GameStatus.Done
            ? 'Finished'
            : 'Playing'
        await t.expect(gameRow.find(`.${HTML_CLASSES.GameRowStatus}`).innerText).eql(expectedStatus)
        const victorsCount = await gameRow.find(`.${HTML_CLASSES.GameRowVictor}`).count
        const actualVictors: string[] = []
        for (let j = 0; j < victorsCount; j++) {
          const actualVictor = await gameRow.find(`.${HTML_CLASSES.GameRowVictor}`).nth(j).innerText
          if (actualVictor) {
            actualVictors.push(actualVictor)
          }
        }
        await t.expect(actualVictors).eql(game.victors || [])
      }
    } else {
      await GamesPage.verifyNoGames()
    }
  }

  static async changeSortOrder() {
    await t.click(GamesPage.elements.SortOrder)
  }

  static async setSortField(field: SORT_FIELD) {
    await t.click(GamesPage.elements.SortField)
    await t.click(GamesPage.elements.SortField.find('option').withAttribute('value', field))
  }

  static async selectGame(index: number) {
    await t.click(GamesPage.elements.List.child(index))
  }

  static async filterUser(username: string) {
    if (username) {
      await t.typeText(GamesPage.elements.FilterUser, username, {
        replace: true,
      })
    } else {
      await t.click(GamesPage.elements.FilterUser)
      await t.pressKey('ctrl+a delete')
    }
  }

  static async clearFilterNoneFound() {
    await t.click(GamesPage.elements.NoneClearFilter)
  }

  static async toggleAdvancedFiltersExpanded() {
    await t.click(GamesPage.elements.FilterAdvanced)
  }

  static async toggleAdvancedFilter(name: FILTER_FIELD) {
    await t.click(GamesPage.elements.Container.find(`#filter${name}`))
  }

  static async refresh() {
    await t.click(GamesPage.elements.Refresh)
  }
}

export interface GameInList {
  created: string
  owner: string
  players: string[]
  factions?: string[]
  status: GameStatus
  victors?: string[]
}
