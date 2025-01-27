import ApiClient from './api-client'
import { Combat, Deck, DeckUnit, GameDeck, User } from '@gwent/graphql-schema/resolver-typings'
import GamePage, { CombatUnit, GamePlayerExpected, HistoryMove, HistoryPass } from '../page-objects/game-page'
import { PlayerTurn } from '../components/game-player-info'
import { sortObjectArray } from '@gwent/utils'
import { STARTING_HAND_SIZE } from '@gwent/constants'

export interface ContextGamePlayer {
  user: User
  client: ApiClient
  deck: Deck
  gameDeck: GameDeck
}

export class E2eHelper {
  static getGamePlayer({
    player,
    turn,
    ready,
    passed,
    score,
    hand = STARTING_HAND_SIZE,
  }: {
    player: ContextGamePlayer
    turn?: PlayerTurn
    ready?: boolean
    passed?: boolean
    score?: number
    hand?: number
  }): GamePlayerExpected {
    const gamePlayer: GamePlayerExpected = {
      name: player.user.name,
      discard: 0,
      faction: player.deck.faction,
      leader: player.deck.leader,
      hand,
      undrawn: player.deck.units.length - STARTING_HAND_SIZE,
      from: player.deck,
      score,
    }
    if (turn !== undefined) {
      gamePlayer.turn = turn
    }
    if (ready !== undefined) {
      gamePlayer.ready = ready
    }
    if (passed !== undefined) {
      gamePlayer.passed = passed
    }
    return gamePlayer
  }

  static addUnitToGamePlayer({
    player,
    unitName,
    strength,
    row,
  }: {
    player: GamePlayerExpected
    unitName: string
    strength?: number
    row: Combat
  }): void {
    const unit: CombatUnit = {
      name: unitName,
      strength,
    }
    if (row === Combat.Close) {
      player.close = {
        score: (player.close?.score || 0) + (strength || 0),
        units: [...(player.close?.units || []), unit],
      }
    } else if (row === Combat.Ranged) {
      player.ranged = {
        score: (player.ranged?.score || 0) + (strength || 0),
        units: [...(player.ranged?.units || []), unit],
      }
    } else if (row === Combat.Siege) {
      player.siege = {
        score: (player.siege?.score || 0) + (strength || 0),
        units: [...(player.siege?.units || []), unit],
      }
    }
  }

  static resetPlayerCombatRow({ player, row }: { player: GamePlayerExpected; row: Combat }): number {
    let discardsForRow = 0
    if (row === Combat.Close) {
      discardsForRow = (player.close?.units || []).length
      player.close = {
        score: 0,
        units: [],
      }
    } else if (row === Combat.Ranged) {
      discardsForRow = (player.ranged?.units || []).length
      player.ranged = {
        score: 0,
        units: [],
      }
    } else if (row === Combat.Siege) {
      discardsForRow = (player.siege?.units || []).length
      player.siege = {
        score: 0,
        units: [],
      }
    }
    return discardsForRow
  }

  static playUnit({
    player,
    deckUnit,
    row,
    gameDeck,
    moves,
    switchTurnsWith,
  }: {
    player: GamePlayerExpected
    deckUnit: DeckUnit
    row?: Combat
    gameDeck: GameDeck
    moves?: (HistoryMove | HistoryPass)[]
    switchTurnsWith?: GamePlayerExpected
  }) {
    if (!row) {
      row = deckUnit.unit.combats ? deckUnit.unit.combats[0] : Combat.Close
    }
    player.score = (player.score || 0) + (deckUnit.unit.strength || 0)
    player.hand = (player.hand || STARTING_HAND_SIZE) - 1
    gameDeck.hand = gameDeck.hand.filter((card) => card.unit.id !== deckUnit.unit.id)
    E2eHelper.addUnitToGamePlayer({
      player,
      unitName: deckUnit.unit.name,
      row,
      strength: deckUnit.unit.strength || 0,
    })
    if (moves) {
      moves.push({
        userName: player.name,
        unitName: deckUnit.unit.name,
        combatRow: row,
      })
    }
    if (switchTurnsWith) {
      player.turn = undefined
      switchTurnsWith.turn = PlayerTurn.Current
    }
  }

  static playPass({
    player,
    moves,
    round,
    switchTurnsWith,
  }: {
    player: GamePlayerExpected
    moves?: (HistoryMove | HistoryPass)[]
    round?: number
    switchTurnsWith?: GamePlayerExpected
  }) {
    player.passed = true
    if (moves && round) {
      moves.push({
        userName: player.name,
        round,
      })
    }
    if (switchTurnsWith) {
      player.turn = undefined
      switchTurnsWith.turn = PlayerTurn.Current
    }
  }

  static endRound({
    self,
    opponent,
    gameOver,
    losers,
  }: {
    self: GamePlayerExpected
    opponent: GamePlayerExpected
    gameOver?: boolean
    losers: GamePlayerExpected[]
  }) {
    self.score = 0
    opponent.score = 0
    self.discard =
      (self.discard || 0) +
      E2eHelper.resetPlayerCombatRow({
        player: self,
        row: Combat.Close,
      })
    self.discard =
      (self.discard || 0) +
      E2eHelper.resetPlayerCombatRow({
        player: self,
        row: Combat.Ranged,
      })
    self.discard =
      (self.discard || 0) +
      E2eHelper.resetPlayerCombatRow({
        player: self,
        row: Combat.Siege,
      })
    opponent.discard =
      (opponent.discard || 0) +
      E2eHelper.resetPlayerCombatRow({
        player: opponent,
        row: Combat.Close,
      })
    opponent.discard =
      (opponent.discard || 0) +
      E2eHelper.resetPlayerCombatRow({
        player: opponent,
        row: Combat.Ranged,
      })
    opponent.discard =
      (opponent.discard || 0) +
      E2eHelper.resetPlayerCombatRow({
        player: opponent,
        row: Combat.Siege,
      })
    self.passed = false
    opponent.passed = undefined
    if (gameOver) {
      self.passed = undefined
      self.score = undefined
      self.turn = undefined
      opponent.score = undefined
      opponent.turn = undefined
    }
    for (const loser of losers) {
      loser.losses = (loser.losses || 0) + 1
    }
  }

  static async playStrongestCards({
    self,
    opponent,
    moves,
    uiDriven,
    gameId,
    round,
    debug,
  }: {
    self: CardPlayer
    opponent: CardPlayer
    moves: (HistoryMove | HistoryPass)[]
    uiDriven?: boolean
    verifyEachMovement?: boolean
    gameId: string
    round: number
    debug?: boolean
  }): Promise<{
    selfPlayedCards: CombatCard[]
    opponentPlayedCards: CombatCard[]
  }> {
    const sortedHandSelf = sortObjectArray({
      array: self.player.gameDeck.hand,
      sortProperties: ['unit.strength', 'unit.name', 'unit.id'],
      reverse: true,
    })
    const sortedHandOpponent = sortObjectArray({
      array: opponent.player.gameDeck.hand,
      sortProperties: ['unit.strength', 'unit.name', 'unit.id'],
      reverse: true,
    })
    const numberOfCardsToPlaySelf = self.numberToPlay === undefined ? sortedHandSelf.length : self.numberToPlay
    const numberOfCardsToPlayOpponent =
      opponent.numberToPlay === undefined ? sortedHandOpponent.length : opponent.numberToPlay
    let selfHandIndex = 0
    let opponentHandIndex = 0
    let selfScore = 0
    let opponentScore = 0
    const verify = false
    const logPrefix = 'playStrongetsCards'
    const selfPlayedCards: CombatCard[] = []
    const opponentPlayedCards: CombatCard[] = []
    if (debug) {
      console.log(`${logPrefix} numberOfCardsToPlaySelf: "${numberOfCardsToPlaySelf}"`)
      console.log(`${logPrefix} numberOfCardsToPlayOpponent: "${numberOfCardsToPlayOpponent}"`)
    }

    while (selfHandIndex < numberOfCardsToPlaySelf || opponentHandIndex < numberOfCardsToPlayOpponent) {
      if (debug) {
        console.log(`${logPrefix} selfHandIndex: "${selfHandIndex}"`)
        console.log(`${logPrefix} opponentHandIndex: "${opponentHandIndex}"`)
      }
      if (self.expected.turn) {
        if (debug) {
          console.log(`${logPrefix} self turn`)
        }
        if (selfHandIndex < numberOfCardsToPlaySelf) {
          const selfUnit = sortedHandSelf[selfHandIndex]
          if (selfUnit.unit.combats) {
            if (debug) {
              console.log(`${logPrefix} playing self unit "${selfUnit.unit.name}"`)
            }
            selfScore += selfUnit.unit.strength || 0
            const combat = selfUnit.unit.combats[0]
            if (uiDriven) {
              await GamePage.moveUnit({
                unitName: selfUnit.unit.name,
                row: combat,
              })
            } else {
              await self.player.client.playUnit({
                gameId,
                unitId: selfUnit.unit.id,
                combat,
              })
            }
            selfPlayedCards.push({
              name: selfUnit.unit.name,
              row: combat,
            })
            E2eHelper.playUnit({
              player: self.expected,
              gameDeck: self.player.gameDeck,
              deckUnit: selfUnit,
              moves: moves,
              row: combat,
            })
            if (!opponent.expected.passed) {
              self.expected.turn = undefined
              opponent.expected.turn = PlayerTurn.Current
            }
            if (verify) {
              await GamePage.verify({
                opponent: opponent.expected,
                self: self.expected,
                hand: self.player.gameDeck.hand,
                moves: [moves],
              })
            }
          } else {
            if (debug) {
              console.log(`${logPrefix} no combats for self unit "${selfUnit.unit.name}" so cannot play, skipping`)
            }
          }
          selfHandIndex++
        } else if (!self.expected.passed) {
          if (debug) {
            console.log(`${logPrefix} self has run out of cards in hand, will pass`)
          }
          await GamePage.pass({})
          E2eHelper.playPass({
            player: self.expected,
            round,
            moves,
            switchTurnsWith: opponent.expected,
          })
        } else {
          console.log(`${logPrefix} self has nothing to do`)
        }
      }

      if (opponent.expected.turn) {
        if (debug) {
          console.log(`${logPrefix} opponent turn`)
        }
        if (opponentHandIndex < numberOfCardsToPlayOpponent) {
          const opponentUnit = sortedHandOpponent[opponentHandIndex]
          if (opponentUnit.unit.combats) {
            if (debug) {
              console.log(`${logPrefix} playing opponent unit "${opponentUnit.unit.name}"`)
            }
            opponentScore += opponentUnit.unit.strength || 0
            const combat = opponentUnit.unit.combats[0]
            await opponent.player.client.playUnit({
              gameId: gameId,
              unitId: opponentUnit.unit.id,
              combat,
            })
            opponentPlayedCards.push({
              name: opponentUnit.unit.name,
              row: combat,
            })
            E2eHelper.playUnit({
              player: opponent.expected,
              gameDeck: opponent.player.gameDeck,
              deckUnit: opponentUnit,
              moves: moves,
              row: combat,
            })
            if (!self.expected.passed) {
              opponent.expected.turn = undefined
              self.expected.turn = PlayerTurn.Current
            }
            if (verify) {
              await GamePage.verify({
                opponent: opponent.expected,
                self: self.expected,
                hand: self.player.gameDeck.hand,
                moves: [moves],
              })
            }
          } else {
            if (debug) {
              console.log(
                `${logPrefix} no combats for opponent unit "${opponentUnit.unit.name}" so cannot play, skipping`
              )
            }
          }
          opponentHandIndex++
        } else if (!opponent.expected.passed) {
          if (debug) {
            console.log(`${logPrefix} opponent has run out of cards in hand, will pass`)
          }
          await opponent.player.client.playPass({
            gameId: gameId,
          })
          E2eHelper.playPass({
            player: opponent.expected,
            round,
            moves,
            switchTurnsWith: self.expected,
          })
        } else {
          if (debug) {
            console.log(`${logPrefix} nothing for opponent to do`)
          }
        }
      }
    }

    if (debug) {
      console.log(`${logPrefix} selfScore: "${selfScore}"`)
      console.log(`${logPrefix} opponentScore: "${opponentScore}"`)
    }

    return {
      selfPlayedCards,
      opponentPlayedCards,
    }
  }
}

interface CardPlayer {
  numberToPlay?: number
  player: ContextGamePlayer
  expected: GamePlayerExpected
}

interface CombatCard {
  name: string
  row: Combat
}
