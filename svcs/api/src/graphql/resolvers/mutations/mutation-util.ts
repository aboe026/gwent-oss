import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import EventManager from '../../event-manager'
import { FactionKey, Game } from '@gwent/graphql-schema/resolver-typings'
import FactionStore from '../../../database/stores/faction-store'
import GameResolver from '../types/game-resolver'
import GameStore from '../../../database/stores/game-store'
import { getDuplicateItems, randomizeOrder } from '@gwent/utils'
import { PubSubEvents } from '@gwent/constants'

/**
 * A class containing shared methods used by GraphQL mutations.
 */
export default class MutationUtil {
  private static logger = getLogger('mutation-util')

  /**
   * Sets the player turn order for a game.
   *
   * @param config The configuration for setting game turn order.
   * @param config.userId The ObjectID of the User which is attempting to set the game turn order.
   * @param config.gameId The ObjectID of the Game to set the turn order for.
   * @param config.userIds The ObjectIDs of the users to set the turn order for in the game, in order.
   * @param config.logPrefix The prefix to put before logging statements.
   * @param config.allowImplicit Whether or not the User is allowed to implicitly set game turn order (without explicitly setting "userIds" input).
   * @returns The updated Game if the user is allowed to set the game turn order.
   */
  static async setGameTurnOrder({
    userId,
    gameId,
    userIds,
    logPrefix,
    allowImplicit,
  }: {
    userId: string | ObjectId
    gameId: string
    userIds?: string[] | null
    logPrefix: string
    allowImplicit: boolean
  }): Promise<Game> {
    const game = await GameStore.getById({
      id: gameId,
    })
    if (MutationUtil.logger.isTraceEnabled()) {
      MutationUtil.logger.trace(`${logPrefix} game: "${JSON.stringify(game)}"`)
    }
    if (!game) {
      const message = `Game with ID "${gameId}" does not exist.`
      MutationUtil.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const player = game.players.find((player) => player.user.toString() === userId.toString())
    if (MutationUtil.logger.isTraceEnabled()) {
      MutationUtil.logger.trace(`${logPrefix} player: "${JSON.stringify(player)}"`)
    }
    if (!player) {
      const message = `Not a player on game "${gameId}".`
      MutationUtil.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    // cannot set order before all players choose deck
    // because cannot tell if there is only 1 user with ScoiaTael deck
    // (and therefore can choose the order for the game)
    // until all players have chosen decks
    if (game.players.some((player) => !player.deck.from)) {
      const message = `Not all players have chosen decks yet for game "${gameId}".`
      MutationUtil.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    if (game.turn) {
      const message = `Game with ID "${gameId}" already has order set.`
      MutationUtil.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const factions = await FactionStore.get({
      keys: [FactionKey.ScoiaTael],
    })
    if (!factions || factions.length === 0) {
      const message = `Could not find faction with key "${FactionKey.ScoiaTael}".`
      MutationUtil.logger.error(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    } else if (factions.length > 1) {
      const message = `Found more than 1 faction with key "${FactionKey.ScoiaTael}".`
      MutationUtil.logger.error(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    } else if (factions[0].key !== FactionKey.ScoiaTael) {
      const message = `Faction key of "${factions[0].key}" does not match "${FactionKey.ScoiaTael}".`
      MutationUtil.logger.error(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const scoiaTaelId = factions[0]._id.toString()
    const scoiaTaelPlayers = game.players.filter((player) => player.deck.from?.faction.toString() === scoiaTaelId)
    if (scoiaTaelPlayers.length > 1 && userIds && userIds.length > 0) {
      const message = `Cannot set explicit order as more than 1 player has chosen a deck of faction "${FactionKey.ScoiaTael}" for game "${gameId}".`
      MutationUtil.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (scoiaTaelPlayers.length === 0 && userIds && userIds.length > 0) {
      const message = `Cannot set explicit order as deck faction ID "${player.deck.from?.faction}" does not match "${FactionKey.ScoiaTael}" faction ID of "${scoiaTaelId}".`
      MutationUtil.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (scoiaTaelPlayers.length === 1 && (!userIds || userIds.length === 0) && !allowImplicit) {
      const message = `Cannot set order randomly as another player for game "${gameId}" has a deck faction of "${FactionKey.ScoiaTael}" which allows them to set game order.`
      MutationUtil.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (scoiaTaelPlayers.length === 1 && player.deck.from?.faction.toString() !== scoiaTaelId) {
      const message = `Cannot set order as another player for game "${gameId}" has a deck faction of "${FactionKey.ScoiaTael}" which allows them to set game order.`
      MutationUtil.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    if (userIds && userIds.length > 0) {
      const playerIdsInGame = game.players.map((player) => player.user.toString())
      const playersIdsNotInGame: string[] = []
      for (const playerId of userIds) {
        if (!playerIdsInGame.includes(playerId.toString())) {
          playersIdsNotInGame.push(playerId)
        }
      }
      if (playersIdsNotInGame.length > 0) {
        const message = `Cannot set order as users(s) ${JSON.stringify(
          playersIdsNotInGame
        )} are not players on game "${gameId}".`
        MutationUtil.logger.warn(`${logPrefix} failed: ${message}`)
        return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      if (userIds.length !== game.players.length) {
        const message = `Cannot set order as users count of "${userIds.length}" does not match player count of "${game.players.length}" for game "${gameId}".`
        MutationUtil.logger.warn(`${logPrefix} failed: ${message}`)
        return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      const duplicateUserIds = getDuplicateItems<string>(userIds)
      if (duplicateUserIds.length > 0) {
        const message = `Cannot set order for game "${gameId}" due to duplicate user ID(s) ${JSON.stringify(
          duplicateUserIds
        )} specified.`
        MutationUtil.logger.warn(`${logPrefix} failed: ${message}`)
        return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    }

    const updatedGame = await GameStore.setOrder({
      gameId,
      userIds: userIds && userIds.length > 0 ? userIds : randomizeOrder(game.players.map((player) => player.user)),
    })
    if (MutationUtil.logger.isTraceEnabled()) {
      MutationUtil.logger.trace(`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`)
    }
    if (!updatedGame) {
      const message = `Could not set order on game "${gameId}" in probable race condition collision.`
      MutationUtil.logger.error(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const resolvedGame = await GameResolver.fromObject({
      game: updatedGame,
    })

    EventManager.pubsub.publish(PubSubEvents.OrderSet, {
      orderSet: resolvedGame,
    })

    return resolvedGame
  }
}
