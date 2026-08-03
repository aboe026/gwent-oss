import { GameDbObject } from '@gwent-oss/graphql-schema/database-typings'
import PresentableError from '../../../../util/presentable-error'

/**
 * Mark the player whose turn it currently is in a game as passed for the current game round.
 *
 * @param game The game to mark the current player ready on.
 */
export default function passCurrentPlayer(game: GameDbObject) {
  const player = game.players.find((player) => player.user.toString() === game.turn?.toString())
  if (player) {
    player.rounds[game.round - 1].passed = true
  } else {
    throw new PresentableError(
      `Could not find player "${game.turn}" on game "${game._id}" to pass for round "${game.round}".`
    )
  }
}
