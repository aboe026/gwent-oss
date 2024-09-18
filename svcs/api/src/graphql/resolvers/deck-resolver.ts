import { ObjectId } from 'mongodb'

import { Deck, DeckUnit, Faction, Leader, Unit, User } from '@gwent/graphql-schema/resolver-typings'
import { DeckDbObject } from '@gwent/graphql-schema/database-typings'
import DeckUnitResolver from './deck-unit-resolver'
import FactionResolver from './faction-resolver'
import FactionStore from '../../database/stores/faction-store'
import { getUniqueItems } from '@gwent/utils'
import LeaderResolver from './leader-resolver'
import UnitResolver from './unit-resolver'
import UserResolver from './user-resolver'

/**
 * A class to convert Deck database objects to their GraphQL equivalent.
 */
export default class DeckResolver {
  /**
   * Converts a single Deck database object to a single Deck GraphQL object.
   *
   * @param config The configuration used to convert the Deck.
   * @param config.deck The Deck database document to convert.
   * @param config.faction The resolved Faction for the Deck. If not provided, will be retrieved.
   * @param config.leader The resolved Leader for the Deck.  If not provided, will be retrieved.
   * @param config.units The resolved DeckUnits for the Deck. If not provided, will be retrieved.
   * @param config.user The resolved User for the deck. If not provided, will be retrieved.
   * @param config.neutralDeckStats Whether or not to account for the Neutral faction when calculating the stats of the Faction of the Deck.
   * @param config.neutralLeaderStats Whether or not to account for the Neutral faction when calculating the stats of the Leader of the Deck.
   * @param config.neutralUnitStats Whether or not to account for the Neutral faction when calculating the stats of the Units of the Deck.
   * @returns The resolved Deck object matching its GraphQL schema definition.
   */
  static async fromObject({
    deck,
    faction,
    leader,
    units,
    user,
    neutralDeckStats,
    neutralLeaderStats,
    neutralUnitStats,
  }: {
    deck: DeckDbObject
    faction?: Faction
    leader?: Leader
    units?: DeckUnit[]
    user?: User
    neutralDeckStats?: boolean
    neutralLeaderStats?: boolean
    neutralUnitStats?: boolean
  }): Promise<Deck> {
    return {
      created: deck.created,
      faction:
        faction ||
        (await FactionResolver.fromId({
          id: deck.faction,
          neutrals: neutralDeckStats,
        })),
      id: deck._id.toString(),
      leader:
        leader ||
        (await LeaderResolver.fromId({
          id: deck.leader,
          neutralStats: neutralLeaderStats,
        })),
      name: deck.name,
      stats: deck.stats,
      units:
        units ||
        (await DeckUnitResolver.fromArray({
          deckUnits: deck.units,
          neutralStats: neutralUnitStats,
        })),
      user: user || (await UserResolver.fromId(deck.user)),
    }
  }

  /**
   * Converts an array of Deck database objects to an array of Deck GraphQL objects.
   *
   * @param config The configuration used to convert the array.
   * @param config.decks The array of Deck database objects to convert.
   * @param config.neutralDeckStats Whether or not to account for the Neutral faction when calculating the stats of the Factions of the Decks.
   * @param config.neutralLeaderStats Whether or not to account for the Neutral faction when calculating the stats of the Leaders of the Decks.
   * @param config.neutralUnitStats Whether or not to account for the Neutral faction when calculating the stats of the Units of the Decks.
   * @returns The resolved Deck array matching the GraphQL schema definition.
   */
  static async fromArray({
    decks,
    neutralDeckStats,
    neutralLeaderStats,
    neutralUnitStats,
  }: {
    decks: DeckDbObject[]
    neutralDeckStats?: boolean
    neutralLeaderStats?: boolean
    neutralUnitStats?: boolean
  }): Promise<Deck[]> {
    const factionIds = getUniqueItems<ObjectId>(decks.map((deck) => deck.faction))
    const leaderIds = getUniqueItems<ObjectId>(decks.map((deck) => deck.leader))
    const unitIds: string[] = []
    for (const deck of decks) {
      for (const unit of deck.units) {
        if (!unitIds.includes(unit.unit.toString())) {
          unitIds.push(unit.unit.toString())
        }
      }
    }
    const userIds = getUniqueItems<ObjectId>(decks.map((deck) => deck.user))

    const factions = await FactionStore.get({
      ids: factionIds,
    })
    const resolvedFactions = await FactionResolver.fromArray({
      factions,
      neutralStats: neutralDeckStats,
    })
    const leaders = await LeaderResolver.fromIds({
      ids: leaderIds,
      factions,
      neutralStats: neutralLeaderStats,
    })
    const units = await UnitResolver.fromIds({
      ids: unitIds,
      factions,
      neutralStats: neutralUnitStats,
    })
    const users = await UserResolver.fromIds(userIds)

    const resolvedDecks: Deck[] = []
    for (const deck of decks) {
      resolvedDecks.push(
        await DeckResolver.fromObject({
          deck,
          faction: resolvedFactions.find((faction) => faction.id.toString() === deck.faction.toString()),
          leader: leaders.find((leader) => leader.id.toString() === deck.leader.toString()),
          units: deck.units.map((deckUnit) => {
            return {
              artStyle: deckUnit.artStyle,
              unit: units.find((unit) => unit.id.toString() === deckUnit.unit.toString()) as Unit,
            }
          }),
          user: users.find((user) => user.id.toString() === deck.user.toString()),
        })
      )
    }

    return resolvedDecks
  }
}
