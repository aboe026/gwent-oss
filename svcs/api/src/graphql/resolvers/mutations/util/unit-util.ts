import { EffectDbObject, GameDbObject, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import EffectStore from '../../../../database/stores/effect-store'
import UnitStore from '../../../../database/stores/unit-store'

export default class UnitUtil {
  static async getRoundUnits({
    game,
    unitBeingPlayed,
  }: {
    game: GameDbObject
    unitBeingPlayed: UnitDbObject
  }): Promise<UnitDbObject[]> {
    const unitIds: string[] = [unitBeingPlayed.toString()] // to be removed at end, used just for now to ignore potential duplicates
    for (const player of game.players) {
      const round = player.rounds[game.round - 1]
      for (const rowUnit of [...round.close.units, ...round.ranged.units, ...round.siege.units]) {
        if (!unitIds.includes(rowUnit.unit.toString())) {
          unitIds.push(rowUnit.unit.toString())
        }
      }
    }

    const units = await UnitStore.get({
      ids: unitIds.slice(1), // remove the deckUnit we have already retrieved
    })

    return [...units, unitBeingPlayed]
  }

  static async getUnitEffects({ units }: { units: UnitDbObject[] }): Promise<EffectDbObject[]> {
    const effectIds: string[] = []
    for (const unit of units) {
      if (unit.effects) {
        for (const unitEffect of unit.effects) {
          const effect = unitEffect.toString()
          if (!effectIds.includes(effect)) {
            effectIds.push(effect)
          }
        }
      }
    }

    if (effectIds.length === 0) {
      return []
    } else {
      return EffectStore.get({
        ids: effectIds,
      })
    }
  }
}
