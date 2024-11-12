import { GameStatus } from '@gwent/graphql-schema/resolver-typings'

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
