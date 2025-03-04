import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import PresentableError from '../../../../util/presentable-error'

export default class PassCurrentPlayer {
  static passCurrentPlayer({ game }: { game: GameDbObject }) {
    const player = game.players.find((player) => player.user.toString() === game.turn?.toString())
    if (player) {
      player.rounds[game.round - 1].passed = true
    } else {
      throw new PresentableError(
        `Could not find player "${game.turn}" on game "${game._id}" to pass for round "${game.round}".`
      )
    }
  }
}
