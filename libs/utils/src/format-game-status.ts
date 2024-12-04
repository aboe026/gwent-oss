import { GameStatus } from '@gwent/graphql-schema/resolver-typings'

/**
 * Convert a GameStatus enum to a human readable string.
 * @param status The GameStatus enum to convert to a human readable string.
 * @returns The human redeable representation of the GameStatus enum.
 */
export default function formatGameStatus(status: GameStatus): string {
  if (status === GameStatus.Decking) {
    return 'Choosing Decks'
  } else if (status === GameStatus.Ordering) {
    return 'Ordering'
  } else if (status === GameStatus.Redrawing) {
    return 'Redrawing'
  } else if (status === GameStatus.Playing) {
    return 'Playing'
  } else if (status === GameStatus.Done) {
    return 'Finished'
  }
  throw Error(`Invalid game status "${status}"`)
}
