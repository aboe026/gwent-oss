import { Combat } from '@gwent/graphql-schema/resolver-typings'
import { DeckUnitDbObject, GameDbObject } from '@gwent/graphql-schema/database-typings'

export default class ModifyGameUnitPositions {
  static modifyGameUnitPositions({
    game,
    deckUnit,
    combat,
  }: {
    game: GameDbObject
    deckUnit: DeckUnitDbObject
    combat: Combat
  }) {
    for (const player of game.players) {
      if (player.user.toString() === game.turn?.toString()) {
        player.deck.hand = player.deck.hand.filter((handUnit) => handUnit.unit.toString() !== deckUnit.unit.toString())
        const round = player.rounds[game.round - 1]
        if (combat === Combat.Close) {
          round.close.units.push(deckUnit)
        } else if (combat === Combat.Ranged) {
          round.ranged.units.push(deckUnit)
        } else if (combat === Combat.Siege) {
          round.siege.units.push(deckUnit)
        }
      }
    }
  }
}
