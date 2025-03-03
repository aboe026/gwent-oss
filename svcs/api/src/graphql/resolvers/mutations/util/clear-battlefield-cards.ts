import { GameDbObject } from '@gwent/graphql-schema/database-typings'

export default class ClearBattlefieldCards {
  static clearBattlefieldCards({ game }: { game: GameDbObject }) {
    for (const player of game.players) {
      const round = player.rounds[game.round - 1]
      player.deck.discard.push(...round.close.units)
      player.deck.discard.push(...round.ranged.units)
      player.deck.discard.push(...round.siege.units)
    }
  }
}
