import { ObjectId } from 'mongodb'

import { FactionDbObject, LeaderDbObject } from '@gwent/graphql-schema/database-typings'
import FactionStore from '../../database/stores/faction-store'
import { LeaderResolvers } from '@gwent/graphql-schema/resolver-typings'
import { resolveDlc } from './resolver-util'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LeaderResolver: LeaderResolvers<any, LeaderDbObject> = {
  dlc: async (leader: LeaderDbObject) => resolveDlc(leader),
  faction: async (leader: LeaderDbObject) => {
    if (ObjectId.isValid(leader.faction)) {
      const factions = await FactionStore.get({
        ids: [leader.faction],
      })
      return factions[0]
    }
    return leader.faction as any as FactionDbObject // eslint-disable-line @typescript-eslint/no-explicit-any
  },
  id: (leader: LeaderDbObject) => leader._id.toString(),
}

export default LeaderResolver
