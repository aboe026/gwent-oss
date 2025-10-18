import {
  Combat,
  DeckUnitDbObject,
  EffectDbObject,
  GameDbObject,
  GameUnitDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import { ImpactsByUnitId } from '../../resolver-util'
import EffectMuster, { MusteredOrigins } from './effect-muster'
import EffectScorch from './effect-scorch'
import EffectMardroeme from './effect-mardroeme'

/**
 * Modifies the battlefield of the current round in a game due to the deployment of a new unit. Other units on or off the battlefield may be impacted by unit effects.
 *
 * @param config The configuration used to determine the impact the new unit has on the battlefield.
 * @param config.battlefieldUnits All of the Units currently on the battlefield.
 * @param config.combat The combat row the unit is being deployed to.
 * @param config.effects The effects that any unit might have.
 * @param config.game The game whose battlefield should have the units deployment applied to it.
 * @param config.logPrefix What to prepend log statements with.
 * @param config.newDeckUnit The new DeckUnit being introduced to the battlefield.
 * @param config.newUnit The new Unit being introduced to the battlefield.
 * @returns Any impacts the new unit has on the battlefield.
 */
export default async function modifyBattlefieldWithNewUnit({
  battlefieldUnits,
  combat,
  effects,
  game,
  logPrefix,
  newDeckUnit,
  newUnit,
}: {
  battlefieldUnits: UnitDbObject[]
  combat?: Combat | null
  effects: EffectDbObject[]
  game: GameDbObject
  logPrefix: string
  newDeckUnit: DeckUnitDbObject
  newUnit: UnitDbObject
}): Promise<ModificationImpacts> {
  addNewUnitToBattlefield({
    game,
    newDeckUnit,
    combat,
    newUnit,
  })

  const scorches = EffectScorch.scorchBattlefield({
    battlefieldUnits,
    effects,
    game,
    logPrefix,
    newDeckUnit,
  })
  const {
    impacts: musterImpacts,
    musteredUnits,
    musteredOrigins,
  } = await EffectMuster.musterBattlefield({
    battlefieldUnits,
    effects,
    game,
    logPrefix,
    newDeckUnit,
  })
  const {
    impacts: mardroemeImpacts,
    transformedUnits,
    transformedGameUnits,
    mardroemingGameUnit,
  } = await EffectMardroeme.transformBerserkers({
    battlefieldUnits: [...battlefieldUnits, ...musteredUnits],
    effects,
    game,
    logPrefix,
    newDeckUnit,
    combat,
  })
  return {
    scorches,
    musters: musterImpacts,
    musteredUnits,
    musteredOrigins,
    mardroemes: mardroemeImpacts,
    transformedUnits,
    transformedGameUnits,
    mardroemingGameUnit,
  }
}

/**
 * Adds a new DeckUnit to the battlefield.
 *
 * @param config The configuration used to add the DeckUnit to the battlefield.
 * @param config.combat The row on the battlefield to add the DeckUnit to.
 * @param config.game The Game whose battlefield the DeckUnit should be added to.
 * @param config.newDeckUnit The DeckUnit to add to the battlefield.
 * @param config.newUnit The new Unit being introduced to the battlefield.
 */
export function addNewUnitToBattlefield({
  combat,
  game,
  newDeckUnit,
  newUnit,
}: {
  combat?: Combat | null
  game: GameDbObject
  newDeckUnit: DeckUnitDbObject
  newUnit: UnitDbObject
}) {
  for (const player of game.players) {
    if (player.user.toString() === game.turn?.toString()) {
      player.deck.hand = player.deck.hand.filter((handUnit) => handUnit.unit.toString() !== newDeckUnit.unit.toString())
      const round = player.rounds[game.round - 1]
      if (combat === Combat.Close) {
        if (newUnit.modifier) {
          round.close.modifier = newDeckUnit
        } else {
          round.close.units.push(newDeckUnit)
        }
      } else if (combat === Combat.Ranged) {
        if (newUnit.modifier) {
          round.ranged.modifier = newDeckUnit
        } else {
          round.ranged.units.push(newDeckUnit)
        }
      } else if (combat === Combat.Siege) {
        if (newUnit.modifier) {
          round.siege.modifier = newDeckUnit
        } else {
          round.siege.units.push(newDeckUnit)
        }
      }
    }
  }
}

interface ModificationImpacts {
  scorches: ImpactsByUnitId
  musters: ImpactsByUnitId
  musteredUnits: UnitDbObject[]
  musteredOrigins: MusteredOrigins
  mardroemes: ImpactsByUnitId
  transformedUnits: UnitDbObject[]
  transformedGameUnits: GameUnitDbObject[]
  mardroemingGameUnit: GameUnitDbObject | undefined
}
