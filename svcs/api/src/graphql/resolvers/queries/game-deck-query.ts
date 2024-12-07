import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { GameDeck, QueryGameDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import GameDeckResolver from '../types/game-deck-resolver'
import GameStore from '../../../database/stores/game-store'
import { GraphQLResolveInfo } from 'graphql'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import { RequestedFields } from '@gwent/graphql-schema'

/**
 * A class for executing the gameDeck GraphQL Query.
 */
export default class GameDeckQuery {
  private static logger = getLogger('GameDeckQuery')

  /**
   * Gets the GameDeck that has potentially been set for a Game.
   *
   * @param context The session containing the user getting the game deck.
   * @param info The information about the GraphQL request.
   * @returns The GameDeck that has potentially been set for a Game.
   */
  static async gameDeck(args: QueryGameDeckArgs, context: Context, info: GraphQLResolveInfo): Promise<GameDeck | null> {
    const userId = context.session?.user?._id
    if (!userId) {
      GameDeckQuery.logger.error(`No user on context for gameDeck query: "${JSON.stringify(context.session)}".`)
      return Error(NOT_AUTHENTICATED_MESSAGE) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const logPrefix = `gameDeck by "${userId}"`
    if (GameDeckQuery.logger.isTraceEnabled()) {
      GameDeckQuery.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
      GameDeckQuery.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      GameDeckQuery.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }
    const gameId = args.game
    if (!ObjectId.isValid(gameId)) {
      const message = `Game ID "${gameId}" is not a valid MongoDB ObjectId.`
      GameDeckQuery.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const game = await GameStore.getById({
      id: gameId,
    })
    if (GameDeckQuery.logger.isTraceEnabled()) {
      GameDeckQuery.logger.trace(`${logPrefix} game: "${JSON.stringify(game)}"`)
    }
    if (!game) {
      const message = `Game with ID "${gameId}" does not exist.`
      GameDeckQuery.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const player = game.players.find((player) => player.user.toString() === userId.toString())
    if (GameDeckQuery.logger.isTraceEnabled()) {
      GameDeckQuery.logger.trace(`${logPrefix} player: "${JSON.stringify(player)}"`)
    }
    if (!player) {
      const message = `Not a player on game "${gameId}".`
      GameDeckQuery.logger.warn(`${logPrefix} failed: ${message}`)
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
  }
}
