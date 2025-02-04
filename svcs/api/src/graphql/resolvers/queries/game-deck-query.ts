import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { GameDeck, QueryGameDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import GameDeckResolver from '../types/game-deck-resolver'
import { GraphQLResolveInfo } from 'graphql'
import ResolverUtil from '../resolver-util'

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
    const resolverUtil = new ResolverUtil({
      logger: GameDeckQuery.logger,
    })
    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'gameDeck query',
    })

    const logPrefix = `gameDeck by "${userId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.printArgsAndInfo({
      args,
      info,
    })

    const gameId = args.game

    const { player } = await resolverUtil.getGamePlayer({
      gameId,
      userId,
    })

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
