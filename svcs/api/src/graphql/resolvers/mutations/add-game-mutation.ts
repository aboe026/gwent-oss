import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import EventManager from '../../event-manager'
import { Game, MutationAddGameArgs, User } from '@gwent/graphql-schema/resolver-typings'
import { GameAddedPayload } from '../subscription-resolver'
import GameResolver from '../types/game-resolver'
import GameStore from '../../../database/stores/game-store'
import { getDuplicateItems } from '@gwent/utils'
import { GraphQLResolveInfo } from 'graphql'
import { PLAYER_COUNTS, PubSubEvents } from '@gwent/constants'
import PresentableError from '../../../util/presentable-error'
import ResolverUtil from '../resolver-util'
import UserResolver from '../types/user-resolver'
import UserStore from '../../../database/stores/user-store'

/**
 * A class for executing the addGame GraphQL Mutation.
 */
export default class AddGameMutation {
  private static logger = getLogger('AddGameMutation')

  /**
   * Add a Game for a user.
   *
   * @param args The arguments for adding a game.
   * @param context The session containing the user adding the game.
   * @param info The information about the GraphQL request.
   * @returns The Game that was added.
   * @throws PresentableError if problem adding game.
   */
  static async addGame(args: MutationAddGameArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const resolverUtil = new ResolverUtil({
      logger: AddGameMutation.logger,
    })
    const { _id: userId, name: creatorName } = resolverUtil.getContextUser({
      context,
      label: 'addGame mutation',
    })

    const logPrefix = `addGame by "${userId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    // validate opponents
    const opponentNames = args.opponentNames
    const duplicateNames = getDuplicateItems(opponentNames)
    if (duplicateNames.length > 0) {
      const message = `Invalid opponents: names ${JSON.stringify(duplicateNames)} are duplicates.`
      AddGameMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    if (opponentNames.includes(creatorName)) {
      const message = 'Invalid opponents: cannot include self.'
      AddGameMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    if (opponentNames.length < PLAYER_COUNTS.Min - 1) {
      const message = `Not enough opponents for game at "${opponentNames.length}", minimum is "${
        PLAYER_COUNTS.Min - 1
      }".`
      AddGameMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    if (opponentNames.length > PLAYER_COUNTS.Max - 1) {
      const message = `Excessive opponents for game at "${opponentNames.length}", maximum is "${
        PLAYER_COUNTS.Max - 1
      }".`
      AddGameMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    const opponents = await UserStore.getByNames(opponentNames)
    if (AddGameMutation.logger.isTraceEnabled()) {
      AddGameMutation.logger.trace(`${logPrefix} opponents: "${JSON.stringify(opponents)}"`)
    }
    const resolvedOpponents: User[] = []
    const errors = []
    for (const opponentName of opponentNames) {
      const opponent = opponents.find((opponent) => opponent.name === opponentName)
      if (!opponent) {
        errors.push(`User with name "${opponentName}" does not exist`)
      } else {
        resolvedOpponents.push(UserResolver.fromObject(opponent))
      }
    }
    if (errors.length > 0) {
      const message = `${errors.join(',')}.`
      AddGameMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    if (AddGameMutation.logger.isTraceEnabled()) {
      AddGameMutation.logger.trace(`${logPrefix} resolvedOpponents: "${JSON.stringify(resolvedOpponents)}"`)
    }
    const game = await GameStore.add({
      creatorId: userId,
      opponentIds: resolvedOpponents.map((opponent) => opponent.id),
    })
    if (AddGameMutation.logger.isTraceEnabled()) {
      AddGameMutation.logger.trace(`${logPrefix} game: "${JSON.stringify(game)}"`)
    }

    const resolvedGame = await GameResolver.fromObject({
      game,
      users: resolvedOpponents,
    })

    EventManager.pubsub.publish(PubSubEvents.GameAdded, {
      gameAdded: resolvedGame,
    } as GameAddedPayload)

    return resolvedGame
  }
}
