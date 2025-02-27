import { GamePlayerDbObject, PlayerCombatRowDbObject } from '@gwent/graphql-schema/database-typings'

export default class InitializeNewRound {
  /**
   * Add a new round to each player on a game in a starting state.
   *
   * @param config The configuration used to initialize the new round.
   * @param config.players The game players to initialize the new round for.
   * @returns New game players who have a new round added for them.
   */
  static initializeNewRound({ players }: { players: GamePlayerDbObject[] }): GamePlayerDbObject[] {
    const startingCombatRow: PlayerCombatRowDbObject = {
      score: 0,
      units: [],
    }
    return players.map((gamePlayer) => {
      return {
        ...gamePlayer,
        rounds: [
          ...gamePlayer.rounds,
          {
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
          },
        ],
      }
    })
  }
}
