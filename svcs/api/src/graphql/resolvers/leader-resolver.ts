import { FactionDbObject, LeaderDbObject } from '@gwent/graphql-schema/database-typings'
import { Dlc, Faction, Leader } from '@gwent/graphql-schema/resolver-typings'
import FactionResolver from './faction-resolver'
import { DlcResolver } from './dlc-resolver'
import { ObjectId } from 'mongodb'
import LeaderStore from '../../database/stores/leader-store'
import { getUniqueItems } from '@gwent/utils'

export default class LeaderResolver {
  static async resolveFromObject({
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
      dlc: dlc || (await DlcResolver.resolveFromId(leader.dlc)),
      faction:
        faction ||
        (await FactionResolver.resolveFromId({
          id: leader.faction,
          neutrals: neutralStats,
        })),
      id: leader._id.toString(),
      image: leader.image,
      name: leader.name,
      quote: leader.quote,
    }
  }

  static async resolveFromId({ id, neutralStats }: { id: string | ObjectId; neutralStats?: boolean }): Promise<Leader> {
    return (
      await LeaderResolver.resolveFromIds({
        ids: [id],
        neutralStats,
      })
    )[0]
  }

  static async resolveFromIds({
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
    const leaders = await LeaderStore.get({
      ids: ids,
    })

    return LeaderResolver.resolveFromArray({
      leaders,
      factions,
      resolvedFactions,
      neutralStats,
    })
  }

  static async resolveFromArray({
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
    const dlcs = await DlcResolver.resolveFromIds(dlcIds)

    if (!resolvedFactions) {
      if (factions) {
        resolvedFactions = await FactionResolver.resolveFromArray({
          factions,
          neutralStats,
        })
      } else {
        const factionIds = getUniqueItems<ObjectId>(leaders.map((leader) => leader.faction))
        resolvedFactions = await FactionResolver.resolveFromIds({
          ids: factionIds,
          neutralStats,
        })
      }
    }

    const resolvedLeaders: Leader[] = []
    for (const leader of leaders) {
      const faction = resolvedFactions.find((faction) => faction.id.toString() === leader.faction.toString())
      let dlc: Dlc | undefined
      if (leader.dlc) {
        dlc = dlcs.find((dlc) => dlc.id.toString() === leader.dlc?.toString())
      }
      resolvedLeaders.push(
        await LeaderResolver.resolveFromObject({
          leader,
          dlc,
          faction,
          neutralStats,
        })
      )
    }

    return resolvedLeaders
  }
}
