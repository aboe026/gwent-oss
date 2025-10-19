import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { DeckDbObject, GameDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import DeckStore from '../../../../database/stores/deck-store'
import { GraphQLResolveInfo } from 'graphql'
import { MutationSetDeckArgs } from '@gwent/graphql-schema/resolver-typings'
import PresentableError from '../../../../util/presentable-error'
import ResolverUtil from '../../resolver-util'

/**
 * A class for validating the setDeck GraphQL Mutation.
 */
export default class SetDeckValidation {
  private static logger = getLogger('SetDeckValidation')

  /**
   * Validates the inputs for setting a deck for a game.
   *
   * @param args The arguments for setting a deck.
   * @param context The session containing the user setting the deck.
   * @param info The information about the GraphQL request.
   * @returns The information needed to set the deck.
   * @throws {PresentableError} if known problem setting deck.
   */
  static async setDeckValidation(
    args: MutationSetDeckArgs,
    context: Context,
    info: GraphQLResolveInfo
  ): Promise<ValidatedSetDeck> {
    const resolverUtil = new ResolverUtil({
      logger: SetDeckValidation.logger,
    })
    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'setDeck mutation',
    })
    const gameId = args.game
    const deckId = args.deck

    const logPrefix = `setDeck by "${userId}" for deck "${deckId}" on game "${gameId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    resolverUtil.verifyMongoIds({
      ids: [deckId],
      label: 'Deck ID',
    })

    const deck = await DeckStore.getById({
      id: deckId,
    })
    if (SetDeckValidation.logger.isTraceEnabled()) {
      SetDeckValidation.logger.trace(`${logPrefix} deck: "${JSON.stringify(deck)}"`)
    }
    if (!deck) {
      const message = 'Deck does not exist.'
      SetDeckValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    const { game, player } = await resolverUtil.getGamePlayer({
      gameId,
      userId,
      status: GameStatus.Decking,
      label: 'set deck',
    })

    if (player.deck.from !== null && player.deck.from !== undefined) {
      const message = 'Deck already set.'
      SetDeckValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    return {
      deck,
      game,
      logPrefix,
      userId,
    }
  }
}

export interface ValidatedSetDeck {
  deck: DeckDbObject
  game: GameDbObject
  logPrefix: string
  userId: ObjectId
}
