import { GameDbObject, GamePlayerDbObject } from '@gwent/graphql-schema/database-typings'

export default class ClearBattlefieldCards {
  static clearBattlefieldCards({ game }: { game: GameDbObject }): GamePlayerDbObject[] {
    return game.players.map((gamePlayer) => {
      const playerRound = gamePlayer.rounds[game.round - 1]
      return {
        ...gamePlayer,
        deck: {
          ...gamePlayer.deck,
          discard: [
            ...gamePlayer.deck.discard,
            ...playerRound.close.units,
            ...playerRound.ranged.units,
            ...playerRound.siege.units,
          ],
        },
      }
    })
  }
}
