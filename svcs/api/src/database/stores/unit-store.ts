import { Document, Filter, ObjectId } from 'mongodb'

import { Combat, UnitDbObject } from '@gwent/graphql-schema/database-typings'
import { getLogger } from 'log4js'
import Store from './store'

/**
 * Factory for Gwent unit cards a user can add to their deck.
 */
export default class UnitStore extends Store {
  static readonly COLLECTION_NAME = 'units'
  private static logger = getLogger('unit-store')

  /**
   * Add a Unit card to the database.
   *
   * @param unit The Unit card to add.
   * @param unit.combats The combat types the Unit card is eligible to perform.
   * @param unit.deckable Whether or not the Unit card can be added to a users created deck.
   * @param unit.dlc The potential DLC that the Unit card was added in.
   * @param unit.effectPrefix The prefix of cards the Unit card can summon if it has the muster effect. Defaults to the name of the Unit card if not defined.
   * @param unit.effects The ID's of potential additional effects the Unit card has on the battlefield.
   * @param unit.faction The ID of the faction the Unit card belongs to.
   * @param unit.hero Whether or not the Unit card is a Hero.
   * @param unit.images Paths to images of the Unit card.
   * @param unit.name The name of the Unit card.
   * @param unit.quote The quote of the Unit card.
   * @param unit.scorchMin The minimum strength card the Unit card can scorch.
   * @param unit.scorchScope The combat types that the Unit card's scorch effect is limited to.
   * @param unit.special Whether or not the Unit card counts towards the limit of special cards a deck can contain.
   * @param unit.strength The strength of attacks of the Unit card.
   * @returns The Unit card databased document.
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
   * Get units matching optinal criteria.
   *
   * @param options The optionst to scope Units to.
   * @param options.deckable Whether or not the Unit is allowed to be added to a Deck.
   * @param options.factions The Faction ObjectIds to scope Units to.
   * @param options.ids The ObjectIds to scope Units to.
   * @returns Unit cards matching criteria.
   */
  static async get({ deckable, factionIds, ids }: GetUnitsInput): Promise<UnitDbObject[]> {
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
    return UnitStore.read<UnitDbObject[]>({
      filter,
      options: {
        collation: {
          locale: 'en', // allows for case-insensitivity
        },
        sort: {
          name: 1,
          _id: 1,
        },
      },
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
}
