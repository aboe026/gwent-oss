import { Combat, Dlc, Effect, Faction, LeaderDbObject, UnitDbObject } from './generated-typings'
import { getLogger } from 'log4js'
import Store from './store'

export default class CardStore extends Store {
  static readonly COLLECTION_NAME = 'cards'
  private static logger = getLogger('card-store')

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
