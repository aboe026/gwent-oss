import ApiClient from './api-client'
import { Combat, DeckUnit, GameDeck } from '@gwent/graphql-schema/resolver-typings'
import { PlayerTurn } from '../components/game-player-info'
import { E2eHelper, MoralingExpected, ScorchingExpected } from './e2e-helper'
import E2eUtil from './e2e-util'
import GamePage, { GamePlayerExpected, HistoryMove, HistoryPass, RoundScores } from '../page-objects/game-page'
import LoginPage from '../page-objects/login-page'
import { STARTING_LIVES } from '@gwent/constants'

export default class GameManager {
  public gameId: string
  public self: GameManagerPlayer
  public opponent: GameManagerPlayer
  public moves: (HistoryMove | HistoryPass)[][]
  public verify: boolean
  public apiDriven: boolean
  public round: number

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
    this.self = {
      ...self,
      roundScores: [],
    }
    this.opponent = {
      ...opponent,
      roundScores: [],
    }
    this.moves = [[]]
    this.verify = verify
    this.apiDriven = apiDriven
    this.round = 1
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
        moves: this.moves,
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
  }): Promise<DeckUnit> {
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
      moves: this.moves[this.moves.length - 1],
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
        round: this.round,
        moves: this.moves,
      })
    }
    return unitToMove
  }

  async pass({
    verify,
    switchTurnsWith,
    victors,
  }: {
    verify?: boolean
    switchTurnsWith?: GamePlayerExpected
    victors?: string[]
  }) {
    let gameOver = false
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
      round: this.round,
      switchTurnsWith: switchTurnsWith || otherPlayer.gamePlayer,
      moves: this.moves[this.moves.length - 1],
    })

    if (this.self.gamePlayer.passed && this.opponent.gamePlayer.passed) {
      if (this.self.roundScores && this.opponent.roundScores) {
        this.self.roundScores.push(this.self.gamePlayer.score || 0)
        this.opponent.roundScores.push(this.opponent.gamePlayer.score || 0)
      }
      const losers: GamePlayerExpected[] = []
      if (this.self.gamePlayer.score !== undefined && this.opponent.gamePlayer.score !== undefined) {
        if (this.self.gamePlayer.score === this.opponent.gamePlayer.score) {
          losers.push(...[this.self.gamePlayer, this.opponent.gamePlayer])
        } else if (this.self.gamePlayer.score > this.opponent.gamePlayer.score) {
          losers.push(this.opponent.gamePlayer)
        } else {
          losers.push(this.self.gamePlayer)
        }
      }
      gameOver =
        [this.self.gamePlayer, this.opponent.gamePlayer]
          .map((gamePlayer) => {
            let livesLeft = STARTING_LIVES - (gamePlayer.losses || 0)
            if (losers.map((loser) => loser.name).includes(gamePlayer.name)) {
              livesLeft--
            }
            return livesLeft
          })
          .filter((livesLeft) => livesLeft > 0).length <= 1
      E2eHelper.endRound({
        self: this.self.gamePlayer,
        opponent: this.opponent.gamePlayer,
        losers,
        gameOver,
      })
      if (!gameOver) {
        this.moves.push([])
        this.round++
      }
    }

    if (this.verify || verify) {
      let roundScores: RoundScores[] | undefined
      if (gameOver && this.self.roundScores && this.opponent.roundScores) {
        roundScores = []
        for (let i = 0; i < this.round; i++) {
          roundScores.push({
            creator: this.self.roundScores[i],
            opponent: this.opponent.roundScores[i],
          })
        }
      }

      await GamePage.verify({
        opponent: this.opponent.gamePlayer,
        self: this.self.gamePlayer,
        hand: this.self.deck.hand,
        moves: this.moves,
        round: this.round,
        victors,
        rounds: roundScores,
      })
    }
  }
}

interface GameManagerPlayer {
  gamePlayer: GamePlayerExpected
  deck: GameDeck
  client: ApiClient
  roundScores?: number[]
}
