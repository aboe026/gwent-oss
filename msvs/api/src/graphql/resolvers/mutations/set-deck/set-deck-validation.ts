import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent-oss/graphql-schema/context'
import { DeckDbObject, GameDbObject, GameStatus } from '@gwent-oss/graphql-schema/database-typings'
import { GraphQLResolveInfo } from 'graphql'
import { MutationSetDeckArgs } from '@gwent-oss/graphql-schema/resolver-typings'
import Permissions from '../../../permissions'
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
    const { _id: userId } = Permissions.isAuthenticated({
      context,
      label: 'setDeck mutation',
    })
    const { game, player } = await Permissions.isGamePlayer({
      gameId: args.game,
      userId,
      label: 'setDeck mutation',
    })
    const deck = await Permissions.isDeckOwner({
      deckId: args.deck,
      userId,
      label: 'setDeck mutation',
    })

    const logPrefix = `setDeck by "${userId}" for deck "${deck._id}" on game "${game._id}"`
    const resolverUtil = new ResolverUtil({
      logger: SetDeckValidation.logger,
      logPrefix,
    })
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    resolverUtil.validateGame({
      game,
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
