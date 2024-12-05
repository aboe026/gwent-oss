import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import DeckResolver from '../types/deck-resolver'
import DeckStore from '../../../database/stores/deck-store'
import { NOT_AUTHENTICATED_MESSAGE } from '@gwent/constants'
import { Deck } from '@gwent/graphql-schema/resolver-typings'
import { RequestedFields } from '@gwent/graphql-schema'
import { GraphQLResolveInfo } from 'graphql'

/**
 * A class for executing the decks GraphQL Query.
 */
export default class DecksQuery {
  private static logger = getLogger('decks-query')

  /**
   * Gets the users Decks they have created.
   *
   * @param context The session containing the user getting their decks.
   * @param info The information about the GraphQL request.
   * @returns The Decks that a user has created.
   */
  static async decks(context: Context, info: GraphQLResolveInfo): Promise<Deck[]> {
    const userId = context.session?.user?._id
    if (!userId) {
      DecksQuery.logger.error(`No user on context for decks query: "${JSON.stringify(context.session)}".`)
      return Error(NOT_AUTHENTICATED_MESSAGE) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const logPrefix = `decks by "${userId}"`
    if (DecksQuery.logger.isTraceEnabled()) {
      DecksQuery.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      DecksQuery.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }
    const decks = await DeckStore.get(userId)
    if (DecksQuery.logger.isTraceEnabled()) {
      DecksQuery.logger.trace(`${logPrefix} decks: "${JSON.stringify(decks)}"`)
    }
    return DeckResolver.fromArray({
      decks,
      neutralDeckStats: RequestedFields.getArgument<boolean>(info, 'decks.faction.stats.neutrals'),
      neutralLeaderStats: RequestedFields.getArgument<boolean>(info, 'decks.leader.faction.stats.neutrals'),
      neutralUnitStats: RequestedFields.getArgument<boolean>(info, 'decks.units.unit.faction.stats.neutrals'),
    })
  }
}
