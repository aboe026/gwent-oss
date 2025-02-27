import { Combat } from '@gwent/graphql-schema/resolver-typings'
import {
  DeckUnitDbObject,
  GameDbObject,
  GamePlayerDbObject,
  PlayerCombatRowDbObject,
} from '@gwent/graphql-schema/database-typings'

export default class ModifyGameUnitPositions {
  static modifyGameUnitPositions({
    game,
    deckUnit,
    combat,
  }: {
    game: GameDbObject
    deckUnit: DeckUnitDbObject
    combat: Combat
  }): GamePlayerDbObject[] {
    return game.players.map((player) => {
      return {
        ...player,
        deck: {
          ...player.deck,
          hand:
            player.user.toString() === game.turn?.toString()
              ? player.deck.hand.filter((handUnit) => handUnit.unit.toString() !== deckUnit.unit.toString())
              : player.deck.hand,
        },
        rounds: player.rounds.map((round, index) => {
          if (index === game.round - 1) {
            if (player.user.toString() === game.turn?.toString()) {
              round.close = ModifyGameUnitPositions.addUnitToCombatRow({
                deckUnit,
                row: round.close,
                rowCombat: Combat.Close,
                unitCombat: combat,
              })
              round.ranged = ModifyGameUnitPositions.addUnitToCombatRow({
                deckUnit,
                row: round.ranged,
                rowCombat: Combat.Ranged,
                unitCombat: combat,
              })
              round.siege = ModifyGameUnitPositions.addUnitToCombatRow({
                deckUnit,
                row: round.siege,
                rowCombat: Combat.Siege,
                unitCombat: combat,
              })
            }
          }
          return round
        }),
      }
    })
  }

  private static addUnitToCombatRow({
    deckUnit,
    unitCombat,
    rowCombat,
    row,
  }: {
    deckUnit: DeckUnitDbObject
    unitCombat: Combat
    rowCombat: Combat
    row: PlayerCombatRowDbObject
  }): PlayerCombatRowDbObject {
    if (unitCombat === rowCombat) {
      row.units.push({
        ...deckUnit,
      })
    }
    return row
  }
}
