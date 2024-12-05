import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import EventManager from '../../event-manager'
import GameResolver from '../types/game-resolver'
import GameStore from '../../../database/stores/game-store'
import { getDuplicateItems } from '@gwent/utils'
import { GraphQLResolveInfo } from 'graphql'
import { NOT_AUTHENTICATED_MESSAGE, PLAYER_COUNTS, PubSubEvents } from '@gwent/constants'
import { RequestedFields } from '@gwent/graphql-schema'
import { Game, MutationAddGameArgs, User } from '@gwent/graphql-schema/resolver-typings'
import UserResolver from '../types/user-resolver'
import UserStore from '../../../database/stores/user-store'

/**
 * A class for executing the addGame GraphQL Mutation.
 */
export default class AddGameMutation {
  private static logger = getLogger('add-game-mutation')

  /**
   * Add a Game for a user.
   *
   * @param args The arguments for adding a game.
   * @param context The session containing the user adding the game.
   * @param info The information about the GraphQL request.
   * @returns The Game that was added.
   */
  static async addGame(args: MutationAddGameArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const userId = context.session?.user?._id
    const creatorName = context.session?.user?.name
    if (!userId || !creatorName) {
      AddGameMutation.logger.error(`No user on context for addGame mutation: "${JSON.stringify(context.session)}".`)
      return Error(NOT_AUTHENTICATED_MESSAGE) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const logPrefix = `addGame by "${userId}"`
    if (AddGameMutation.logger.isTraceEnabled()) {
      AddGameMutation.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
      AddGameMutation.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      AddGameMutation.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
      AddGameMutation.logger.trace(`${logPrefix} creator: "${creatorName}"`)
    }
    const opponentNames = args.opponentNames
    const duplicateNames = getDuplicateItems(opponentNames)
    if (duplicateNames.length > 0) {
      const message = `Invalid opponents: names ${JSON.stringify(duplicateNames)} are duplicates.`
      AddGameMutation.logger.debug(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (opponentNames.includes(creatorName)) {
      const message = 'Invalid opponents: cannot include self.'
      AddGameMutation.logger.debug(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (opponentNames.length < PLAYER_COUNTS.Min - 1) {
      const message = `Not enough opponents for game at "${opponentNames.length}", minimum is "${
        PLAYER_COUNTS.Min - 1
      }".`
      AddGameMutation.logger.debug(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (opponentNames.length > PLAYER_COUNTS.Max - 1) {
      const message = `Excessive opponents for game at "${opponentNames.length}", maximum is "${
        PLAYER_COUNTS.Max - 1
      }".`
      AddGameMutation.logger.debug(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
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
      AddGameMutation.logger.debug(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
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
    // neutral stats resolving not really needed here (since no decks are set when game initially created)
    // but left in for good measure
    const resolvedGame = await GameResolver.fromObject({
      game,
      users: resolvedOpponents,
      neutralFactionStats: RequestedFields.getArgument(info, 'addGame.players.faction.stats.neutrals'),
      neutralLeaderStats: RequestedFields.getArgument(info, 'addGame.players.leader.faction.stats.neutrals'),
    })

    EventManager.pubsub.publish(PubSubEvents.GameAdded, {
      gameAdded: resolvedGame,
    })

    return resolvedGame
  }
}
