import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import {
  DeckUnitDbObject,
  EffectDbObject,
  EffectKey,
  GameDbObject,
  GamePlayerDbObject,
  GameUnitDbObject,
  PlayerCombatRowDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import getEffectWithKey from './get-effect-with-key'
import getGameUnits from './get-game-units'
import getStrongestNonHeroUnits from './get-strongest-non-hero-units'

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

    const scorchEffect = getEffectWithKey({
      effectKey: EffectKey.Scorch,
      effects,
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

      const strongestGameUnits = getStrongestNonHeroUnits({
        gameUnits,
        units: battlefieldUnits,
        minimumStrength: newUnit.scorchMin,
      })
      if (ScorchBattlefield.logger.isTraceEnabled()) {
        ScorchBattlefield.logger.trace(`${logPrefix} strongestGameUnits: "${JSON.stringify(strongestGameUnits)}"`)
      }

      const strongestUnitIds = strongestGameUnits.map((gameUnit) => gameUnit.unit.toString())
      if (ScorchBattlefield.logger.isTraceEnabled()) {
        ScorchBattlefield.logger.trace(`${logPrefix} strongestUnitIds: "${JSON.stringify(strongestUnitIds)}"`)
      }

      for (const player of game.players) {
        ScorchBattlefield.scorchUnitsForPlayer({
          player,
          round: game.round,
          turn: game.turn,
          logPrefix,
          scorchingDeckUnit: newDeckUnit,
          scorchingUnit: newUnit,
          strongestUnitIds,
        })
      }
    }
  }

  private static scorchUnitsForPlayer({
    player,
    round,
    turn,
    logPrefix,
    scorchingUnit,
    scorchingDeckUnit,
    strongestUnitIds,
  }: {
    player: GamePlayerDbObject
    round: number
    turn: ObjectId | undefined
    logPrefix: string
    scorchingUnit: UnitDbObject
    scorchingDeckUnit: DeckUnitDbObject
    strongestUnitIds: string[]
  }) {
    if (scorchingUnit.name === 'Scorch' && player.user.toString() === turn?.toString()) {
      // the named "Scorch" card does not stay on the battlefield
      player.deck.discard.push(scorchingDeckUnit)
      if (ScorchBattlefield.logger.isTraceEnabled()) {
        ScorchBattlefield.logger.trace(
          `${logPrefix} newUnit "${scorchingUnit._id}" has name "Scorch" and played by current player "${player.user}", so discarding it`
        )
      }
    }

    // if no scorch scope, anyone can be effected/scorched
    // if scorch scope, only opponents (players who are not the current game turn player) can be effected/scorched
    const scorchablePlayer = !scorchingUnit.scorchScope || player.user.toString() !== turn?.toString()
    if (ScorchBattlefield.logger.isTraceEnabled()) {
      ScorchBattlefield.logger.trace(`${logPrefix} scorchablePlayer "${scorchablePlayer}" for player "${player.user}"`)
    }

    if (strongestUnitIds.length > 0 && scorchablePlayer) {
      const unitsScorched: GameUnitDbObject[] = []
      const playerRound = player.rounds[round - 1]
      for (const roundRow of [playerRound.close, playerRound.ranged, playerRound.siege]) {
        unitsScorched.push(
          ...ScorchBattlefield.scorchUnitsInRow({
            row: roundRow,
            strongestUnitIds,
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
          )}" for player "${player.user}"`
        )
        player.deck.discard.push(...unitsScorched)
      }
    }
  }

  private static scorchUnitsInRow({
    row,
    strongestUnitIds,
  }: {
    row: PlayerCombatRowDbObject
    strongestUnitIds: string[]
  }): GameUnitDbObject[] {
    // TODO: add logging
    const unitsScorched: GameUnitDbObject[] = []

    for (let i = 0; i < row.units.length; i++) {
      const gameUnit = row.units[i]
      if (strongestUnitIds.includes(gameUnit.unit.toString())) {
        row.units.splice(i, 1)
        i = i - 1
        unitsScorched.push(gameUnit)
      }
    }

    return unitsScorched
  }
}
