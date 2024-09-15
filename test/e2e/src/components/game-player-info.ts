import { HTML_CLASSES, MAX_ROUNDS } from '@gwent/constants'
import { Deck, Faction, Leader } from '@gwent/graphql-schema/resolver-typings'
import { formatDay, formatTime } from '@gwent/utils'
import { t } from 'testcafe'

export default class GamePlayerInfo {
  private container: Selector
  private elements

  constructor(container: Selector) {
    this.container = container
    this.elements = {
      Name: this.container.find(`.${HTML_CLASSES.GamePlayerName}`),
      TokensWon: this.container.find(`.${HTML_CLASSES.GamePlayerRoundTokenWon}`),
      Score: this.container.find(`.${HTML_CLASSES.GamePlayerScore}`),
      DeckPlaceholder: this.container.find(`.${HTML_CLASSES.GameDeckIcon}`),
      FactionImage: this.container.find(`.${HTML_CLASSES.GamePlayerFactionImage}`),
      FactionAbility: this.container.find(`.${HTML_CLASSES.GamePlayerFactionAbility}`),
      LeaderImage: this.container.find(`.${HTML_CLASSES.GamePlayerLeaderImage}`),
      LeaderAbility: this.container.find(`.${HTML_CLASSES.GamePlayerLeaderAbility}`),
      UndrawnCount: this.container.find(`.${HTML_CLASSES.GamePlayerUndrawnCount}`),
      HandCount: this.container.find(`.${HTML_CLASSES.GamePlayerHandCount}`),
      DiscardCount: this.container.find(`.${HTML_CLASSES.GamePlayerDiscardCount}`),
      DeckName: this.container.find(`.${HTML_CLASSES.GamePlayerDeckName}`),
      DeckDate: this.container.find(`.${HTML_CLASSES.GamePlayerDeckDate}`),
    }
  }

  async verify({
    name,
    discards,
    faction,
    hand,
    leader,
    score = 0,
    undrawn,
    losses = 0,
    from,
  }: {
    name: string
    losses?: number
    score?: number
    faction?: Faction
    leader?: Leader
    undrawn?: number
    hand?: number
    discards?: number
    from?: Deck | null
  }) {
    await t.expect(this.elements.Name.innerText).eql(name)
    await t.expect(this.elements.TokensWon.count).eql(MAX_ROUNDS - 1 - losses)
    await t.expect(this.elements.Score.innerText).eql(score.toString())
    if ([faction, leader, undrawn, hand, discards].includes(undefined)) {
      await t.expect(this.elements.DeckPlaceholder.exists).ok()
      await t.expect(this.elements.DeckPlaceholder.visible).ok()
      await t.expect(this.elements.FactionImage.exists).notOk()
      await t.expect(this.elements.FactionAbility.exists).notOk()
      await t.expect(this.elements.LeaderImage.exists).notOk()
      await t.expect(this.elements.LeaderAbility.exists).notOk()
      await t.expect(this.elements.UndrawnCount.exists).notOk()
      await t.expect(this.elements.HandCount.exists).notOk()
      await t.expect(this.elements.DiscardCount.exists).notOk()
    } else {
      await t.expect(this.elements.DeckPlaceholder.exists).notOk()
      if (faction) {
        await t.expect(this.elements.FactionImage.getAttribute('src')).eql(faction.image)
        await t.expect(this.elements.FactionAbility.innerText).eql(faction.ability || '')
      }
      if (leader) {
        await t.expect(this.elements.LeaderImage.getAttribute('src')).eql(leader.image)
        await t.expect(this.elements.LeaderAbility.innerText).eql(leader.ability)
      }
      if (undrawn !== undefined) {
        await t.expect(this.elements.UndrawnCount.innerText).eql(undrawn.toString())
      }
      if (hand !== undefined) {
        await t.expect(this.elements.HandCount.innerText).eql(hand.toString())
      }
      if (discards !== undefined) {
        await t.expect(this.elements.DiscardCount.innerText).eql(discards.toString())
      }
      if (from !== undefined && from !== null) {
        const isoString = new Date(from.created).toISOString()
        await t.expect(this.elements.DeckName.innerText).eql(from.name)
        await t.expect(this.elements.DeckDate.innerText).eql(`${formatDay(isoString)} @ ${formatTime(isoString)}`)
      } else {
        await t.expect(this.elements.DeckName.exists).notOk()
        await t.expect(this.elements.DeckDate.exists).notOk()
      }
    }
  }
}
