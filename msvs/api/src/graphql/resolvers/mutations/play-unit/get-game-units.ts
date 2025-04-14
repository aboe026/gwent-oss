import { GameDbObject, GameUnitDbObject } from '@gwent/graphql-schema/database-typings'

export default function getGameUnits(game: GameDbObject): GameUnitDbObject[] {
  const gameUnits: GameUnitDbObject[] = []

  for (const player of game.players) {
    const round = player.rounds[game.round - 1]
    for (const gameUnit of [...round.close.units, ...round.ranged.units, ...round.siege.units]) {
      gameUnits.push(gameUnit)
    }
  }

  return gameUnits
}
