import ApiClient from './api-client'
import Banner from '../components/banner'
import {
  Combat,
  Deck,
  DeckUnit,
  EffectKey,
  FactionKey,
  GameDeck,
  MoveReasonType,
  GameUnitOrigin,
  User,
} from '@gwent/node-client'
import GamePage, { CombatUnit, GamePlayerExpected, HistoryMove, HistoryPass } from '../page-objects/game-page'
import LoginPage from '../page-objects/login-page'
import { PlayerTurn } from '../components/game-player-info'
import ProfilePage from '../page-objects/profile-page'
import { sortObjectArray } from '@gwent/utils'
import { STARTING_HAND_SIZE } from '@gwent/constants'

export interface ContextGamePlayer {
  user: User
  client: ApiClient
  deck: Deck
  gameDeck: GameDeck
}

export interface ContextGameDeck {
  faction: FactionKey
  leader: string
  units: string[]
}

export class E2eHelper {
  static async isLoggedIn(): Promise<boolean> {
    const bannerUsernameExists = await Banner.elements.Username.exists
    if (bannerUsernameExists) {
      const bannerUserNameValue = await Banner.elements.Username.innerText
      if (bannerUserNameValue) {
        return true
      }
    }
    return false
  }

  static async hasDottedBorder(element: Selector): Promise<boolean> {
    const styles = await element.style
    return (
      styles['border-bottom-style'] === 'dotted' ||
      styles['border-top-style'] === 'dotted' ||
      styles['border-left-style'] === 'dotted' ||
      styles['border-right-style'] === 'dotted'
    )
  }

  static async switchUser({ username, password = 'password' }: { username: string; password?: string }) {
    await Banner.goTo(Banner.elements.MenuProfile)
    await ProfilePage.logout()
    await LoginPage.login({
      username,
      password,
    })
  }
  static async getUnitsForDeck({
    client,
    faction,
    specials = [],
    ignores,
  }: {
    client: ApiClient
    faction: FactionKey
    specials?: string[]
    ignores?: string[]
  }): Promise<string[]> {
    const units = await client.getUnits({
      deckable: true,
      factions: [faction, FactionKey.Neutral],
    })
    const unitNames = units.filter((unit) => !unit.special).map((unit) => unit.name)
    if (ignores) {
      for (const ignore of ignores) {
        const index = unitNames.indexOf(ignore)
        if (index >= 0) {
          unitNames.splice(index, 1)
        }
      }
    }
    for (const special of specials) {
      const expectedOccurrences = specials.filter((name) => name === special).length
      const currentOccurrences = unitNames.filter((name) => name === special).length
      const possibleOccurrences = units.filter((unit) => unit.name === special).length

      if (expectedOccurrences > possibleOccurrences) {
        throw Error(
          `Cannot add "${expectedOccurrences}" instances of "${special}" for deck with faction "${faction}", only "${possibleOccurrences}" instances available`
        )
      }

      if (currentOccurrences < expectedOccurrences) {
        unitNames.push(special)
      }
    }

    return unitNames
  }

  static getHandUnit({ name, deck }: { name: string; deck: GameDeck }): DeckUnit {
    const unit = deck.hand.find((deckUnit) => deckUnit.unit.name === name)
    if (!unit) {
      throw Error(`Could not find unit "${name}" in hand.`)
    }
    return unit
  }

  static getUndrawnUnit({ name, deck }: { name: string; deck: GameDeck }): DeckUnit {
    const unit = deck.undrawn.find((deckUnit) => deckUnit.unit.name === name)
    if (!unit) {
      throw Error(`Could not find unit "${name}" in undrawn.`)
    }
    return unit
  }

  static async switchToUser({ username, password = 'password' }: { username: string; password?: string }) {
    await Banner.goTo(Banner.elements.MenuProfile)
    await ProfilePage.logout()
    await LoginPage.verifyNotLoggedIn({})
    await LoginPage.login({
      username,
      password,
    })
  }
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
    player.score = (player.score || 0) + (strength || 0)
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

  static removeUnitFromGamePlayer({
    player,
    unitName,
    strength,
    row,
    instances = 1,
  }: {
    player: GamePlayerExpected
    unitName: string
    strength?: number
    row: Combat
    instances?: number
  }): void {
    let removed = 0
    if (row === Combat.Close) {
      player.close = {
        score: (player.close?.score || 0) - (strength || 0),
        units: [...(player.close?.units || [])].filter((unit) => {
          if (unit.name === unitName && (removed < instances || instances === -1)) {
            removed++
            return false
          }
          return true
        }),
      }
    } else if (row === Combat.Ranged) {
      player.ranged = {
        score: (player.ranged?.score || 0) - (strength || 0),
        units: [...(player.ranged?.units || [])].filter((unit) => {
          if (unit.name === unitName && (removed < instances || instances === -1)) {
            removed++
            return false
          }
          return true
        }),
      }
    } else if (row === Combat.Siege) {
      player.siege = {
        score: (player.siege?.score || 0) - (strength || 0),
        units: [...(player.siege?.units || [])].filter((unit) => {
          if (unit.name === unitName && (removed < instances || instances === -1)) {
            removed++
            return false
          }
          return true
        }),
      }
    }
    player.score = (player.score || 0) - (strength || 0)
  }

  static getPlayerUnitInRow({
    player,
    unitName,
    row,
    instance = 1,
  }: {
    player: GamePlayerExpected
    unitName: string
    row: Combat
    instance?: number
  }): CombatUnit {
    const combatUnits: CombatUnit[] = []
    if (row === Combat.Close) {
      combatUnits.push(...(player.close?.units || []))
    } else if (row === Combat.Ranged) {
      combatUnits.push(...(player.ranged?.units || []))
    } else if (row === Combat.Siege) {
      combatUnits.push(...(player.siege?.units || []))
    }
    const filteredUnits = combatUnits.filter((unit) => unit.name === unitName)
    const matchingUnit = filteredUnits[instance - 1]
    if (!matchingUnit) {
      throw Error(
        `Could not find instance "${instance}" of unit "${unitName}" in player "${player.name}" combat row "${row}", only "${filteredUnits.length}" found`
      )
    }
    return matchingUnit
  }

  static setEffectiveStrength({
    player,
    effectiveStrength,
    row,
    unitName,
    instance = 1,
  }: {
    player: GamePlayerExpected
    unitName: string
    effectiveStrength: number
    row: Combat
    instance?: number
  }) {
    const unit = E2eHelper.getPlayerUnitInRow({
      player,
      row,
      unitName,
      instance,
    })
    const currentStrength = unit.effectiveStrength || unit.strength || 0
    unit.effectiveStrength = effectiveStrength
    const strengthDifference = effectiveStrength - currentStrength
    if (row === Combat.Close && player.close) {
      player.close.score = player.close.score + strengthDifference
    } else if (row === Combat.Ranged && player.ranged) {
      player.ranged.score = player.ranged.score + strengthDifference
    } else if (row === Combat.Siege && player.siege) {
      player.siege.score = player.siege.score + strengthDifference
    }
    if (player.score !== undefined && player.score !== null) {
      player.score = player.score + strengthDifference
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
    effectiveStrength,
    row,
    gameDeck,
    moves,
    switchTurnsWith,
    scorching,
    mardroeming,
    moraling,
    horning,
    mustering,
    bonding,
    impacts,
  }: {
    player: GamePlayerExpected
    deckUnit: DeckUnit
    effectiveStrength?: number
    row?: Combat
    gameDeck: GameDeck
    moves?: (HistoryMove | HistoryPass)[]
    switchTurnsWith?: GamePlayerExpected
    scorching?: ScorchingExpected[]
    mardroeming?: MardroemingExpected[]
    moraling?: MoralingExpected[]
    horning?: MoralingExpected[]
    mustering?: MusteringExpected[]
    bonding?: BondingExpected[]
    impacts?: number
  }) {
    const strength = effectiveStrength || deckUnit.unit.strength || 0
    if (!row) {
      row = deckUnit.unit.combats ? deckUnit.unit.combats[0] : Combat.Close
    }
    player.hand = (player.hand || STARTING_HAND_SIZE) - 1
    gameDeck.hand = gameDeck.hand.filter((card) => card.unit.id !== deckUnit.unit.id)
    if (deckUnit.unit.name === 'Scorch') {
      player.discard = (player.discard || 0) + 1
    } else {
      E2eHelper.addUnitToGamePlayer({
        player,
        unitName: deckUnit.unit.name,
        row,
        strength,
      })
    }
    if (mardroeming) {
      for (const mardroeme of mardroeming) {
        const berserker = E2eHelper.getPlayerUnitInRow({
          player: mardroeme.player,
          row: mardroeme.row,
          unitName: mardroeme.name === 'Transformed Young Vildkaarl' ? 'Young Berserker' : 'Berserker',
        })
        E2eHelper.removeUnitFromGamePlayer({
          player: mardroeme.player,
          row: mardroeme.row,
          unitName: berserker.name,
          strength: berserker.effectiveStrength || berserker.strength,
        })
        E2eHelper.addUnitToGamePlayer({
          player: mardroeme.player,
          unitName: mardroeme.name,
          row: mardroeme.row,
          strength: mardroeme.effectiveStrength,
        })
      }
    }
    if (mustering) {
      for (const muster of mustering) {
        E2eHelper.addUnitToGamePlayer({
          player: muster.player,
          unitName: muster.name,
          row: muster.row,
          strength: muster.effectiveStrength,
        })
        if (muster.hand) {
          gameDeck.hand = gameDeck.hand.filter((deckUnit) => deckUnit.unit.name !== muster.name)
          player.hand = gameDeck.hand.length
        } else {
          gameDeck.undrawn = gameDeck.undrawn.filter((deckUnit) => deckUnit.unit.name !== muster.name)
          player.undrawn = gameDeck.undrawn.length
        }
      }
    }
    if (moraling) {
      for (const morale of moraling) {
        E2eHelper.setEffectiveStrength({
          effectiveStrength: morale.effectiveStrength,
          player: morale.player,
          row: morale.row,
          unitName: morale.name,
          instance: morale.instance,
        })
      }
    }
    if (bonding) {
      for (let i = 0; i < bonding.length; i++) {
        const bond = bonding[i]
        E2eHelper.setEffectiveStrength({
          effectiveStrength: bond.effectiveStrength,
          player: bond.player,
          row: bond.row,
          unitName: bond.name,
          instance: i + 1,
        })
      }
    }
    if (scorching) {
      for (const scorch of scorching) {
        const scorchee = scorch.player
        scorchee.discard = (scorchee.discard || 0) + 1
        E2eHelper.removeUnitFromGamePlayer({
          player: scorchee,
          row: scorch.row,
          unitName: scorch.name,
          strength: scorch.strength || 0,
          instances: -1,
        })
      }
    }
    if (moves) {
      let effectKey: EffectKey | undefined = undefined
      if (scorching) {
        effectKey = EffectKey.Scorch
      } else if (moraling) {
        effectKey = EffectKey.Morale
      } else if (horning) {
        effectKey = EffectKey.Horn
      } else if (mardroeming) {
        effectKey = EffectKey.Mardroeme
      } else if (mustering) {
        effectKey = EffectKey.Muster
      } else if (bonding) {
        effectKey = EffectKey.Bond
      }
      moves.push({
        userName: player.name,
        unitName: deckUnit.unit.name,
        combatRow: row,
        impacts:
          effectKey && impacts !== -1
            ? {
                effectKey,
                number:
                  impacts !== undefined
                    ? impacts
                    : (scorching || mardroeming || moraling || mustering || bonding)?.length || 0,
              }
            : undefined,
      })
    }
    if (moves && mustering) {
      for (const muster of mustering) {
        moves.push({
          userName: muster.player.name,
          unitName: muster.name,
          combatRow: muster.row,
          reason: {
            name: deckUnit.unit.name,
            type: MoveReasonType.Muster,
          },
          impacts: muster.impact
            ? {
                effectKey: muster.impact.type || EffectKey.Muster,
                number: muster.impact.instances || 0,
              }
            : undefined,
          origin: muster.hand ? GameUnitOrigin.Hand : GameUnitOrigin.Undrawn,
        })
      }
    }
    if (moves && mardroeming) {
      for (const mardroeme of mardroeming) {
        moves.push({
          userName: mardroeme.player.name,
          unitName: mardroeme.name,
          combatRow: mardroeme.row,
          reason: {
            name: mardroeme.reason || deckUnit.unit.name,
            type: MoveReasonType.Transform,
          },
          impacts: mardroeme.impact
            ? {
                effectKey: mardroeme.impact.type || EffectKey.Mardroeme,
                number: mardroeme.impact.instances || 0,
              }
            : undefined,
          origin: GameUnitOrigin.Undrawn,
        })
      }
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

export interface ScorchingExpected {
  player: GamePlayerExpected
  name: string
  row: Combat
  strength?: number | null
}

export interface MoralingExpected {
  player: GamePlayerExpected
  name: string
  row: Combat
  effectiveStrength: number
  instance?: number
}

export interface MusteringExpected {
  player: GamePlayerExpected
  name: string
  row: Combat
  effectiveStrength: number
  impact?: {
    type: EffectKey
    instances?: number
  }
  hand?: boolean
}

export interface MardroemingExpected {
  player: GamePlayerExpected
  name: string
  row: Combat
  effectiveStrength: number
  reason?: string
  impact?: {
    type: EffectKey
    instances?: number
  }
}

export interface BondingExpected {
  player: GamePlayerExpected
  name: string
  row: Combat
  effectiveStrength: number
}
