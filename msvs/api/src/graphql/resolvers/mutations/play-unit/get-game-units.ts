import { Combat, GameUnitDbObject, PlayerRoundDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * Retrieve all the GameUnit database documents that are currently on the battlefield from the given players in a game.
 *
 * @param config The configuration used to get all GameUnit database documents.
 * @param config.combat An optional combat type to limit results to.
 * @param config.rounds The Rounds of Game Players to get GameUnits for.
 * @returns A list of all GameUnit database objects which are currently on the battlefield for the given players in a game.
 */
export default function getGameUnits({
  combat,
  rounds,
}: {
  combat?: string | null
  rounds: PlayerRoundDbObject[]
}): GameUnitDbObject[] {
  const gameUnits: GameUnitDbObject[] = []

  for (const round of rounds) {
    if (!combat || combat === Combat.Close) {
      gameUnits.push(...round.close.units)
      if (round.close.modifier) {
        gameUnits.push(round.close.modifier)
      }
    }
    if (!combat || combat === Combat.Ranged) {
      gameUnits.push(...round.ranged.units)
      if (round.ranged.modifier) {
        gameUnits.push(round.ranged.modifier)
      }
    }
    if (!combat || combat === Combat.Siege) {
      gameUnits.push(...round.siege.units)
      if (round.siege.modifier) {
        gameUnits.push(round.siege.modifier)
      }
    }
    if (!combat) {
      for (const weather of round.weathers) {
        gameUnits.push(weather)
      }
    }
  }

  return gameUnits
}
