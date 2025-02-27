import { GameDbObject, GamePlayerDbObject, MoveDbObject } from '@gwent/graphql-schema/database-typings'

export default class AddMoveToPlayer {
  static addMoveToPlayer({ game, move }: { game: GameDbObject; move: MoveDbObject }): GamePlayerDbObject[] {
    return game.players.map((player) => {
      return {
        ...player,
        rounds: player.rounds.map((round, index) => {
          if (index === game.round - 1) {
            if (player.user.toString() === game.turn?.toString()) {
              round.moves = [...round.moves, move]
            }
          }
          return round
        }),
      }
    })
  }
}
