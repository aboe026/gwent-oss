import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { GameDeck, QueryGameDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import GameDeckResolver from '../types/game-deck-resolver'
import { GraphQLResolveInfo } from 'graphql'
import MutationUtil from '../mutations/mutation-util'
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

    const response = await MutationUtil.getGamePlayer({
      gameId,
      logPrefix,
      userId,
    })

    if (response instanceof Error) {
      return response as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const { player } = response

    if (player.deck.from) {
      GameDeckQuery.logger.trace(`${logPrefix} has deck "${player.deck.from._id}", resolving.`)
      return GameDeckResolver.fromObject({
        gameDeck: player.deck,
      })
    } else {
      GameDeckQuery.logger.trace(`${logPrefix} does not have deck, nothing to resolve.`)
      return null
    }
  }
}
