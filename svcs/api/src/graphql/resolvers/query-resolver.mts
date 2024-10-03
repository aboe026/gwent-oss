import log4js from 'log4js'

import AppInfo from '../../app-info.mjs'
import DeckResolver from './deck-resolver.mjs'
import DeckStore from '../../database/stores/deck-store.mjs'
import env from '../../env.mjs'
import { FactionDbObject } from '@gwent/graphql-schema/database-typings'
import FactionResolver from './faction-resolver.mjs'
import FactionStore from '../../database/stores/faction-store.mjs'
import GameDeckResolver from './game-deck-resolver.mjs'
import GameResolver from './game-resolver.mjs'
import GameStore from '../../database/stores/game-store.mjs'
import LeaderStore from '../../database/stores/leader-store.mjs'
import LeaderResolver from './leader-resolver.mjs'
import { QueryResolvers, SettingKey, SettingType } from '@gwent/graphql-schema/resolver-typings'
import { RequestedFields } from '@gwent/graphql-schema'
import UnitResolver from './unit-resolver.mjs'
import UnitStore from '../../database/stores/unit-store.mjs'
import UserResolver from './user-resolver.mjs'
import packageJson from '../../../package.json' assert { type: 'json' }

/**
 * A class for executing the searches of the GraphQL Queries defined in the schema.
 */
export default class QueryResolver {
  private static logger = log4js.getLogger('query-resolver')

  /**
   * Get the methods correlating to the GraphQL Queries defined in the schema.
   *
   * @returns The methods used to resolve Queries defined in the GraphQL schema.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getResolvers(): QueryResolvers<any, any> {
    return {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      application: async (parent, args, context, info) => {
        const userId = context?.session?.user?._id
        const logPrefix = `application by "${userId}"`
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          QueryResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
        }
        const build = await AppInfo.getBuildNumber()
        const version = packageJson.version
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(`${logPrefix} build: "${build}"`)
          QueryResolver.logger.trace(`${logPrefix} version: "${version}"`)
        }
        return {
          build,
          version,
        }
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      currentUser: (parent, args, context, info) => {
        const user = context?.session?.user
        const logPrefix = `currentUser by "${user?._id}"`
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          QueryResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
          QueryResolver.logger.trace(`${logPrefix} user: "${JSON.stringify(user)}"`)
        }
        if (!user) {
          const message = 'No user on session.'
          QueryResolver.logger.debug(`${logPrefix} failed: "${message}"`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        return UserResolver.fromObject(user)
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      decks: async (parent, args, context, info) => {
        const userId = context.session.user._id
        const logPrefix = `decks by "${userId}"`
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          QueryResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
        }
        const decks = await DeckStore.get(userId)
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(`${logPrefix} decks: "${JSON.stringify(decks)}"`)
        }
        return DeckResolver.fromArray({
          decks,
          neutralDeckStats: RequestedFields.getArgument<boolean>(info, 'decks.faction.stats.neutrals'),
          neutralLeaderStats: RequestedFields.getArgument<boolean>(info, 'decks.leader.faction.stats.neutrals'),
          neutralUnitStats: RequestedFields.getArgument<boolean>(info, 'decks.units.unit.faction.stats.neutrals'),
        })
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      factions: async (parent, args, context, info) => {
        const userId = context.session.user._id
        const logPrefix = `factions by "${userId}"`
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          QueryResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
        }
        const factions = await FactionStore.get({})
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(`${logPrefix} factions: "${JSON.stringify(factions)}"`)
        }
        const neutrals = RequestedFields.getArgument<boolean>(info, 'factions.stats.neutrals')
        return FactionResolver.fromArray({
          factions,
          neutralStats: neutrals,
        })
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      game: async (parent, args, context, info) => {
        const userId = context.session.user._id
        const logPrefix = `game by "${userId}"`
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
          QueryResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          QueryResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
        }
        const gameId = args.id
        return GameResolver.fromId(gameId)
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      gameDeck: async (parent, args, context, info) => {
        const userId = context?.session?.user._id
        const logPrefix = `gameDeck by "${userId}"`
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
          QueryResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          QueryResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
        }
        const gameId = args.game
        const game = await GameStore.getById({
          id: gameId,
        })
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(`${logPrefix} game: "${JSON.stringify(game)}"`)
        }
        if (!game) {
          const message = `Game with ID "${gameId}" does not exist.`
          QueryResolver.logger.error(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const player = game.players.find((player) => player.user.toString() === userId.toString())
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(`${logPrefix} player: "${JSON.stringify(player)}"`)
        }
        if (!player) {
          const message = `Not a player on game "${gameId}".`
          QueryResolver.logger.debug(`${logPrefix} failed: ${message}`)
          return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
        }
        if (player.deck.from) {
          return GameDeckResolver.fromObject({
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
        const logPrefix = `games by "${userId}"`
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          QueryResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
        }
        const games = await GameStore.getByUserId(userId)
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(`${logPrefix} games: "${JSON.stringify(games)}"`)
        }
        return GameResolver.fromArray(games)
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      leaders: async (parent, args, context, info) => {
        const userId = context.session.user._id
        const logPrefix = `leaders by "${userId}"`
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
          QueryResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          QueryResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
        }
        const factionKeys = args.factions
        let factionIds: string[] | undefined = undefined
        let factions: FactionDbObject[] | undefined
        if (factionKeys) {
          factions = await FactionStore.get({
            keys: factionKeys,
          })
          if (QueryResolver.logger.isTraceEnabled()) {
            QueryResolver.logger.trace(`${logPrefix} factions: "${JSON.stringify(factions)}"`)
          }
          factionIds = factions.map((faction) => faction._id.toString())
        }
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(`${logPrefix} factionIds: "${JSON.stringify(factionIds)}"`)
        }
        const leaders = await LeaderStore.get({
          factionIds,
        })
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(`${logPrefix} leaders: "${JSON.stringify(leaders)}"`)
        }
        return LeaderResolver.fromArray({
          leaders,
          factions,
          neutralStats: RequestedFields.getArgument<boolean>(info, 'leaders.faction.stats.neutrals'),
        })
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      settings: (parent, args, context, info) => {
        const userId = context.session.user._id
        const logPrefix = `settings by "${userId}"`
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          QueryResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
        }
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
        const userId = context.session.user._id
        const logPrefix = `units by "${userId}"`
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
          QueryResolver.logger.trace(
            `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
          )
          QueryResolver.logger.trace(
            `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
          )
        }
        const factionKeys = args.factions
        const deckable = args.deckable
        let factionIds: string[] | undefined = undefined
        let factions: FactionDbObject[] | undefined
        if (factionKeys) {
          factions = await FactionStore.get({
            keys: factionKeys,
          })
          if (QueryResolver.logger.isTraceEnabled()) {
            QueryResolver.logger.trace(`${logPrefix} factions: "${JSON.stringify(factions)}"`)
          }
          factionIds = factions.map((faction) => faction._id.toString())
        }
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(`${logPrefix} factionIds: "${JSON.stringify(factionIds)}"`)
        }
        const units = await UnitStore.get({
          deckable: typeof deckable === 'boolean' ? deckable : undefined,
          factionIds,
        })
        if (QueryResolver.logger.isTraceEnabled()) {
          QueryResolver.logger.trace(`${logPrefix} units: "${JSON.stringify(units)}"`)
        }
        return UnitResolver.fromArray({
          factions,
          units,
          neutralStats: RequestedFields.getArgument<boolean>(info, 'units.faction.stats.neutrals'),
        })
      },
    }
  }
}
