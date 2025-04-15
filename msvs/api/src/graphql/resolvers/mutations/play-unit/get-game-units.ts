import { Combat, GamePlayerDbObject, GameUnitDbObject } from '@gwent/graphql-schema/database-typings'

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
    const playerRound = player.rounds[round]
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
