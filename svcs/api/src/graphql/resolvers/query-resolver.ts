import log4js from 'log4js'

import AppInfo from '../../app-info'
import DeckStore from '../../database/stores/deck-store'
import env from '../../env'
import FactionStore from '../../database/stores/faction-store'
import GameStore from '../../database/stores/game-store'
import LeaderStore from '../../database/stores/leader-store'
import { QueryResolvers, SettingKey, SettingType } from '@gwent/graphql-schema/resolver-typings'
import UnitStore from '../../database/stores/unit-store'
import { version } from '../../../package.json'
import UserResolver from './user-resolver'
import FactionResolver from './faction-resolver'
import LeaderResolver from './leader-resolver'
import UnitResolver from './unit-resolver'
import { FactionDbObject } from '@gwent/graphql-schema/database-typings'
import DeckResolver from './deck-resolver'
import GameResolver from './game-resolver'
import GameDeckResolver from './game-deck-resolver'
import { RequestedFields } from '@gwent/graphql-schema'

const logger = log4js.getLogger('query-resolver')

/**
 * Resolver for GraphQL queries
 * which are used to retrieve data
 */
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
      const message = 'No user on session'
      logger.debug(`Cannot get currentUser: "${message}"`)
      throw Error(message)
    }
    return UserResolver.resolveByObject(user)
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  decks: async (parent, args, context, info) => {
    const userId = context.session.user._id
    return DeckResolver.resolveFromArray({
      decks: await DeckStore.get(userId),
      neutralDeckStats: RequestedFields.getArgument<boolean>(info, 'decks.faction.stats.neutrals'),
      neutralLeaderStats: RequestedFields.getArgument<boolean>(info, 'decks.leader.faction.stats.neutrals'),
      neutralUnitStats: RequestedFields.getArgument<boolean>(info, 'decks.units.unit.faction.stats.neutrals'),
    })
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  factions: async (parent, args, context, info) => {
    const factions = await FactionStore.get({})
    const neutrals = RequestedFields.getArgument<boolean>(info, 'factions.stats.neutrals')
    const resolvedFaction = await FactionResolver.resolveFromArray({
      factions,
      neutralStats: neutrals,
    })
    return resolvedFaction
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  game: async (parent, args, context, info) => {
    const userId = context?.session?.user._id
    const gameId = args.id
    const game = await GameResolver.resolveById(gameId)
    if (!game) {
      const message = 'Game does not exist'
      logger.error(`Could not get game "${gameId}" for user "${userId}": ${message}`)
      throw Error(message)
    }
    return game
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  gameDeck: async (parent, args, context, info) => {
    const userId = context?.session?.user._id
    const gameId = args.game
    const game = await GameStore.getById({
      id: gameId,
    })
    if (!game) {
      const message = `Game with ID "${gameId}" does not exist`
      logger.error(`Cannot get gameDeck for user "${userId}": ${message}`)
      throw Error(message)
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const player = game.players.find((player) => player.user.toString() === userId.toString())
    if (!player) {
      const message = `Not a player for game with ID "${gameId}"`
      logger.debug(`Cannot get gameDeck for user "${userId}": ${message}`)
      throw Error(message)
    }
    if (player.deck.from) {
      return GameDeckResolver.resolveFromObject({
        gameDeck: player.deck,
        neutralDeckStats: RequestedFields.getArgument(info, 'gameDeck.from.faction.stats.neutrals'),
        neutralLeaderStats: RequestedFields.getArgument(info, 'gameDeck.from.leader.faction.stats.neutrals'),
        neutralUnitStats: RequestedFields.getArgument(info, 'gameDeck.from.units.unit.faction.stats.neutrals'),
      })
    }
    return null
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  games: async (parent, args, context, info) => {
    const userId = context.session.user._id
    const games = await GameStore.getByUserId(userId)
    return GameResolver.resolveFromArray(games)
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  leaders: async (parent, args, context, info) => {
    const factionKeys = args.factions
    let factionIds: string[] | undefined = undefined
    let factions: FactionDbObject[] | undefined
    if (factionKeys) {
      logger.trace(`Getting factions with keys "${JSON.stringify(factionKeys)}" for leaders`)
      factions = await FactionStore.get({
        keys: factionKeys,
      })
      factionIds = factions.map((faction) => faction._id.toString())
    }
    const leaders = await LeaderStore.get({
      factionIds,
    })
    return LeaderResolver.resolveFromArray({
      leaders,
      factions,
      neutralStats: RequestedFields.getArgument<boolean>(info, 'leaders.faction.stats.neutrals'),
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
    const factionKeys = args.factions
    const deckable = args.deckable
    let factionIds: string[] | undefined = undefined
    let factions: FactionDbObject[] | undefined
    if (factionKeys) {
      logger.trace(`Getting factions with keys "${JSON.stringify(factionKeys)}" for units`)
      factions = await FactionStore.get({
        keys: factionKeys,
      })
      factionIds = factions.map((faction) => faction._id.toString())
    }
    const units = await UnitStore.get({
      deckable: typeof deckable === 'boolean' ? deckable : undefined,
      factionIds,
    })
    return UnitResolver.resolveFromArray({
      factions,
      units,
      neutralStats: RequestedFields.getArgument<boolean>(info, 'units.faction.stats.neutrals'),
    })
  },
}

export default QueryResolver
