import { getLogger } from 'log4js'
import { ImpactsByUnitId } from '../../resolver-util'
import {
  DeckUnitDbObject,
  EffectDbObject,
  GameDbObject,
  GamePlayerDbObject,
  ImpactDbObject,
  PlayerCombatRowDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'

/**
 * A class to modify the battlefield if a decoy unit is played.
 */
export default class EffectDecoy {
  private static logger = getLogger('EffectDecoy')

  static decoyFromBattlefield({
    battlefieldUnits,
    effects,
    game,
    logPrefix,
    newDeckUnit,
    targetId,
  }: {
    battlefieldUnits: UnitDbObject[]
    effects: EffectDbObject[]
    game: GameDbObject
    logPrefix: string
    newDeckUnit: DeckUnitDbObject
    targetId: string | undefined | null
  }): PotentialDecoy {
    const impacts: ImpactDbObject[] = []
    let deckUnitAddedToHand: DeckUnitDbObject | undefined = undefined

    if (targetId) {
      const player = game.players.find((player) => player.user.toString() === game.turn?.toString())
      if (!player) {
        throw Error('') // TODO
      }
      const round = player?.rounds[game.round - 1]
      const rows = [round?.close, round?.ranged, round?.siege]
      for (let i = 0; i < rows.length && impacts.length === 0; i++) {
        const impact = EffectDecoy.decoyFromRow({
          player,
          row: rows[i],
          targetId,
        })
        if (impact) {
          impacts.push(impact)
        }
      }

      if (impacts.length === 0) {
        throw Error('') // TODO
      }
      if (impacts.length > 1) {
        throw Error('') // TODO
      }

      deckUnitAddedToHand = impacts[0].unit
    }

    return {
      deckUnitAddedToHand,
      impacts: {
        [newDeckUnit.unit.toString()]: impacts,
      },
    }
  }

  private static decoyFromRow({
    row,
    targetId,
    player,
  }: {
    row: PlayerCombatRowDbObject | undefined
    targetId: string
    player: GamePlayerDbObject
  }): ImpactDbObject | undefined {
    let impact: ImpactDbObject | undefined = undefined
    if (row) {
      const targetIndex = row.units.findIndex((rowUnit) => rowUnit.unit.toString() === targetId)
      if (targetIndex >= 0) {
        const target = row.units.splice(targetIndex, 1)[0]
        if (player.deck.hand) {
          player.deck.hand.push(target)
        }
        impact = {
          unit: target,
          user: player.user,
        }
      }
    }

    return impact
  }
}

interface PotentialDecoy {
  deckUnitAddedToHand: DeckUnitDbObject | undefined
  impacts: ImpactsByUnitId
}
