import { DeckDbObject } from '@gwent/graphql-schema/database-typings'
import { Deck, DeckUnit, Faction, Leader, Unit, User } from '@gwent/graphql-schema/resolver-typings'
import FactionResolver from './faction-resolver'
import LeaderResolver from './leader-resolver'
import UserResolver from './user-resolver'
import DeckUnitResolver from './deck-unit-resolver'
import { getUniqueItems } from '@gwent/utils'
import { ObjectId } from 'mongodb'
import UnitResolver from './unit-resolver'
import FactionStore from '../../database/stores/faction-store'

export default class DeckResolver {
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
    // TODO: validate error logged in unit tests
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
