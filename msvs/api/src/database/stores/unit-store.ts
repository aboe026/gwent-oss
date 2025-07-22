import { Document, Filter, FilterOperators, FindOptions, ObjectId } from 'mongodb'
import { getLogger } from 'log4js'

import { Combat, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import Store from './store'

/**
 * Factory for Gwent Units a user can add to their deck.
 */
export default class UnitStore extends Store {
  static readonly COLLECTION_NAME = 'units'
  private static logger = getLogger('UnitStore')

  /**
   * Add a Unit to the database.
   *
   * @param unit The Unit to add.
   * @param unit.combats The combat types the Unit is eligible to perform.
   * @param unit.deckable Whether or not the Unit can be added to a users created deck.
   * @param unit.dlc The potential DLC that the Unit was added in.
   * @param unit.effectPrefix The prefix of units the Unit can summon if it has the muster effect. Defaults to the name of the Unit if not defined.
   * @param unit.effects The ID's of potential additional effects the Unit has on the battlefield.
   * @param unit.faction The ID of the faction the Unit belongs to.
   * @param unit.hero Whether or not the Unit is a Hero.
   * @param unit.images Paths to images of the Unit.
   * @param unit.name The name of the Unit.
   * @param unit.quote The quote of the Unit.
   * @param unit.scorchMin The minimum strength the Unit can scorch.
   * @param unit.scorchScope The combat types that the Unit's scorch effect is limited to.
   * @param unit.special Whether or not the Unit counts towards the limit of special Units a deck can contain.
   * @param unit.strength The strength of attacks of the Unit.
   * @returns The Unit databased document.
   */
  static async add({
    combats,
    deckable,
    dlc,
    effectPrefix,
    effects,
    faction,
    hero,
    images,
    name,
    quote,
    scorchMin,
    scorchScope,
    special,
    strength,
  }: AddUnitInput): Promise<UnitDbObject> {
    UnitStore.logger.debug(`Adding unit with name "${name}"`)
    const unit: Document = {
      combats,
      created: new Date(),
      deckable,
      dlc: dlc && new ObjectId(dlc),
      effectPrefix,
      effects: effects.map((effectId) => new ObjectId(effectId)),
      faction: new ObjectId(faction),
      hero,
      images,
      name,
      quote,
      scorchMin,
      scorchScope,
      special,
      strength,
    }
    if (UnitStore.logger.isTraceEnabled()) {
      UnitStore.logger.trace(`Adding unit: "${JSON.stringify(unit)}"`)
    }
    return UnitStore.create<UnitDbObject>(unit)
  }

  /**
   * Get units matching optional criteria.
   *
   * @param options The options to scope Units to.
   * @param options.deckable Whether or not the Unit is allowed to be added to a Deck.
   * @param options.factionIds The Faction ObjectIds to scope Units to.
   * @param options.ids The ObjectIds to scope Units to.
   * @param options.ignoreIds List of ObjectIds to ignore in the database.
   * @param options.namePrefix Scope units to those whose name start with the given string.
   * @returns Units matching criteria.
   */
  static async get({
    deckable,
    factionIds,
    ids,
    namePrefix,
    names,
    ignoreIds,
  }: GetUnitsInput): Promise<UnitDbObject[]> {
    if (UnitStore.logger.isDebugEnabled()) {
      UnitStore.logger.debug(
        `Getting units with factions "${JSON.stringify(factionIds)}" and ids "${JSON.stringify(ids)}"`
      )
    }
    const filter: Filter<Document> = {}
    if (factionIds) {
      filter.faction = {
        $in: factionIds.map((factionId) => new ObjectId(factionId)),
      }
    }
    if (deckable !== undefined) {
      filter.deckable = deckable
    }
    if (ids) {
      filter._id = {
        $in: ids.map((id) => new ObjectId(id)),
      }
    }
    if (namePrefix) {
      filter.$text = {
        $search: namePrefix,
      }
    }
    if (names) {
      filter.name = {
        $in: names,
      }
    }
    if (ignoreIds) {
      if (!filter._id) {
        filter._id = {}
      }
      ;(filter._id as FilterOperators<ObjectId>).$nin = ignoreIds.map((ignoreId) => new ObjectId(ignoreId))
    }
    const options: FindOptions<Document> = {
      collation: {
        locale: 'en', // allows for case-insensitivity
      },
      sort: {
        name: 1,
        _id: 1,
      },
    }
    if (UnitStore.logger.isTraceEnabled()) {
      UnitStore.logger.trace(`get filter: "${JSON.stringify(filter)}`)
      UnitStore.logger.trace(`get options: "${JSON.stringify(options)}`)
    }
    return UnitStore.read<UnitDbObject[]>({
      filter,
      options,
    })
  }
}

export interface AddUnitInput {
  combats: Combat[]
  deckable?: boolean
  dlc: ObjectId | string | null
  effects: (string | ObjectId)[]
  faction: string | ObjectId
  hero?: boolean
  images: string[]
  effectPrefix: string | null
  name: string
  quote: string
  scorchMin: number | null
  scorchScope: Combat | null
  special?: boolean
  strength: number | null
}

export interface GetUnitsInput {
  deckable?: boolean
  factionIds?: (string | ObjectId)[]
  ids?: (string | ObjectId)[]
  ignoreIds?: (string | ObjectId)[]
  namePrefix?: string
  names?: string[]
}
