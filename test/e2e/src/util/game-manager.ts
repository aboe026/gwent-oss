import ApiClient from './api-client'
import { Combat, GameDeck } from '@gwent/graphql-schema/resolver-typings'
import { PlayerTurn } from '../components/game-player-info'
import { E2eHelper, MoralingExpected, ScorchingExpected } from './e2e-helper'
import E2eUtil from './e2e-util'
import GamePage, { GamePlayerExpected, HistoryMove, HistoryPass } from '../page-objects/game-page'
import LoginPage from '../page-objects/login-page'

export default class GameManager {
  public gameId: string
  public self: GameManagerPlayer
  public opponent: GameManagerPlayer
  public moves: (HistoryMove | HistoryPass)[]
  public verify: boolean
  public apiDriven: boolean

  constructor({
    gameId,
    self,
    opponent,
    verify = false,
    apiDriven = true,
  }: {
    gameId: string
    self: GameManagerPlayer
    opponent: GameManagerPlayer
    verify?: boolean
    apiDriven?: boolean
  }) {
    this.gameId = gameId
    this.self = self
    this.opponent = opponent
    this.moves = []
    this.verify = verify
    this.apiDriven = apiDriven
  }

  async initialize({ verify = true, apiDriven = false }: { verify?: boolean; apiDriven?: boolean }) {
    this.verify = verify
    this.apiDriven = apiDriven
    await LoginPage.login({
      username: this.self.gamePlayer.name,
    })
    await E2eUtil.goTo(GamePage.getUrl(this.gameId))
    if (verify) {
      await GamePage.verify({
        opponent: this.opponent.gamePlayer,
        self: this.self.gamePlayer,
        hand: this.self.deck.hand,
        moves: [this.moves],
      })
    }
  }

  async deploy({
    unitName,
    combat,
    effectiveStrength,
    scorching,
    moraling,
    verify,
  }: {
    unitName: string
    combat?: Combat
    effectiveStrength?: number
    scorching?: ScorchingExpected[]
    moraling?: MoralingExpected[]
    verify?: boolean
  }) {
    const isSelfTurn = this.self.gamePlayer.turn === PlayerTurn.Current
    const currentPlayer = isSelfTurn ? this.self : this.opponent
    const otherPlayer = isSelfTurn ? this.opponent : this.self

    const unitToMove = currentPlayer.deck.hand.find((unit) => unit.unit.name === unitName)
    if (!unitToMove) {
      throw Error(`Could not find unit "${unitName}" in hand for player "${currentPlayer.gamePlayer.name}"`)
    }
    const combatRow = combat || (unitToMove.unit.combats ? unitToMove.unit.combats[0] : Combat.Close)
    if (isSelfTurn && !this.apiDriven) {
      await GamePage.moveUnit({
        unitName: unitToMove.unit.name,
        row: combatRow,
      })
    } else {
      await currentPlayer.client.playUnit({
        gameId: this.gameId,
        unitId: unitToMove.unit.id,
        combat: combatRow,
      })
    }
    E2eHelper.playUnit({
      player: currentPlayer.gamePlayer,
      gameDeck: currentPlayer.deck,
      deckUnit: unitToMove,
      row: combatRow,
      moves: this.moves,
      switchTurnsWith: otherPlayer.gamePlayer.passed ? currentPlayer.gamePlayer : otherPlayer.gamePlayer,
      effectiveStrength,
      scorching,
      moraling,
    })
    if (this.verify || verify) {
      await GamePage.verify({
        opponent: this.opponent.gamePlayer,
        self: this.self.gamePlayer,
        hand: this.self.deck.hand,
        moves: [this.moves],
      })
    }
  }

  async pass({ verify }: { verify?: boolean }) {
    const isSelfTurn = this.self.gamePlayer.turn === PlayerTurn.Current
    const currentPlayer = isSelfTurn ? this.self : this.opponent
    const otherPlayer = isSelfTurn ? this.opponent : this.self

    if (isSelfTurn && !this.apiDriven) {
      await GamePage.pass({})
    } else {
      await currentPlayer.client.playPass({
        gameId: this.gameId,
      })
    }
    E2eHelper.playPass({
      player: currentPlayer.gamePlayer,
      round: 1,
      switchTurnsWith: otherPlayer.gamePlayer,
      moves: this.moves,
    })
    if (this.verify || verify) {
      await GamePage.verify({
        opponent: this.opponent.gamePlayer,
        self: this.self.gamePlayer,
        hand: this.self.deck.hand,
        moves: [this.moves],
      })
    }
  }
}

interface GameManagerPlayer {
  gamePlayer: GamePlayerExpected
  deck: GameDeck
  client: ApiClient
}
