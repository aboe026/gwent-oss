import { getLogger } from 'log4js'

import {
  Combat,
  DeckUnitDbObject,
  GameDbObject,
  ImpactDbObject,
  MoveReasonType,
  GameUnitOrigin,
  MoveUnitDbObject,
  MoveDbObject,
} from '@gwent/graphql-schema/database-typings'
import GetBattlefieldUnit from './get-battlefield-unit'
import { MoveType } from '@gwent/graphql-schema'
import { MusteredOrigins } from './muster-battlefield'
import PresentableError from '../../../../util/presentable-error'

export default class UpdateHistory {
  private static logger = getLogger('UpdateHistory')

  static newUnitDeployed({
    game,
    deckUnit,
    playerId,
    logPrefix,
    combat,
    scorches,
    musters,
    strengths,
    musteredOrigins,
  }: {
    game: GameDbObject
    deckUnit: DeckUnitDbObject
    playerId: string
    logPrefix: string
    combat: Combat | null | undefined
    scorches: ImpactDbObject[] | undefined
    musters: ImpactDbObject[] | undefined
    strengths: ImpactDbObject[] | undefined
    musteredOrigins: MusteredOrigins | undefined
  }) {
    const battlefieldUnit = GetBattlefieldUnit.getBattlefieldUnit({
      game,
      unitId: deckUnit.unit,
      userId: playerId,
    })
    const move: MoveUnitDbObject = {
      created: new Date(),
      unit: {
        artStyle: deckUnit.artStyle,
        unit: deckUnit.unit,
        effectiveStrength: battlefieldUnit?.unit.effectiveStrength,
        effects: battlefieldUnit?.unit.effects,
        row: combat,
      },
      impacts: scorches || musters || strengths,
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

    if (musters) {
      if (!musteredOrigins) {
        const message = 'No origins provided for musters'
        UpdateHistory.logger.error(`${logPrefix} failed: ${message}, musters: "${JSON.stringify(musters)}"`)
        throw Error(`${message}.`)
      }
      for (const muster of musters) {
        const musteredBattlefieldUnit = GetBattlefieldUnit.getBattlefieldUnit({
          game,
          unitId: muster.unit.unit,
          userId: playerId,
        })
        if (!musteredBattlefieldUnit) {
          const message = `Could not find mustered unit "${muster.unit.unit}" on battlefield`
          UpdateHistory.logger.error(`${logPrefix} failed: ${message}`)
          throw Error(`${message}.`)
        }
        const origin = musteredOrigins[muster.unit.unit.toString()]
        if (!origin) {
          const message = `Could not find origin for mustered unit "${muster.unit.unit}"`
          UpdateHistory.logger.error(`${logPrefix} failed: ${message}`)
          throw Error(`${message}.`)
        }
        const musterMove: MoveUnitDbObject = {
          created: move.created,
          reason: {
            type: MoveReasonType.Muster,
            unit: deckUnit,
          },
          type: MoveType.Unit,
          unit: {
            artStyle: musteredBattlefieldUnit.unit.artStyle,
            unit: musteredBattlefieldUnit.unit.unit,
            effectiveStrength: musteredBattlefieldUnit.unit.effectiveStrength,
            effects: musteredBattlefieldUnit.unit.effects,
            row: musteredBattlefieldUnit.row,
          },
          source: {
            origin,
          },
        }
        UpdateHistory.addMoveToCurrentPlayer({
          game,
          move: musterMove,
        })
      }
    }
  }

  static addMoveToCurrentPlayer({ game, move }: { game: GameDbObject; move: MoveDbObject }) {
    const player = game.players.find((player) => player.user.toString() === game.turn?.toString())
    if (player) {
      player.rounds[game.round - 1].moves.push(move)
    } else {
      throw new PresentableError(`Could not find player "${game.turn}" on game "${game._id}" to add move to.`)
    }
  }
}
