import { GameDbObject, MoveDbObject } from '@gwent/graphql-schema/database-typings'

export default class AddMoveToPlayer {
  static addMoveToPlayer({ game, move }: { game: GameDbObject; move: MoveDbObject }) {
    // TODO: find game player instead of iterating through all
    for (const player of game.players) {
      if (player.user.toString() === game.turn?.toString()) {
        player.rounds[game.round - 1].moves.push(move)
      }
    }
  }
}
