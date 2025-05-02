import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  GamePlayerDbObject,
  GameUnitDbObject,
  PlayerCombatRowDbObject,
  PlayerRoundDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import GetEffectWithKey from './get-effect-with-key'
import getGameUnits from './get-game-units'
import GetStrongestNonHeroUnitIds from './get-strongest-non-hero-unit-ids'

export default class ScorchBattlefield {
  private static logger = getLogger('ScorchBattlefield')

  static scorchBattlefield({
    battlefieldUnits,
    effects,
    game,
    logPrefix,
    newDeckUnit,
  }: {
    battlefieldUnits: UnitDbObject[]
    effects: EffectDbObject[]
    game: GameDbObject
    logPrefix: string
    newDeckUnit: DeckUnitDbObject
  }) {
    const newUnit = battlefieldUnits.find((unit) => unit._id.toString() === newDeckUnit.unit.toString())
    if (!newUnit) {
      const message = `Could not find unit for new deck unit "${newDeckUnit.unit}".`
      ScorchBattlefield.logger.error(`${logPrefix} failed: ${message}`)
      throw Error(message)
    }
    if (ScorchBattlefield.logger.isTraceEnabled()) {
      ScorchBattlefield.logger.trace(`${logPrefix} newUnit: "${JSON.stringify(newUnit)}"`)
    }

    const scorchEffect = GetEffectWithKey.getEffectWithKey({
      effectKey: EffectKey.Scorch,
      effects,
      logPrefix,
    })
    if (ScorchBattlefield.logger.isTraceEnabled()) {
      ScorchBattlefield.logger.trace(`${logPrefix} scorchEffect: "${JSON.stringify(scorchEffect)}"`)
    }
    const hasScorchEffect =
      scorchEffect &&
      newUnit.effects &&
      newUnit.effects.map((id) => id.toString()).includes(scorchEffect._id.toString())
    if (ScorchBattlefield.logger.isTraceEnabled()) {
      ScorchBattlefield.logger.trace(`${logPrefix} hasScorchEffect: "${hasScorchEffect}"`)
    }

    if (hasScorchEffect) {
      ScorchBattlefield.logger.debug(`${logPrefix} unit "${newUnit.name}" has scorch effect, applying it`)
      const gameUnits = getGameUnits({
        combat: newUnit.scorchScope,
        players: newUnit.scorchScope
          ? game.players.filter((player) => player.user.toString() !== game.turn?.toString())
          : game.players,
        round: game.round,
      })
      if (ScorchBattlefield.logger.isTraceEnabled()) {
        ScorchBattlefield.logger.trace(`${logPrefix} gameUnits: "${JSON.stringify(gameUnits)}"`)
      }

      const strongestUnitIds = GetStrongestNonHeroUnitIds.getStrongestNonHeroUnitIds({
        gameUnits,
        logPrefix,
        units: battlefieldUnits,
      })
      if (ScorchBattlefield.logger.isTraceEnabled()) {
        ScorchBattlefield.logger.trace(`${logPrefix} strongestUnitIds: "${JSON.stringify(strongestUnitIds)}"`)
      }

      for (const player of game.players) {
        ScorchBattlefield.scorchPlayer({
          battlefieldUnits,
          player,
          round: game.round,
          turn: game.turn,
          logPrefix: `${logPrefix} player "${player.user}"`,
          scorchingDeckUnit: newDeckUnit,
          scorchingUnit: newUnit,
          strongestUnitIdsOnBattlefield: strongestUnitIds,
        })
      }
    }
  }

  private static scorchPlayer({
    battlefieldUnits,
    player,
    round,
    turn,
    logPrefix,
    scorchingUnit,
    scorchingDeckUnit,
    strongestUnitIdsOnBattlefield,
  }: {
    battlefieldUnits: UnitDbObject[]
    player: GamePlayerDbObject
    round: number
    turn: ObjectId | undefined
    logPrefix: string
    scorchingUnit: UnitDbObject
    scorchingDeckUnit: DeckUnitDbObject
    strongestUnitIdsOnBattlefield: string[]
  }) {
    if (scorchingUnit.name === 'Scorch' && player.user.toString() === turn?.toString()) {
      // the named "Scorch" card does not stay on the battlefield
      player.deck.discard.push(scorchingDeckUnit)
      ScorchBattlefield.logger.trace(
        `${logPrefix} newUnit "${scorchingUnit._id}" has name "Scorch" and current player, so discarding it`
      )
    }

    // if no scorch scope, anyone can be effected/scorched
    // if scorch scope, only opponents (players who are not the current game turn player) can be effected/scorched
    const scorchablePlayer = !scorchingUnit.scorchScope || player.user.toString() !== turn?.toString()
    ScorchBattlefield.logger.trace(`${logPrefix} scorchablePlayer: "${scorchablePlayer}"`)

    if (scorchablePlayer) {
      ScorchBattlefield.scorchUnitsForPlayer({
        battlefieldUnits,
        logPrefix,
        player,
        round,
        scorchingUnit,
        strongestUnitIdsOnBattlefield,
      })
    }
  }

  private static scorchUnitsForPlayer({
    battlefieldUnits,
    player,
    round,
    logPrefix,
    scorchingUnit,
    strongestUnitIdsOnBattlefield,
  }: {
    battlefieldUnits: UnitDbObject[]
    player: GamePlayerDbObject
    round: number
    logPrefix: string
    scorchingUnit: UnitDbObject
    strongestUnitIdsOnBattlefield: string[]
  }) {
    const unitsScorched: GameUnitDbObject[] = []
    const playerRound = player.rounds[round - 1]
    const rows = ScorchBattlefield.getRowsToScorch({
      logPrefix,
      playerRound,
      scorchingUnit,
    })
    for (const roundRow of rows) {
      let unitIdsToScorch = strongestUnitIdsOnBattlefield
      if (scorchingUnit.scorchScope) {
        ScorchBattlefield.logger.debug(
          `${logPrefix} scorchingUnit "${scorchingUnit.name}" has scorchScope of "${scorchingUnit.scorchScope}" so getting strongest units in just that row to scorch`
        )
        unitIdsToScorch = GetStrongestNonHeroUnitIds.getStrongestNonHeroUnitIds({
          gameUnits: roundRow.units,
          logPrefix,
          units: battlefieldUnits,
        })
      }
      unitsScorched.push(
        ...ScorchBattlefield.scorchUnitsInRow({
          row: roundRow,
          unitIdsToScorch,
        })
      )
    }
    if (ScorchBattlefield.logger.isTraceEnabled()) {
      ScorchBattlefield.logger.trace(`${logPrefix} unitsLost: "${JSON.stringify(unitsScorched)}"`)
    }

    if (unitsScorched.length > 0) {
      ScorchBattlefield.logger.debug(
        `${logPrefix} unit "${scorchingUnit.name}" scorched units "${JSON.stringify(
          unitsScorched.map((gameUnit) => gameUnit.unit)
        )}"`
      )
      player.deck.discard.push(...unitsScorched)
    }
  }

  private static getRowsToScorch({
    logPrefix,
    playerRound,
    scorchingUnit,
  }: {
    logPrefix: string
    playerRound: PlayerRoundDbObject
    scorchingUnit: UnitDbObject
  }): PlayerCombatRowDbObject[] {
    const rows: PlayerCombatRowDbObject[] = []
    if (scorchingUnit.scorchScope) {
      ScorchBattlefield.addRowToScorchIfEligible({
        combat: Combat.Close,
        logPrefix,
        playerCombatRow: playerRound.close,
        rows,
        scorchingUnit,
      })
      ScorchBattlefield.addRowToScorchIfEligible({
        combat: Combat.Ranged,
        logPrefix,
        playerCombatRow: playerRound.ranged,
        rows,
        scorchingUnit,
      })
      ScorchBattlefield.addRowToScorchIfEligible({
        combat: Combat.Siege,
        logPrefix,
        playerCombatRow: playerRound.siege,
        rows,
        scorchingUnit,
      })
    } else {
      ScorchBattlefield.logger.trace(
        `${logPrefix} no scorchScope for scorchingUnit "${scorchingUnit.name}", all combat rows eligible for scorching`
      )
      rows.push(playerRound.close, playerRound.ranged, playerRound.siege)
    }
    return rows
  }

  private static addRowToScorchIfEligible({
    combat,
    logPrefix,
    playerCombatRow,
    rows,
    scorchingUnit,
  }: {
    combat: Combat
    logPrefix: string
    playerCombatRow: PlayerCombatRowDbObject
    rows: PlayerCombatRowDbObject[]
    scorchingUnit: UnitDbObject
  }) {
    if (scorchingUnit.scorchScope === combat) {
      if (scorchingUnit.scorchMin) {
        if (playerCombatRow.score >= scorchingUnit.scorchMin) {
          ScorchBattlefield.logger.trace(
            `${logPrefix} including combat row "${combat}" as strength of "${playerCombatRow.score}" is greater than or equal to scorchMin of "${scorchingUnit.scorchMin}" for scorchingUnit "${scorchingUnit}"`
          )
          rows.push(playerCombatRow)
        } else {
          ScorchBattlefield.logger.trace(
            `${logPrefix} not including combat row "${combat}" as strength of "${playerCombatRow.score}" is less than scorchMin of "${scorchingUnit.scorchMin}" for scorchingUnit "${scorchingUnit}"`
          )
        }
      } else {
        ScorchBattlefield.logger.trace(
          `${logPrefix} including combat row "${combat}" as it matches scorchScope of "${scorchingUnit.scorchScope}" for scorchingUnit "${scorchingUnit.name}"`
        )
        rows.push(playerCombatRow)
      }
    } else {
      ScorchBattlefield.logger.trace(
        `${logPrefix} not including combat row "${combat}" as it does not match scorchScope of "${scorchingUnit.scorchScope}" for scorchingUnit "${scorchingUnit.name}"`
      )
    }
  }

  private static scorchUnitsInRow({
    row,
    unitIdsToScorch,
  }: {
    row: PlayerCombatRowDbObject
    unitIdsToScorch: string[]
  }): GameUnitDbObject[] {
    const unitsScorched: GameUnitDbObject[] = []

    for (let i = 0; i < row.units.length; i++) {
      const gameUnit = row.units[i]
      if (unitIdsToScorch.includes(gameUnit.unit.toString())) {
        row.units.splice(i, 1)
        i = i - 1
        unitsScorched.push(gameUnit)
      }
    }

    return unitsScorched
  }
}
