import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import {
  Combat,
  DeckUnitDbObject,
  GameDbObject,
  GameUnitDbObject,
  MoveReasonType,
  GameUnitOrigin,
  MoveUnitDbObject,
  MoveDbObject,
  MoveUnitReasonDbObject,
} from '@gwent/graphql-schema/database-typings'
import GetBattlefieldUnit from './get-battlefield-unit'
import { ImpactsByUnitId } from '../../resolver-util'
import { MoveType } from '@gwent/graphql-schema'
import { MusteredOrigins } from './effect-muster'
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
   * @param config.combat Which combat row the new unit is being deployed to on the battlefield.
   * @param config.scorches Any potential units the new battlefield unit scorched when deployed.
   * @param config.mardroemes Any potential berserkers the new battlefield unit transformed into vildkaarls.
   * @param config.mardroemingGameUnit A potential GameUnit which caused the berserkers to transform.
   * @param config.transformedGameUnits Any potential new vilkcaarls.
   * @param config.musters Any potential units the new battlefield unit mustered when deployed.
   * @param config.bonds Any potential units that were bonded due to the new battlefield unit being played.
   * @param config.horns Any potential units that were horned due to the new battlefield unit being played.
   * @param config.morales Any potential units the new battlefield unit moraled when deployed.
   * @param config.decoys Any potential units that were decoyed by the new battlefield unit being played.
   * @param config.musteredOrigins A map of where any potential mustered units came from.
   */
  static newUnitDeployed({
    game,
    deckUnit,
    playerId,
    logPrefix,
    combat,
    decoys,
    scorches,
    mardroemes,
    mardroemingGameUnit,
    transformedGameUnits,
    musters,
    bonds,
    horns,
    morales,
    weathers,
    musteredOrigins,
  }: {
    game: GameDbObject
    deckUnit: DeckUnitDbObject
    playerId: string
    logPrefix: string
    combat: Combat | null | undefined
    decoys: ImpactsByUnitId
    scorches: ImpactsByUnitId
    mardroemes: ImpactsByUnitId
    transformedGameUnits?: GameUnitDbObject[]
    mardroemingGameUnit?: GameUnitDbObject
    musters: ImpactsByUnitId
    bonds: ImpactsByUnitId
    horns: ImpactsByUnitId
    morales: ImpactsByUnitId
    weathers: ImpactsByUnitId
    musteredOrigins: MusteredOrigins | undefined
  }) {
    const battlefieldUnit = GetBattlefieldUnit.getBattlefieldUnit({
      game,
      unitId: deckUnit.unit,
      userId: playerId,
    })
    const impacts =
      bonds[deckUnit.unit.toString()] ||
      horns[deckUnit.unit.toString()] ||
      mardroemes[deckUnit.unit.toString()] ||
      morales[deckUnit.unit.toString()] ||
      musters[deckUnit.unit.toString()] ||
      scorches[deckUnit.unit.toString()] ||
      decoys[deckUnit.unit.toString()] ||
      weathers[deckUnit.unit.toString()]
    const move: MoveUnitDbObject = {
      created: new Date(),
      unit: {
        artStyle: deckUnit.artStyle,
        unit: deckUnit.unit,
        effectiveStrength: battlefieldUnit?.unit.effectiveStrength,
        effects: battlefieldUnit?.unit.effects,
        row: combat,
      },
      impacts,
      reason: {
        type: MoveReasonType.Deploy,
      },
      source: {
        origin: GameUnitOrigin.Hand,
      },
      type: MoveType.Unit,
    }
    UpdateHistory.addMoveToCurrentPlayer({
      game,
      move,
    })

    if (transformedGameUnits) {
      for (const transformedGameUnit of transformedGameUnits) {
        UpdateHistory.newUnitIndirect({
          bonds,
          created: move.created,
          game,
          horns,
          decoys,
          logPrefix,
          mardroemes,
          morales,
          musters,
          weathers,
          origin: GameUnitOrigin.Nondeck,
          playerId,
          reason: {
            type: MoveReasonType.Transform,
            unit: mardroemingGameUnit
              ? {
                  artStyle: mardroemingGameUnit.artStyle,
                  unit: mardroemingGameUnit.unit,
                }
              : deckUnit,
          },
          scorches,
          unitId: transformedGameUnit.unit,
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
          decoys,
          logPrefix,
          mardroemes,
          morales,
          musters,
          weathers,
          origin,
          playerId,
          reason: {
            type: MoveReasonType.Muster,
            unit: deckUnit,
          },
          scorches,
          unitId: muster.unit.unit,
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
   * @param config.logPrefix What to prepend log statements with.
   * @param config.scorches Any potential units the new battlefield unit scorched when deployed.
   * @param config.mardroemes Any potential berserkers the new battlefield unit transformed into vildkaarls.
   * @param config.musters Any potential units the new battlefield unit mustered when deployed.
   * @param config.bonds Any potential units that were bonded due to the new battlefield unit being played.
   * @param config.horns Any potential units that were horned due to the new battlefield unit being played.
   * @param config.decoys Any potential units that were decoyed by the new battlefield unit being played.
   * @param config.morales Any potential units the new battlefield unit moraled when deployed.
   * @param config.weathers Any potential units the new battlefield unit Weathered when deployed.
   * @param config.reason Why the new unit is indirectly being added to the battlefield.
   * @param config.origin Where the new unit came from.
   */
  private static newUnitIndirect({
    game,
    unitId,
    created,
    playerId,
    logPrefix,
    origin,
    scorches,
    mardroemes,
    musters,
    bonds,
    horns,
    decoys,
    morales,
    weathers,
    reason,
  }: {
    game: GameDbObject
    unitId: ObjectId
    created: Date
    playerId: string
    logPrefix: string
    origin: GameUnitOrigin
    scorches: ImpactsByUnitId
    mardroemes: ImpactsByUnitId
    musters: ImpactsByUnitId
    bonds: ImpactsByUnitId
    horns: ImpactsByUnitId
    decoys: ImpactsByUnitId
    morales: ImpactsByUnitId
    weathers: ImpactsByUnitId
    reason: MoveUnitReasonDbObject
  }) {
    const battlefieldUnit = GetBattlefieldUnit.getBattlefieldUnit({
      game,
      unitId,
      userId: playerId,
    })
    if (!battlefieldUnit) {
      const message = `Could not find indirect unit "${unitId}" on battlefield`
      UpdateHistory.logger.error(`${logPrefix} failed: ${message}`)
      throw Error(`${message}.`)
    }
    const impacts =
      scorches[unitId.toString()] ||
      mardroemes[unitId.toString()] ||
      musters[unitId.toString()] ||
      bonds[unitId.toString()] ||
      horns[unitId.toString()] ||
      morales[unitId.toString()] ||
      decoys[unitId.toString()] ||
      weathers[unitId.toString()]
    const move: MoveUnitDbObject = {
      created,
      reason,
      type: MoveType.Unit,
      unit: {
        artStyle: battlefieldUnit.unit.artStyle,
        unit: battlefieldUnit.unit.unit,
        effectiveStrength: battlefieldUnit.unit.effectiveStrength,
        effects: battlefieldUnit.unit.effects,
        row: battlefieldUnit.row,
      },
      impacts,
      source: {
        origin,
      },
    }
    UpdateHistory.addMoveToCurrentPlayer({
      game,
      move,
    })
  }

  /**
   * Add a move to the current player on a Game.
   *
   * @param config The configuration used to add the Move to the Game player.
   * @param config.game The game containing the player to add the Move to, based on the current turn in the Game.
   * @param config.move The move to add to the current player on the Game.
   */
  static addMoveToCurrentPlayer({ game, move }: { game: GameDbObject; move: MoveDbObject }) {
    const player = game.players.find((player) => player.user.toString() === game.turn?.toString())
    if (player) {
      player.rounds[game.round - 1].moves.push(move)
    } else {
      throw new PresentableError(`Could not find player "${game.turn}" on game "${game._id}" to add move to.`)
    }
  }
}
