import AppInfo from '../../app-info'
import DeckStore from '../../database/stores/deck-store'
import env from '../../env'
import FactionStore from '../../database/stores/faction-store'
import LeaderStore from '../../database/stores/leader-store'
import { QueryResolvers, SettingKey, SettingType } from '@gwent/graphql-schema/resolver-typings'
import UnitStore from '../../database/stores/unit-store'
import { version } from '../../../package.json'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const QueryResolver: QueryResolvers<any, any> = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  application: async (parent, args, context, info) => {
    return {
      build: await AppInfo.getBuildNumber(),
      version: version,
    }
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentUser: (parent, args, context, info) => {
    const user = context?.session?.user
    if (!user) {
      throw Error('No user on session')
    }
    return user
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  decks: async (parent, args, context, info) => {
    return DeckStore.get(context.session.user._id)
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  factions: async (parent, args, context, info) => {
    return FactionStore.get({})
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  leaders: async (parent, args, context, info) => {
    let factionIds
    if (args.factions) {
      const factions = await FactionStore.get({
        keys: args.factions,
      })
      factionIds = factions.map((faction) => faction._id)
    }
    return LeaderStore.get({
      factionIds,
    })
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  settings: (parent, args, context, info) => {
    return [
      {
        key: SettingKey.SessionTimeoutSeconds,
        type: SettingType.Number,
        label: 'Session Timeout (seconds)',
        value: env().SESSION_TIMEOUT_SECONDS.toString(),
      },
    ]
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  units: async (parent, args, context, info) => {
    let factionIds
    if (args.factions) {
      const factions = await FactionStore.get({
        keys: args.factions,
      })
      factionIds = factions.map((faction) => faction._id)
    }
    return UnitStore.get({
      deckable: typeof args.deckable === 'boolean' ? args.deckable : undefined,
      factionIds,
    })
  },
}

export default QueryResolver
