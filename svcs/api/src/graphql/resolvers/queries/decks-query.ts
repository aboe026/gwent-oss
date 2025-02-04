import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import DeckResolver from '../types/deck-resolver'
import DeckStore from '../../../database/stores/deck-store'
import { Deck } from '@gwent/graphql-schema/resolver-typings'
import { GraphQLResolveInfo } from 'graphql'
import ResolverUtil from '../resolver-util'

/**
 * A class for executing the decks GraphQL Query.
 */
export default class DecksQuery {
  private static logger = getLogger('DecksQuery')

  /**
   * Gets the users Decks they have created.
   *
   * @param context The session containing the user getting their decks.
   * @param info The information about the GraphQL request.
   * @returns The Decks that a user has created.
   */
  static async decks(context: Context, info: GraphQLResolveInfo): Promise<Deck[]> {
    const resolverUtil = new ResolverUtil({
      logger: DecksQuery.logger,
    })
    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'decks query',
    })

    const logPrefix = `decks by "${userId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.printArgsAndInfo({
      info,
    })

    const decks = await DeckStore.get(userId)
    if (DecksQuery.logger.isTraceEnabled()) {
      DecksQuery.logger.trace(`${logPrefix} decks: "${JSON.stringify(decks)}"`)
    }
    return DeckResolver.fromArray({
      decks,
    })
  }
}
