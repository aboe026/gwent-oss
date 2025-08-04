import { Combat } from '@gwent/graphql-schema/resolver-typings'
import {
  DeckUnitDbObject,
  EffectDbObject,
  GameDbObject,
  ImpactDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import ScorchBattlefield from './scorch-battlefield'
import MusterBattlefield, { MusteredOrigins } from './muster-battlefield'

/**
 * Modifies the battlefield of the current round in a game due to the deployment of a new unit. Other units on or off the battlefield may be impacted by unit effects.
 *
 * @param config The configuration used to determine the impact the new unit has on the battlefield.
 * @param config.battlefieldUnits All of the Units currently on the battlefield.
 * @param config.combat The combat row the unit is being deployed to.
 * @param config.effects The effects that any unit might have.
 * @param config.game The game whose battlefield should have the units deployment applied to it.
 * @param config.logPrefix What to prepend log statements with.
 * @param config.newDeckUnit The new unit being introduced to the battlefield.
 * @returns Any impacts the new unit has on the battlefield.
 */
export default async function modifyBattlefieldWithNewUnit({
  battlefieldUnits,
  combat,
  effects,
  game,
  logPrefix,
  newDeckUnit,
}: {
  battlefieldUnits: UnitDbObject[]
  combat?: Combat | null
  effects: EffectDbObject[]
  game: GameDbObject
  logPrefix: string
  newDeckUnit: DeckUnitDbObject
}): Promise<ModificationImpacts> {
  addNewUnitToBattlefield({
    game,
    newDeckUnit,
    combat,
  })

  const {
    impacts: musterImpacts,
    musteredUnits,
    musteredOrigins,
  } = await MusterBattlefield.musterBattlefield({
    battlefieldUnits,
    effects,
    game,
    logPrefix,
    newDeckUnit,
  })
  return {
    scorches: ScorchBattlefield.scorchBattlefield({
      battlefieldUnits,
      effects,
      game,
      logPrefix,
      newDeckUnit,
    }),
    musters: musterImpacts,
    musteredUnits,
    musteredOrigins,
  }
}

/**
 * Adds a new DeckUnit to the battlefield.
 *
 * @param config The configuration used to add the DeckUnit to the battlefield.
 * @param config.combat The row on the battlefield to add the DeckUnit to.
 * @param config.game The Game whose battlefield the DeckUnit should be added to.
 * @param config.newDeckUnit The DeckUnit to add to the battlefield.
 */
export function addNewUnitToBattlefield({
  combat,
  game,
  newDeckUnit,
}: {
  combat?: Combat | null
  game: GameDbObject
  newDeckUnit: DeckUnitDbObject
}) {
  for (const player of game.players) {
    if (player.user.toString() === game.turn?.toString()) {
      player.deck.hand = player.deck.hand.filter((handUnit) => handUnit.unit.toString() !== newDeckUnit.unit.toString())
      const round = player.rounds[game.round - 1]
      if (combat === Combat.Close) {
        round.close.units.push(newDeckUnit)
      } else if (combat === Combat.Ranged) {
        round.ranged.units.push(newDeckUnit)
      } else if (combat === Combat.Siege) {
        round.siege.units.push(newDeckUnit)
      }
    }
  }
}

interface ModificationImpacts {
  scorches: ImpactDbObject[] | undefined
  musters: ImpactDbObject[] | undefined
  musteredUnits: UnitDbObject[]
  musteredOrigins: MusteredOrigins
}
