import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { getDuplicateItems } from '@gwent/utils'
import { GraphQLResolveInfo } from 'graphql'
import { MutationAddGameArgs, User } from '@gwent/graphql-schema/resolver-typings'
import { PLAYER_COUNTS } from '@gwent/constants'
import PresentableError from '../../../../util/presentable-error'
import ResolverUtil from '../../resolver-util'
import UserResolver from '../../types/user-resolver'
import UserStore from '../../../../database/stores/user-store'

/**
 * A class for executing the addGame GraphQL Mutation.
 */
export default class AddGameValidation {
  private static logger = getLogger('AddGameValidation')

  /**
   * Add a Game for a user.
   *
   * @param args The arguments for adding a game.
   * @param context The session containing the user adding the game.
   * @param info The information about the GraphQL request.
   * @returns The Game that was added.
   * @throws PresentableError if problem adding game.
   */
  static async addGameValidation(
    args: MutationAddGameArgs,
    context: Context,
    info: GraphQLResolveInfo
  ): Promise<ValidatedAddGame> {
    const resolverUtil = new ResolverUtil({
      logger: AddGameValidation.logger,
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
      const message = `Opponent(s) ${JSON.stringify(duplicateNames)} are duplicates.`
      AddGameValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    if (opponentNames.includes(creatorName)) {
      const message = 'Opponents cannot include self.'
      AddGameValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    if (opponentNames.length < PLAYER_COUNTS.Min - 1) {
      const message = `Not enough opponents at "${opponentNames.length}", minimum is "${PLAYER_COUNTS.Min - 1}".`
      AddGameValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    if (opponentNames.length > PLAYER_COUNTS.Max - 1) {
      const message = `Excessive opponent count of "${opponentNames.length}", maximum is "${PLAYER_COUNTS.Max - 1}".`
      AddGameValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    const opponents = await UserStore.getByNames(opponentNames)
    if (AddGameValidation.logger.isTraceEnabled()) {
      AddGameValidation.logger.trace(`${logPrefix} opponents: "${JSON.stringify(opponents)}"`)
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
      AddGameValidation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    if (AddGameValidation.logger.isTraceEnabled()) {
      AddGameValidation.logger.trace(`${logPrefix} resolvedOpponents: "${JSON.stringify(resolvedOpponents)}"`)
    }

    return {
      logPrefix,
      opponents: resolvedOpponents,
      userId,
    }
  }
}

interface ValidatedAddGame {
  logPrefix: string
  opponents: User[]
  userId: ObjectId
}
