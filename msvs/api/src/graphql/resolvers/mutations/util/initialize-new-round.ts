import { GameDbObject, PlayerCombatRowDbObject } from '@gwent/graphql-schema/database-typings'

/**
 * Add a new round to each player on a game. This new round is in a starting/initial state.
 *
 * @param config The configuration used to initialize the new round.
 * @param config.game The Game which should have a new round initialized on it.
 */
export default function initializeNewRound({ game }: { game: GameDbObject }) {
  const startingCombatRow: PlayerCombatRowDbObject = {
    score: 0,
    units: [],
  }
  for (const player of game.players) {
    player.rounds.push({
      close: {
        ...startingCombatRow,
      },
      moves: [],
      passed: false,
      ranged: {
        ...startingCombatRow,
      },
      score: 0,
      siege: {
        ...startingCombatRow,
      },
      weathers: [],
    })
  }
  game.round = game.round + 1
}
