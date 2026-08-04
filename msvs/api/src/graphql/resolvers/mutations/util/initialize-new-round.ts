import { GameDbObject, PlayerCombatRowDbObject } from '@gwent-oss/graphql-schema/database-typings'

/**
 * Add a new round to each player on a game. This new round is in a starting/initial state.
 *
 * @param config The configuration used to initialize the new round.
 * @param config.game The Game which should have a new round initialized on it.
 */
export default function initializeNewRound({ game }: { game: GameDbObject }) {
  for (const player of game.players) {
    player.rounds.push({
      close: getStartingCombatRow(),
      moves: [],
      passed: false,
      ranged: getStartingCombatRow(),
      score: 0,
      siege: getStartingCombatRow(),
      weathers: [],
    })
  }
  game.round = game.round + 1
}

/**
 * Gets the empty state of a player combat row.
 *
 * @returns The empty state a player combat row starts in.
 */
export function getStartingCombatRow(): PlayerCombatRowDbObject {
  return {
    score: 0,
    units: [],
  }
}
