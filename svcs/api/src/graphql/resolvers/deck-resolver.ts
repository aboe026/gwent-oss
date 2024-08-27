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
  static async resolveFromObject({
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
        (await FactionResolver.resolveFromId({
          id: deck.faction,
          neutrals: neutralDeckStats,
        })),
      id: deck._id.toString(),
      leader:
        leader ||
        (await LeaderResolver.resolveFromId({
          id: deck.leader,
          neutralStats: neutralLeaderStats,
        })),
      name: deck.name,
      stats: deck.stats,
      units:
        units ||
        (await DeckUnitResolver.resolveFromArray({
          deckUnits: deck.units,
          neutralStats: neutralUnitStats,
        })),
      user: user || (await UserResolver.resolveById(deck.user)),
    }
  }

  static async resolveFromArray({
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
    const resolvedFactions = await FactionResolver.resolveFromArray({
      factions,
      neutralStats: neutralDeckStats,
    })
    const leaders = await LeaderResolver.resolveFromIds({
      ids: leaderIds,
      factions,
      neutralStats: neutralLeaderStats,
    })
    const units = await UnitResolver.resolveFromIds({
      ids: unitIds,
      factions,
      neutralStats: neutralUnitStats,
    })
    const users = await UserResolver.resolveByIds(userIds)

    const resolvedDecks: Deck[] = []
    for (const deck of decks) {
      const faction = resolvedFactions.find((faction) => faction.id.toString() === deck.faction.toString()) as Faction
      const leader = leaders.find((leader) => leader.id.toString() === deck.leader.toString()) as Leader
      const resolvedUnits: DeckUnit[] = []
      for (const deckUnit of deck.units) {
        resolvedUnits.push({
          artStyle: deckUnit.artStyle,
          unit: units.find((unit) => unit.id.toString() === deckUnit.unit.toString()) as Unit,
        })
      }
      const user = users.find((user) => user.id.toString() === deck.user.toString()) as User
      resolvedDecks.push(
        await DeckResolver.resolveFromObject({
          deck,
          faction,
          leader,
          units: resolvedUnits,
          user,
        })
      )
    }

    return resolvedDecks
  }
}
