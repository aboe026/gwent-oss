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
} from '@gwent-oss/node-client'
import { CombatUnit, GamePlayerExpected, HistoryMove, HistoryPass } from '../page-objects/game-page'
import LoginPage from '../page-objects/login-page'
import { PASSWORD } from './e2e-constants'
import { PlayerTurn } from '../components/game-player-info'
import ProfilePage from '../page-objects/profile-page'
import { STARTING_HAND_SIZE } from '@gwent-oss/constants'

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

  static async switchUser({ username, password = PASSWORD }: { username: string; password?: string }) {
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

  static async switchToUser({ username, password = PASSWORD }: { username: string; password?: string }) {
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
    hero,
  }: {
    player: GamePlayerExpected
    unitName: string
    strength?: number
    row: Combat
    hero?: boolean
  }): void {
    player.score = (player.score || 0) + (strength || 0)
    const unit: CombatUnit = {
      name: unitName,
      strength,
      hero,
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

  static addWeatherToGamePlayer({ player, unitName }: { player: GamePlayerExpected; unitName: string }) {
    if (!player.weathering) {
      player.weathering = []
    }
    player.weathering.push(unitName)
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

  static removeWeatherFromGamePlayer({ player, unitName }: { player: GamePlayerExpected; unitName: string }) {
    const newWeathers: string[] = []
    if (player.weathering) {
      for (const weather of player.weathering) {
        if (weather !== unitName) {
          newWeathers.push(weather)
        }
      }
    }
    player.weathering = newWeathers
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

  static resetPlayerCombatRow({
    player,
    row,
    discards,
  }: {
    player: GamePlayerExpected
    row: Combat
    discards: number | undefined | null
  }): number {
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
    return (discards || 0) + discardsForRow
  }

  static resetPlayerWeather({
    player,
    discards,
  }: {
    player: GamePlayerExpected
    discards: number | undefined | null
  }): number {
    let discardFromWeather = 0
    if (player.weathering) {
      discardFromWeather += player.weathering.length
      player.weathering = []
    }
    return (discards || 0) + discardFromWeather
  }

  static playUnit({
    player,
    newDeckUnit,
    effectiveStrength,
    row,
    hero,
    gameDeck,
    moves,
    switchTurnsWith,
    scorching,
    mardroeming,
    moraling,
    horning,
    mustering,
    medicing,
    revivedBy,
    bonding,
    decoying,
    avenging,
    spying,
    weathering,
    impacts,
  }: {
    player: GamePlayerExpected
    newDeckUnit: DeckUnit
    effectiveStrength?: number
    row?: Combat
    hero?: boolean
    gameDeck: GameDeck
    moves?: (HistoryMove | HistoryPass)[]
    switchTurnsWith?: GamePlayerExpected
    scorching?: ScorchingExpected[]
    mardroeming?: MardroemingExpected[]
    moraling?: MoralingExpected[]
    horning?: MoralingExpected[]
    mustering?: MusteringExpected[]
    medicing?: boolean
    revivedBy?: string
    bonding?: BondingExpected[]
    decoying?: DecoyingExpected
    avenging?: AvengingExpected[]
    spying?: SpyingExpected
    weathering?: WeatheringExpected[]
    impacts?: number
  }) {
    const strength = effectiveStrength || newDeckUnit.unit.strength || 0
    let undrawnSpiedIntoHand = 0
    if (!row) {
      row = newDeckUnit.unit.combats ? newDeckUnit.unit.combats[0] : Combat.Close
    }
    if (revivedBy) {
      player.discard = (player.discard || 0) - 1
      gameDeck.discard = gameDeck.discard.filter((deckUnit) => deckUnit.unit.id !== newDeckUnit.unit.id)
    } else {
      player.hand = (player.hand || STARTING_HAND_SIZE) - 1
      gameDeck.hand = gameDeck.hand.filter((deckUnit) => deckUnit.unit.id !== newDeckUnit.unit.id)
    }
    if (newDeckUnit.unit.name === 'Scorch') {
      player.discard = (player.discard || 0) + 1
    } else if (weathering && newDeckUnit.unit.name !== 'Clear Weather') {
      E2eHelper.addWeatherToGamePlayer({
        player,
        unitName: newDeckUnit.unit.name,
      })
    } else if (!spying) {
      E2eHelper.addUnitToGamePlayer({
        player,
        unitName: newDeckUnit.unit.name,
        row,
        strength,
        hero,
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
    if (horning) {
      for (const horn of horning) {
        E2eHelper.setEffectiveStrength({
          effectiveStrength: horn.effectiveStrength,
          player: horn.player,
          row: horn.row,
          unitName: horn.name,
          instance: horn.instance,
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
    if (avenging) {
      for (const avenge of avenging) {
        E2eHelper.addUnitToGamePlayer({
          player: avenge.newUnitPlayer,
          row: avenge.row,
          unitName: avenge.name,
          strength: avenge.effectiveStrength,
        })
        if (avenge.origin === GameUnitOrigin.Discard) {
          avenge.newUnitPlayer.discard = (avenge.newUnitPlayer.discard || 0) - 1
        } else if (avenge.origin === GameUnitOrigin.Hand) {
          avenge.newUnitPlayer.hand = (avenge.newUnitPlayer.hand || 0) - 1
        }
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
    if (decoying) {
      E2eHelper.removeUnitFromGamePlayer({
        player: decoying.player,
        row: decoying.row,
        unitName: decoying.name,
        strength: decoying.effectiveStrength,
        instances: decoying.instance,
      })
      decoying.player.hand = (decoying.player.hand || 0) + 1
      gameDeck.hand.push({
        artStyle: 1,
        unit: {
          name: decoying.name,
          strength: decoying.strength !== undefined ? decoying.strength : decoying.effectiveStrength,
        } as any,
      })
    }
    if (spying) {
      if (spying.row && spying.name)
        E2eHelper.addUnitToGamePlayer({
          player: spying.opponent,
          row: spying.row,
          unitName: spying.name,
          strength: spying.effectiveStrength,
        })
      const undrawns = player.undrawn || 0
      undrawnSpiedIntoHand = undrawns > 2 ? 2 : undrawns
      player.hand = (player.hand || 0) + undrawnSpiedIntoHand
      player.undrawn = (player.undrawn || 0) - undrawnSpiedIntoHand
    }
    if (weathering) {
      for (const weather of weathering) {
        if (weather.effectiveStrength !== undefined && weather.row !== undefined) {
          E2eHelper.setEffectiveStrength({
            effectiveStrength: weather.effectiveStrength,
            player: weather.player,
            row: weather.row,
            unitName: weather.name,
            instance: weather.instance,
          })
        } else {
          E2eHelper.removeWeatherFromGamePlayer({
            player: weather.player,
            unitName: weather.name,
          })
        }
      }
    }
    if (moves) {
      let effectKey: EffectKey | undefined = undefined
      if (scorching) {
        effectKey = EffectKey.Scorch
      } else if (mardroeming) {
        effectKey = EffectKey.Mardroeme
      } else if (moraling) {
        effectKey = EffectKey.Morale
      } else if (horning) {
        effectKey = EffectKey.Horn
      } else if (mustering) {
        effectKey = EffectKey.Muster
      } else if (bonding) {
        effectKey = EffectKey.Bond
      } else if (decoying) {
        effectKey = EffectKey.Decoy
      } else if (spying) {
        effectKey = EffectKey.Spy
      } else if (weathering) {
        effectKey = EffectKey.Weather
      } else if (medicing !== undefined) {
        effectKey = EffectKey.Medic
      }
      let numImpacts: number
      if (impacts !== undefined) {
        numImpacts = impacts
      } else {
        if (medicing !== undefined) {
          numImpacts = medicing === true ? 1 : 0
        } else if (decoying) {
          numImpacts = 1
        } else if (spying) {
          numImpacts = undrawnSpiedIntoHand
        } else {
          numImpacts = (scorching || mardroeming || moraling || mustering || bonding || horning || weathering || [])
            ?.length
        }
      }
      moves.push({
        userName: player.name,
        unitName: newDeckUnit.unit.name,
        combatRow: weathering ? undefined : row,
        impacts:
          effectKey && impacts !== -1
            ? {
                effectKey,
                number: numImpacts,
              }
            : undefined,
        targetUserName: spying ? spying.opponent.name : undefined,
        reason: {
          type: revivedBy ? MoveReasonType.Revive : MoveReasonType.Deploy,
          name: revivedBy || '',
        },
      })
    }
    if (moves && mustering) {
      for (const muster of mustering) {
        moves.push({
          userName: muster.player.name,
          unitName: muster.name,
          combatRow: muster.row,
          reason: {
            name: newDeckUnit.unit.name,
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
            name: mardroeme.reason || newDeckUnit.unit.name,
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
    if (moves && avenging) {
      for (const avenge of avenging) {
        moves.push({
          userName: avenge.turn.name,
          unitName: avenge.name,
          combatRow: avenge.row,
          reason: {
            name: avenge.name === 'Bovine Defense Force' ? 'Cow' : 'Kambi',
            type: MoveReasonType.Summon,
          },
          impacts: {
            effectKey: EffectKey.Avenger,
            number: 1,
          },
          origin: GameUnitOrigin.Nondeck,
          targetUserName: avenge.newUnitPlayer.name,
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
    self.discard = E2eHelper.resetPlayerCombatRow({
      player: self,
      row: Combat.Close,
      discards: self.discard,
    })
    self.discard = E2eHelper.resetPlayerCombatRow({
      player: self,
      row: Combat.Ranged,
      discards: self.discard,
    })
    self.discard = E2eHelper.resetPlayerCombatRow({
      player: self,
      row: Combat.Siege,
      discards: self.discard,
    })
    opponent.discard = E2eHelper.resetPlayerCombatRow({
      player: opponent,
      row: Combat.Close,
      discards: opponent.discard,
    })
    opponent.discard = E2eHelper.resetPlayerCombatRow({
      player: opponent,
      row: Combat.Ranged,
      discards: opponent.discard,
    })
    opponent.discard = E2eHelper.resetPlayerCombatRow({
      player: opponent,
      row: Combat.Siege,
      discards: opponent.discard,
    })
    self.discard = E2eHelper.resetPlayerWeather({ player: self, discards: self.discard })
    opponent.discard = E2eHelper.resetPlayerWeather({ player: opponent, discards: opponent.discard })
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

export interface WeatheringExpected {
  player: GamePlayerExpected
  name: string
  row?: Combat
  effectiveStrength?: number
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

export interface DecoyingExpected {
  player: GamePlayerExpected
  name: string
  row: Combat
  strength?: number
  effectiveStrength: number
  instance?: number
}

export interface SpyingExpected {
  player: GamePlayerExpected
  opponent: GamePlayerExpected
  name: string
  row: Combat
  effectiveStrength: number
  instance?: number
}

export interface AvengingExpected {
  turn: GamePlayerExpected
  newUnitPlayer: GamePlayerExpected
  name: string
  row: Combat
  effectiveStrength: number
  origin?: GameUnitOrigin
}
