import { GameDbObject, MoveDbObject } from '@gwent/graphql-schema/database-typings'
import PresentableError from '../../../../util/presentable-error'

/**
 * Adds a move to the current player for a game. The move is used to keep track of the history of actions played during a game.
 *
 * @param config The configuration containing the information to apply the move.
 * @param config.game The game to apply the move to for the current player on the game on the current round of the game.
 * @param config.move The move to apply the game for the current user on the current round.
 */
export default function addMoveToCurrentPlayer({ game, move }: { game: GameDbObject; move: MoveDbObject }) {
  const player = game.players.find((player) => player.user.toString() === game.turn?.toString())
  if (player) {
    player.rounds[game.round - 1].moves.push(move)
  } else {
    throw new PresentableError(`Could not find player "${game.turn}" on game "${game._id}" to add move to.`)
  }
}
