import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { GameDeck, QueryGameDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import GameDeckResolver from '../types/game-deck-resolver'
import { GraphQLResolveInfo } from 'graphql'
import Permissions from '../../permissions'
import ResolverUtil from '../resolver-util'

/**
 * A class for executing the gameDeck GraphQL Query.
 */
export default class GameDeckQuery {
  private static logger = getLogger('GameDeckQuery')

  /**
   * Gets the GameDeck that has potentially been set for a Game.
   *
   * @param args The arguments the user supplied to the query.
   * @param context The session containing the user getting the game deck.
   * @param info The information about the GraphQL request.
   * @returns The GameDeck that has potentially been set for a Game.
   */
  static async gameDeck(args: QueryGameDeckArgs, context: Context, info: GraphQLResolveInfo): Promise<GameDeck | null> {
    const { _id: userId } = Permissions.isAuthenticated({
      context,
      label: 'gameDeck query',
    })
    const { game, player } = await Permissions.isGamePlayer({
      gameId: args.game,
      userId,
      label: 'gameDeck query',
    })

    const logPrefix = `gameDeck by "${userId}" for game "${game._id}"`
    const resolverUtil = new ResolverUtil({
      logger: GameDeckQuery.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    resolverUtil.validateGame({
      game,
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
