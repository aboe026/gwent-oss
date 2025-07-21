import addMoveToCurrentPlayer from '../util/add-move-to-current-player'
import {
  Combat,
  DeckUnitDbObject,
  GameDbObject,
  ImpactDbObject,
  MoveReasonType,
  MoveUnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import getBattlefieldUnit from './get-battlefield-unit'
import { MoveType } from '@gwent/graphql-schema'

export default class UpdateHistory {
  static updateHistory({
    game,
    deckUnit,
    playerId,
    combat,
    scorches,
    musters,
    strengths,
  }: {
    game: GameDbObject
    deckUnit: DeckUnitDbObject
    playerId: string
    combat: Combat | null | undefined
    scorches: ImpactDbObject[] | undefined
    musters: ImpactDbObject[] | undefined
    strengths: ImpactDbObject[] | undefined
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
      type: MoveType.Unit,
    }
    addMoveToCurrentPlayer({
      game,
      move,
    })

    if (musters) {
      for (const muster of musters) {
        const musteredBattlefieldUnit = getBattlefieldUnit({
          game,
          unitId: muster.unit.unit,
          userId: playerId,
        })
        if (!musteredBattlefieldUnit) {
          throw Error(`Could not find mustered unit "${muster.unit.unit}" on battlefield`)
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
        }
        addMoveToCurrentPlayer({
          game,
          move: musterMove,
        })
      }
    }
  }
}
