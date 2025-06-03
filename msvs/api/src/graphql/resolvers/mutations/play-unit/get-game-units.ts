import { Combat, GamePlayerDbObject, GameUnitDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * Retrieve all the GameUnit database documents that are currently on the battlefield from the given players in a game.
 *
 * @param config The configuration used to get all GameUnit database documents.
 * @param config.combat An optional combat type to limit results to.
 * @param config.players The players in the game to get GameUnits for.
 * @param config.round The current round of the game.
 * @returns A list of all GameUnit database objects which are currently on the battlefield for the given players in a game.
 */
export default function getGameUnits({
  combat,
  players,
  round,
}: {
  combat?: string | null
  players: GamePlayerDbObject[]
  round: number
}): GameUnitDbObject[] {
  const gameUnits: GameUnitDbObject[] = []

  for (const player of players) {
    const playerRound = player.rounds[round - 1]
    const roundUnits = []
    if (!combat || combat === Combat.Close) {
      roundUnits.push(...playerRound.close.units)
    }
    if (!combat || combat === Combat.Ranged) {
      roundUnits.push(...playerRound.ranged.units)
    }
    if (!combat || combat === Combat.Siege) {
      roundUnits.push(...playerRound.siege.units)
    }
    for (const gameUnit of roundUnits) {
      gameUnits.push(gameUnit)
    }
  }

  return gameUnits
}
