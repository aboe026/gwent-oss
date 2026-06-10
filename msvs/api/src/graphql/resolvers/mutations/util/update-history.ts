import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import {
  Combat,
  DeckUnitDbObject,
  GameDbObject,
  MoveReasonType,
  GameUnitOrigin,
  MoveUnitDbObject,
  MoveDbObject,
  MoveUnitReasonDbObject,
  GameUnitDbObject,
  WeatherUnitDbObject,
  FieldUnitDbObject,
  ImpactDbObject,
} from '@gwent/graphql-schema/database-typings'
import { GameUnitType, MoveType } from '@gwent/graphql-schema'
import GetFieldUnits from '../../util/get-field-units'
import { ImpactsByUnitId } from '../../resolver-util'
import mergeImpacts from '../play-unit/merge-impacts'
import { MusteredOrigins } from '../play-unit/effect-muster'
import PresentableError from '../../../../util/presentable-error'

/**
 * A class to update the Move history on a Game.
 */
export default class UpdateHistory {
  private static logger = getLogger('UpdateHistory')

  /**
   * Add Moves in a Game with due to the deployment of a new unit to the battlefield.
   *
   * @param config The configuration used to add the new Move(s) to the Game.
   * @param config.game The game whose current player should have the move(s) added to.
   * @param config.deckUnit The new DeckUnit being deployed to the battlefield.
   * @param config.playerId The ID of the game player who is deploying the new unit to the battlefield.
   * @param config.logPrefix What to prepend log statements with.
   * @param config.scorches Any potential units the new battlefield unit scorched when deployed.
   * @param config.mardroemes Any potential berserkers the new battlefield unit transformed into vildkaarls.
   * @param config.mardroemingFieldUnit A potential FieldUnit which caused the berserkers to transform.
   * @param config.transformedFieldUnits Any potential new vilkcaarls.
   * @param config.musters Any potential units the new battlefield unit mustered when deployed.
   * @param config.bonds Any potential units that were bonded due to the new battlefield unit being played.
   * @param config.horns Any potential units that were horned due to the new battlefield unit being played.
   * @param config.morales Any potential units the new battlefield unit moraled when deployed.
   * @param config.avengers Any potential units which were avenged by units leaving the battlefield.
   * @param config.decoys Any potential units that were decoyed by the new battlefield unit being played.
   * @param config.spies Any potential units that were spied by the new battlefield unit being played.
   * @param config.targetId The potential target an effect is being applied to.
   * @param config.weathers Any potential weather units that were deployed by the new battlefield unit being played.
   * @param config.medics Any potential medic units deployed to the battlefield.
   * @param config.musteredOrigins A map of where any potential mustered units came from.
   * @param config.isWeather Whether or not the new unit is weathering the battlefield.
   * @param config.combat The combat row the new unit is being deployed into.
   * @param config.medicingUnit If the unit is being revived by a Medic, the medic which is reviving the unit.
   */
  static newUnitDeployed({
    game,
    deckUnit,
    playerId,
    logPrefix,
    avengers,
    decoys,
    spies,
    scorches,
    mardroemes,
    mardroemingFieldUnit,
    transformedFieldUnits,
    musters,
    bonds,
    horns,
    morales,
    weathers,
    medics,
    musteredOrigins,
    targetId,
    isWeather,
    combat,
    medicingUnit,
  }: {
    game: GameDbObject
    deckUnit: DeckUnitDbObject
    playerId: string
    logPrefix: string
    avengers: ImpactsByUnitId
    decoys: ImpactsByUnitId
    spies: ImpactsByUnitId
    scorches: ImpactsByUnitId
    mardroemes: ImpactsByUnitId
    transformedFieldUnits?: FieldUnitDbObject[]
    mardroemingFieldUnit?: FieldUnitDbObject
    musters: ImpactsByUnitId
    bonds: ImpactsByUnitId
    horns: ImpactsByUnitId
    morales: ImpactsByUnitId
    weathers: ImpactsByUnitId
    medics: ImpactsByUnitId
    musteredOrigins: MusteredOrigins | undefined
    targetId: string | null | undefined
    isWeather: boolean
    combat: Combat | null | undefined
    medicingUnit?: GameUnitDbObject | undefined
  }) {
    const fieldUnit = GetFieldUnits.getFieldUnit({
      game,
      unitId: deckUnit.unit,
      userId: targetId || playerId,
    })
    const impacts = mergeImpacts(
      avengers,
      bonds,
      decoys,
      horns,
      mardroemes,
      morales,
      musters,
      scorches,
      spies,
      medics,
      weathers
    )[deckUnit.unit.toString()]
    const updatedImpacts = UpdateHistory.updateImpactFieldUnits({
      game,
      impacts,
    })
    const gameUnit = UpdateHistory.getMoveGameUnit({
      fieldUnit,
      deckUnit,
      isWeather,
      combat,
    })

    const move: MoveUnitDbObject = {
      created: new Date(),
      unit: gameUnit,
      impacts: updatedImpacts,
      reason: {
        type: medicingUnit ? MoveReasonType.Revive : MoveReasonType.Deploy,
      },
      source: {
        origin: GameUnitOrigin.Hand,
      },
      type: MoveType.Unit,
    }
    if (targetId) {
      move.target = new ObjectId(targetId)
    }
    if (medicingUnit) {
      move.reason.unit = medicingUnit
    }
    UpdateHistory.addMoveToPlayer({
      game,
      move,
      logPrefix,
      playerId,
    })

    if (transformedFieldUnits) {
      for (const transformedFieldUnit of transformedFieldUnits) {
        const mardroemeGameUnit: GameUnitDbObject = mardroemingFieldUnit
          ? {
              ...mardroemingFieldUnit,
              type: GameUnitType.Field,
            }
          : gameUnit
        UpdateHistory.newUnitIndirect({
          bonds,
          created: move.created,
          game,
          horns,
          decoys,
          spies,
          logPrefix,
          mardroemes,
          morales,
          avengers,
          musters,
          medics,
          weathers,
          origin: GameUnitOrigin.Nondeck,
          playerId,
          reason: {
            type: MoveReasonType.Transform,
            unit: mardroemeGameUnit,
          },
          scorches,
          unitId: transformedFieldUnit.unit,
        })
      }
    }

    if (musters[deckUnit.unit.toString()]) {
      if (!musteredOrigins) {
        const message = 'No origins provided for musters'
        UpdateHistory.logger.error(`${logPrefix} failed: ${message}, musters: "${JSON.stringify(musters)}"`)
        throw Error(`${message}.`)
      }
      for (const muster of musters[deckUnit.unit.toString()]) {
        if (!muster.unit) {
          const message = 'No unit provided for muster'
          UpdateHistory.logger.error(`${logPrefix} failed: ${message}, musters: "${JSON.stringify(musters)}"`)
          throw Error(`${message}.`)
        }
        const origin = musteredOrigins[muster.unit.unit.toString()]
        if (!origin) {
          const message = `Could not find origin for mustered unit "${muster.unit.unit}"`
          UpdateHistory.logger.error(`${logPrefix} failed: ${message}`)
          throw Error(`${message}.`)
        }
        UpdateHistory.newUnitIndirect({
          bonds,
          created: move.created,
          game,
          horns,
          avengers,
          decoys,
          spies,
          logPrefix,
          mardroemes,
          morales,
          musters,
          weathers,
          medics,
          origin,
          playerId,
          reason: {
            type: MoveReasonType.Muster,
            unit: gameUnit,
          },
          scorches,
          unitId: muster.unit.unit,
        })
      }
    }

    for (const avengerUnitId of Object.keys(avengers)) {
      const avengees = avengers[avengerUnitId]
      for (const avengee of avengees) {
        UpdateHistory.newUnitIndirect({
          bonds,
          created: move.created,
          game,
          horns,
          decoys,
          spies,
          logPrefix,
          mardroemes,
          morales,
          medics,
          musters,
          avengers: {
            [avengerUnitId]: [avengee],
          },
          weathers,
          origin: GameUnitOrigin.Nondeck,
          playerId: avengee.user.toString(),
          turnUserId: playerId,
          reason: {
            type: MoveReasonType.Summon,
            unit: avengee.unit,
          },
          scorches,
          unitId: avengerUnitId,
          targetId: avengee.user,
        })
      }
    }
  }

  /**
   * Add Moves in a Game with due to a new unit being added to the battlefield indirectly by another unit.
   *
   * @param config The configuration used to add the new Move(s) to the Game.
   * @param config.game The game whose current player should have the move(s) added to.
   * @param config.unitId The new ID of the unit being indirectly added to the battlefield.
   * @param config.created The Date the move was made to add the unit indirectly to the battlefield.
   * @param config.playerId The ID of the game player who is deploying the new unit to the battlefield.
   * @param config.turnUserId The ID of the User whose turn it currently is.
   * @param config.logPrefix What to prepend log statements with.
   * @param config.scorches Any potential units the new battlefield unit scorched when deployed.
   * @param config.mardroemes Any potential berserkers the new battlefield unit transformed into vildkaarls.
   * @param config.musters Any potential units the new battlefield unit mustered when deployed.
   * @param config.medics Any potential medic units deployed to the battlefield.
   * @param config.bonds Any potential units that were bonded due to the new battlefield unit being played.
   * @param config.horns Any potential units that were horned due to the new battlefield unit being played.
   * @param config.avengers Any potential units that were summoned to the battlefield due to avengers leaving.
   * @param config.decoys Any potential units that were decoyed by the new battlefield unit being played.
   * @param config.spies Any potential units that were spied by the new battlefield unit being played.
   * @param config.morales Any potential units the new battlefield unit moraled when deployed.
   * @param config.weathers Any potential units the new battlefield unit Weathered when deployed.
   * @param config.reason Why the new unit is indirectly being added to the battlefield.
   * @param config.origin Where the new unit came from.
   * @param config.targetId The potential targeted player the new unit being added is for.
   */
  static newUnitIndirect({
    game,
    unitId,
    created,
    playerId,
    turnUserId,
    logPrefix,
    origin,
    scorches = {},
    mardroemes = {},
    musters = {},
    medics = {},
    bonds = {},
    horns = {},
    avengers = {},
    decoys = {},
    spies = {},
    morales = {},
    weathers = {},
    reason,
    targetId,
  }: {
    game: GameDbObject
    unitId: ObjectId | string
    created: Date
    playerId: string
    turnUserId?: ObjectId | string
    logPrefix: string
    origin: GameUnitOrigin
    scorches?: ImpactsByUnitId
    mardroemes?: ImpactsByUnitId
    musters?: ImpactsByUnitId
    medics?: ImpactsByUnitId
    bonds?: ImpactsByUnitId
    horns?: ImpactsByUnitId
    avengers?: ImpactsByUnitId
    decoys?: ImpactsByUnitId
    spies?: ImpactsByUnitId
    morales?: ImpactsByUnitId
    weathers?: ImpactsByUnitId
    reason: MoveUnitReasonDbObject
    targetId?: ObjectId
  }) {
    const fieldUnit = GetFieldUnits.getFieldUnit({
      game,
      unitId,
      userId: playerId,
    })
    if (!fieldUnit) {
      const message = `Could not find indirect unit "${unitId}" on battlefield`
      UpdateHistory.logger.error(`${logPrefix} failed: ${message}`)
      throw Error(`${message}.`)
    }
    const impacts = mergeImpacts(
      avengers,
      bonds,
      decoys,
      horns,
      mardroemes,
      morales,
      musters,
      scorches,
      medics,
      spies,
      weathers
    )[unitId.toString()]
    const move: MoveUnitDbObject = {
      created,
      reason,
      type: MoveType.Unit,
      unit: {
        ...fieldUnit,
        type: GameUnitType.Field,
      },
      impacts,
      source: {
        origin,
      },
      target: targetId,
    }
    UpdateHistory.addMoveToPlayer({
      game,
      move,
      playerId: turnUserId || playerId,
      logPrefix,
    })
  }

  /**
   * Add a move to the current player on a Game.
   *
   * @param config The configuration used to add the Move to the Game player.
   * @param config.game The game containing the player to add the Move to, based on the current turn in the Game.
   * @param config.move The move to add to the current player on the Game.
   * @param config.playerId The ID of the User on the Game to add the move to.
   * @param config.logPrefix What to prepend log statements with.
   */
  static addMoveToPlayer({
    game,
    move,
    logPrefix,
    playerId,
  }: {
    game: GameDbObject
    move: MoveDbObject
    logPrefix: string
    playerId: ObjectId | string
  }) {
    const player = game.players.find((player) => player.user.toString() === playerId.toString())
    if (player) {
      player.rounds[game.round - 1].moves.push(move)
    } else {
      const message = `Could not find player "${playerId}" on game "${game._id}" to add move to`
      UpdateHistory.logger.error(`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`)
      throw new PresentableError(`${message}.`)
    }
  }

  static updateLastMoveImpactWithUnit({
    game,
    logPrefix,
    playerId,
    unitId,
  }: {
    game: GameDbObject
    logPrefix: string
    playerId: ObjectId | string
    unitId: ObjectId | string
  }): GameUnitDbObject {
    const player = game.players.find((player) => player.user.toString() === playerId.toString())
    if (player) {
      const round = player.rounds[game.round - 1]
      const move = round.moves.at(-1)
      if (move) {
        if (move.type === MoveType.Unit) {
          const unitMove = move as MoveUnitDbObject
          if (unitMove.impacts) {
            const impact = unitMove.impacts[0]
            if (impact) {
              if (impact.unit) {
                const message = `Unit already set to "${impact.unit.unit}" for last move`
                UpdateHistory.logger.error(`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`)
                throw new PresentableError(`${message}.`)
              } else {
                const fieldUnit = GetFieldUnits.getFieldUnit({
                  game,
                  unitId,
                  userId: playerId,
                })
                if (fieldUnit) {
                  impact.unit = {
                    ...fieldUnit,
                    type: GameUnitType.Field,
                  }
                  return unitMove.unit
                } else {
                  const message = `Could not find unit "${unitId}" on battlefield to update latest impact with`
                  UpdateHistory.logger.error(`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`)
                  throw new PresentableError(`${message}.`)
                }
              }
            } else {
              const message = `No impact found for move to add unit to`
              UpdateHistory.logger.error(`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`)
              throw new PresentableError(`${message}.`)
            }
          } else {
            const message = `No impacts found for move to add unit to`
            UpdateHistory.logger.error(`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`)
            throw new PresentableError(`${message}.`)
          }
        } else {
          const message = `Invalid last move type "${move.type}", expecting "${MoveType.Unit}"`
          UpdateHistory.logger.error(`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`)
          throw new PresentableError(`${message}.`)
        }
      } else {
        const message = `Could not find last move for player "${playerId}" to update impact with unit for`
        UpdateHistory.logger.error(`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`)
        throw new PresentableError(`${message}.`)
      }
    } else {
      const message = `Could not find player "${playerId}" on game "${game._id}" to update impact with unit for`
      UpdateHistory.logger.error(`${logPrefix} failed: ${message}, game: "${JSON.stringify(game)}"`)
      throw new PresentableError(`${message}.`)
    }
  }

  /**
   * Get the GameUnit database object for a Move.
   *
   * @param config The configuration used to determine the GameUnit for the Move.
   * @param config.deckUnit The DeckUnit which made the Move.
   * @param config.fieldUnit The potential FieldUnit the DeckUnit became upon Movement.
   * @param config.isWeather Whether or not the Move was to Weather the battlefield.
   * @param config.combat The potential Combat row the Move was for.
   * @returns The GameUnit database object for the Move.
   */
  static getMoveGameUnit({
    deckUnit,
    fieldUnit,
    isWeather,
    combat,
  }: {
    deckUnit: DeckUnitDbObject
    fieldUnit: FieldUnitDbObject | undefined
    isWeather?: boolean
    combat?: Combat | null | undefined
  }): GameUnitDbObject {
    let gameUnit: GameUnitDbObject
    const row: Combat | null | undefined = fieldUnit?.row ? (fieldUnit.row as Combat) : combat
    if (isWeather) {
      const weatherUnit: WeatherUnitDbObject = {
        unit: deckUnit.unit,
        artStyle: deckUnit.artStyle,
      }
      gameUnit = {
        ...weatherUnit,
        type: GameUnitType.Weather,
      }
    } else if (row) {
      const resolvedFieldUnit: FieldUnitDbObject = {
        artStyle: deckUnit.artStyle,
        row,
        unit: deckUnit.unit,
        effectiveStrength: fieldUnit?.effectiveStrength,
        effects: fieldUnit?.effects,
      }
      gameUnit = {
        ...resolvedFieldUnit,
        type: GameUnitType.Field,
      }
    } else {
      gameUnit = {
        unit: deckUnit.unit,
        artStyle: deckUnit.artStyle,
        type: GameUnitType.Deck,
      }
    }

    return gameUnit
  }

  /**
   * Returns the Impacts with their FieldUnits updated to accurately reflect their current state in the game.
   *
   * @param config The configuration used to update the Impacts with their FieldUnits.
   * @param config.game The Game the impacts are apart of.
   * @param config.impacts The Impacts whose FieldUnits should be updated.
   * @returns The Impact objects with updated FieldUnits.
   */
  static updateImpactFieldUnits({
    game,
    impacts,
  }: {
    game: GameDbObject
    impacts: ImpactDbObject[] | undefined
  }): ImpactDbObject[] | undefined {
    if (impacts) {
      return impacts.map((impact) => {
        if (impact.unit && impact.unit.type === GameUnitType.Field) {
          const impactBattlefieldUnit = GetFieldUnits.getFieldUnit({
            game,
            unitId: impact.unit?.unit,
            userId: impact.user,
          })
          if (impactBattlefieldUnit) {
            const newImpactUnit: GameUnitDbObject = {
              ...impactBattlefieldUnit,
              type: GameUnitType.Field,
            }
            impact.unit = newImpactUnit
          }
        }
        return impact
      })
    }
  }
}
