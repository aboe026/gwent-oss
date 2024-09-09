import { getLogger } from 'log4js'

import { FactionDbObject, LeaderDbObject } from '@gwent/graphql-schema/database-typings'
import { Dlc, Faction, Leader } from '@gwent/graphql-schema/resolver-typings'
import FactionResolver from './faction-resolver'
import DlcResolver from './dlc-resolver'
import { ObjectId } from 'mongodb'
import LeaderStore from '../../database/stores/leader-store'
import { getUniqueItems } from '@gwent/utils'
import Verifier from '../../util/verifier'

export default class LeaderResolver {
  private static logger = getLogger('leader-resolver')

  static async fromObject({
    dlc,
    faction,
    leader,
    neutralStats,
  }: {
    dlc?: Dlc
    faction?: Faction
    leader: LeaderDbObject
    neutralStats?: boolean
  }): Promise<Leader> {
    return {
      ability: leader.ability,
      created: leader.created,
      dlc: leader.dlc && (dlc || (await DlcResolver.fromId(leader.dlc))),
      faction:
        faction ||
        (await FactionResolver.fromId({
          id: leader.faction,
          neutrals: neutralStats,
        })),
      id: leader._id.toString(),
      image: leader.image,
      name: leader.name,
      quote: leader.quote,
    }
  }

  static async fromId({ id, neutralStats }: { id: string | ObjectId; neutralStats?: boolean }): Promise<Leader> {
    const leaders = await LeaderResolver.fromIds({
      ids: [id],
      neutralStats,
    })
    return leaders[0]
  }

  static async fromIds({
    ids,
    factions,
    resolvedFactions,
    neutralStats,
  }: {
    ids: (ObjectId | string)[]
    factions?: FactionDbObject[]
    resolvedFactions?: Faction[]
    neutralStats?: boolean
  }): Promise<Leader[]> {
    // TODO: short-circuit other resolvers if emtpy
    if (ids.length === 0) {
      return []
    }

    const leaders = await LeaderStore.get({
      ids: ids,
    })

    Verifier.checkObjects({
      expectedKeys: ids,
      objects: leaders,
      field: '_id',
      logger: LeaderResolver.logger,
      label: 'leaders',
    })

    return LeaderResolver.fromArray({
      leaders,
      factions,
      resolvedFactions,
      neutralStats,
    })
  }

  static async fromArray({
    factions,
    leaders,
    resolvedFactions,
    neutralStats,
  }: {
    factions?: FactionDbObject[]
    resolvedFactions?: Faction[]
    leaders: LeaderDbObject[]
    neutralStats?: boolean
  }): Promise<Leader[]> {
    const dlcIds = getUniqueItems<ObjectId>(leaders.map((leader) => leader.dlc))
    const dlcs = await DlcResolver.fromIds(dlcIds)

    if (!resolvedFactions) {
      if (factions) {
        resolvedFactions = await FactionResolver.fromArray({
          factions,
          neutralStats,
        })
      } else {
        const factionIds = getUniqueItems<ObjectId>(leaders.map((leader) => leader.faction))
        resolvedFactions = await FactionResolver.fromIds({
          ids: factionIds,
          neutralStats,
        })
      }
    }

    const resolvedLeaders: Leader[] = []
    for (const leader of leaders) {
      resolvedLeaders.push(
        await LeaderResolver.fromObject({
          leader,
          dlc: leader.dlc && dlcs.find((dlc) => dlc.id.toString() === leader.dlc?.toString()),
          faction: resolvedFactions.find((faction) => faction.id.toString() === leader.faction.toString()),
          neutralStats,
        })
      )
    }

    return resolvedLeaders
  }
}
