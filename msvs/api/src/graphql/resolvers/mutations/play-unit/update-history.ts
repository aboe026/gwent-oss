import addMoveToCurrentPlayer from '../util/add-move-to-current-player'
import {
  Combat,
  DeckUnitDbObject,
  GameDbObject,
  ImpactDbObject,
  MoveReasonType,
  GameUnitOrigin,
  MoveUnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import getBattlefieldUnit from './get-battlefield-unit'
import { MoveType } from '@gwent/graphql-schema'
import { MusteredOrigins } from './muster-battlefield'

export default class UpdateHistory {
  static updateHistory({
    game,
    deckUnit,
    playerId,
    combat,
    scorches,
    musters,
    strengths,
    musteredOrigins,
  }: {
    game: GameDbObject
    deckUnit: DeckUnitDbObject
    playerId: string
    combat: Combat | null | undefined
    scorches: ImpactDbObject[] | undefined
    musters: ImpactDbObject[] | undefined
    strengths: ImpactDbObject[] | undefined
    musteredOrigins: MusteredOrigins | undefined
  }) {
    const battlefieldUnit = getBattlefieldUnit({
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
    addMoveToCurrentPlayer({
      game,
      move,
    })

    if (musters) {
      if (!musteredOrigins) {
        throw Error('No origins provided for musters.')
      }
      for (const muster of musters) {
        const musteredBattlefieldUnit = getBattlefieldUnit({
          game,
          unitId: muster.unit.unit,
          userId: playerId,
        })
        if (!musteredBattlefieldUnit) {
          throw Error(`Could not find mustered unit "${muster.unit.unit}" on battlefield`)
        }
        const origin = musteredOrigins[muster.unit.unit.toString()]
        if (!origin) {
          throw Error(`Could not find origin for mustered unit "${muster.unit.unit}"`)
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
        addMoveToCurrentPlayer({
          game,
          move: musterMove,
        })
      }
    }
  }
}
