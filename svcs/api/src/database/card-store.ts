import { Combat, Dlc, Effect, Faction, LeaderDbObject, UnitDbObject } from './generated-typings'
import { getLogger } from 'log4js'
import Store from './store'

/**
 * Factory for possible Gwent cards a user can add to their deck.
 */
export default class CardStore extends Store {
  static readonly COLLECTION_NAME = 'cards'
  private static logger = getLogger('card-store')

  /**
   * Get all possible Leader cards a user can set for their deck.
   *
   * @returns All leader cards.
   */
  static async getLeaders(): Promise<LeaderDbObject[]> {
    return CardStore.read<LeaderDbObject[]>({
      filter: {
        type: CARD_TYPE.Leader,
      },
      options: {
        projection: {
          type: 0,
        },
      },
    })
  }

  /**
   * Get all possible unit cards a user can add to their deck.
   *
   * @returns All unit cards.
   */
  static async getUnits(): Promise<UnitDbObject[]> {
    return CardStore.read<UnitDbObject[]>({
      filter: {
        type: CARD_TYPE.Unit,
      },
      options: {
        projection: {
          type: 0,
        },
      },
    })
  }

  /**
   * Adds a Leader card to the database
   *
   * @param {Object} leader The Leader card to add.
   * @param leader.name The name of the Leader card to add.
   * @param leader.faction The faction the Leader card belongs to.
   * @param dlc The potential DLC that the Leader card was added in.
   * @returns The Leader card database document.
   */
  static async addLeader({ name, faction, dlc }: AddLeaderInput): Promise<LeaderDbObject> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const leader: any = {
      type: CARD_TYPE.Leader,
      name,
      faction,
      dlc,
    }
    if (CardStore.logger.isTraceEnabled()) {
      CardStore.logger.trace(`Adding leader: "${JSON.stringify(leader)}"`)
    }
    return CardStore.create<LeaderDbObject>(leader)
  }

  /**
   * Adds a Unit card to the database.
   *
   * @param unit The Unit card to add.
   * @param unit.name The name of the Unit card.
   * @param unit.occurrences The number of occurrences of the Unit card that a user can possibly add to any single deck.
   * @param unit.faction The faction the Unit card belongs to.
   * @param unit.dlc The potential DLC that the Unit card was added in.
   * @param unit.hero Whether or not the Unit card is a Hero.
   * @param unit.combats The combat types the Unit card is eligible to perform.
   * @param unit.strength The strength of attacks of the Unit card.
   * @param unit.effects The potential additional effects the Unit card has on the battlefield.
   * @param unit.scorchScope The combat types that the Unit card's scorch effect is limited to.
   * @param unit.scorchMin The minimum strength card the Unit card can scorch.
   * @param unit.musterPrefix The prefix of cards the Unit card can summon if it has the muster effect. Defaults to the name of the Unit card if not defined.
   * @returns The Unit card databased document.
   */
  static async addUnit({
    name,
    occurrences,
    faction,
    dlc,
    hero,
    combats,
    strength,
    effects,
    scorchScope,
    scorchMin,
    musterPrefix,
  }: AddUnitInput): Promise<UnitDbObject> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unit: any = {
      type: CARD_TYPE.Unit,
      name,
      occurrences,
      faction,
      dlc,
      hero,
      combats,
      strength,
      effects,
      scorchScope,
      scorchMin,
      musterPrefix,
    }
    if (CardStore.logger.isTraceEnabled()) {
      CardStore.logger.trace(`Adding unit: "${JSON.stringify(unit)}"`)
    }
    return CardStore.create<UnitDbObject>(unit)
  }
}

export enum CARD_TYPE {
  Leader = 'LEADER',
  Unit = 'UNIT',
}

export interface AddLeaderInput {
  name: string
  faction: Faction
  dlc: Dlc | null
}

export interface AddUnitInput extends AddLeaderInput {
  occurrences: number
  combats: Combat[]
  hero?: boolean
  strength: number | null
  effects: Effect[] | null
  scorchScope: Combat | null
  scorchMin: number | null
  musterPrefix: string | null
}
