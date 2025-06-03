import { t } from 'testcafe'

import { Deck, Faction, Leader } from '@gwent/graphql-schema/resolver-typings'
import { HTML_CLASSES, HTML_IDS } from '@gwent/constants'
import { humanizeDay, humanizeTime } from '@gwent/utils'

export default class GamePlayerInfo {
  private elements

  constructor(container: Selector) {
    this.elements = {
      Container: container,
      Name: container.find(`.${HTML_CLASSES.GamePlayerName}`),
      TokensWon: container.find(`.${HTML_CLASSES.GamePlayerRoundTokenWon}`),
      TokensLost: container.find(`.${HTML_CLASSES.GamePlayerRoundTokenLost}`),
      Score: container.find(`.${HTML_CLASSES.GamePlayerScore}`),
      DeckPlaceholder: container.find(`.${HTML_CLASSES.GameDeckIcon}`),
      FactionImage: container.find(`.${HTML_CLASSES.GamePlayerFactionImage}`),
      FactionAbility: container.find(`.${HTML_CLASSES.GamePlayerFactionAbility}`),
      LeaderImage: container.find(`.${HTML_CLASSES.GamePlayerLeaderImage}`),
      LeaderAbility: container.find(`.${HTML_CLASSES.GamePlayerLeaderAbility}`),
      UndrawnCount: container.find(`.${HTML_CLASSES.GamePlayerUndrawnCount}`),
      HandCount: container.find(`.${HTML_CLASSES.GamePlayerHandCount}`),
      DiscardCount: container.find(`.${HTML_CLASSES.GamePlayerDiscardCount}`),
      DeckName: container.find(`.${HTML_CLASSES.GamePlayerDeckName}`),
      DeckDate: container.find(`.${HTML_CLASSES.GamePlayerDeckDate}`),
      Pass: container.find(`#${HTML_IDS.GamePass}`),
      Passed: container.find(`.${HTML_CLASSES.GamePlayerPassed}`),
    }
  }

  async verify({
    name,
    discards,
    faction,
    hand,
    leader,
    score,
    undrawn,
    losses = 0,
    lives = 2,
    from,
    turn,
    passed,
    allReady,
  }: {
    name: string
    losses?: number
    lives?: number
    score?: number
    faction?: Faction
    leader?: Leader
    undrawn?: number
    hand?: number
    discards?: number
    from?: Deck | null
    turn?: PlayerTurn
    passed?: boolean
    allReady?: boolean
  }) {
    await t.expect(this.elements.Name.innerText).eql(name)
    if (!allReady) {
      await t.expect(this.elements.TokensWon.exists).notOk()
      await t.expect(this.elements.TokensLost.exists).notOk()
    }
    if (allReady) {
      await t.expect(this.elements.TokensWon.count).eql(lives - losses, `User "${name}" has correct tokens won`)
      await t.expect(this.elements.TokensLost.count).eql(losses, `User "${name}" has correct tokens lost`)
      if (score === undefined) {
        await t.expect(this.elements.Score.exists).notOk()
      } else {
        await t.expect(this.elements.Score.innerText).eql(score.toString())
      }
    }
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
        await t.expect(this.elements.DeckDate.innerText).eql(`${humanizeDay(isoString)} @ ${humanizeTime(isoString)}`)
      } else {
        await t.expect(this.elements.DeckName.exists).notOk()
        await t.expect(this.elements.DeckDate.exists).notOk()
      }
      await t
        .expect(this.elements.Container.hasClass(HTML_CLASSES.GamePlayerTurn))
        .eql(turn !== undefined, `user "${name}"`)
      await t
        .expect(this.elements.Container.hasClass(HTML_CLASSES.GamePlayerFutureTurn))
        .eql(turn === PlayerTurn.Future, `user "${name}"`)
      if (passed === undefined) {
        await t.expect(this.elements.Passed.exists).notOk(`User "${name}"`)
        await t.expect(this.elements.Pass.exists).notOk(`User "${name}"`)
      } else if (passed) {
        await t.expect(this.elements.Passed.exists).ok(`User "${name}"`)
        await t.expect(this.elements.Passed.visible).ok(`User "${name}"`)
        await t.expect(this.elements.Pass.exists).notOk(`User "${name}"`)
      } else {
        await t.expect(this.elements.Pass.exists).ok(`User "${name}"`)
        await t.expect(this.elements.Pass.visible).ok(`User "${name}"`)
        await t.expect(this.elements.Passed.exists).notOk(`User "${name}"`)
      }
    }
  }
}

export enum PlayerTurn {
  Future = 'future',
  Current = 'current',
}
