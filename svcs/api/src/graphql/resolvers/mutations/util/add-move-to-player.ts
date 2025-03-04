import { GameDbObject, MoveDbObject } from '@gwent/graphql-schema/database-typings'
import PresentableError from '../../../../util/presentable-error'

export default class AddMoveToPlayer {
  static addMoveToPlayer({ game, move }: { game: GameDbObject; move: MoveDbObject }) {
    const player = game.players.find((player) => player.user.toString() === game.turn?.toString())
    if (player) {
      player.rounds[game.round - 1].moves.push(move)
    } else {
      throw new PresentableError(`Could not find player "${game.turn}" on game "${game._id}" to add move to.`)
    }
  }
}
