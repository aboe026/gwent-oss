import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import EventManager from '../../../event-manager'
import { FactionKey, GameDbObject, GamePlayerDbObject, GameStatus } from '@gwent/graphql-schema/database-typings'
import FactionStore from '../../../../database/stores/faction-store'
import { Game } from '@gwent/graphql-schema/resolver-typings'
import GameResolver from '../../types/game-resolver'
import GameStore from '../../../../database/stores/game-store'
import { getDuplicateItems, randomizeOrder } from '@gwent/utils'
import { OrderSetPayload } from '../../subscription-resolver'
import PresentableError from '../../../../util/presentable-error'
import { PubSubEvents } from '@gwent/constants'

export default class SetGameTurnOrder {
  private static logger = getLogger('SetGameTurnOrder')

  /**
   * Sets the player turn order for a game.
   *
   * @param config The configuration for setting game turn order.
   * @param config.game The Game to set the turn order of.
   * @param config.player The Player setting the turn order for the Game.
   * @param config.userIds The ObjectIds of the users to set the turn order for in the game, in order.
   * @param config.logPrefix The prefix to put before logging statements. Overrides class-level logPrefix.
   * @param config.allowImplicit Whether or not the User is allowed to implicitly set game turn order (without explicitly setting "userIds" input).
   * @returns The updated Game if the user is allowed to set the game turn order.
   * @throws PresentableError if problem setting the turn order on the game.
   */
  static async setGameTurnOrder({
    game,
    player,
    userIds,
    allowImplicit,
    logPrefix,
  }: {
    game: GameDbObject
    player: GamePlayerDbObject
    userIds?: string[] | null
    allowImplicit: boolean
    logPrefix: string
  }): Promise<Game> {
    const scoiaTaelFaction = await FactionStore.getByKey({
      key: FactionKey.ScoiaTael,
      logPrefix: logPrefix,
    })

    const scoiaTaelId = scoiaTaelFaction._id.toString()
    const scoiaTaelPlayers = game.players.filter(
      (gamePlayer) => gamePlayer.deck.from?.faction.toString() === scoiaTaelId
    )
    if (scoiaTaelPlayers.length > 1 && userIds && userIds.length > 0) {
      const message = `Explicit order not allowed when more than 1 player has deck of faction "${FactionKey.ScoiaTael}".`
      SetGameTurnOrder.logger.warn(`${logPrefix} setGameTurnOrder failed: ${message}`)
      throw new PresentableError(message)
    }
    if (scoiaTaelPlayers.length === 0 && userIds && userIds.length > 0) {
      const message = `Explicit order not allowed when deck faction not "${FactionKey.ScoiaTael}".`
      SetGameTurnOrder.logger.warn(`${logPrefix} setGameTurnOrder failed: ${message}`)
      throw new PresentableError(message)
    }
    if (scoiaTaelPlayers.length === 1 && (!userIds || userIds.length === 0) && !allowImplicit) {
      const message = `Random order not allowed when another player has deck faction of "${FactionKey.ScoiaTael}".`
      SetGameTurnOrder.logger.debug(`${logPrefix} setGameTurnOrder failed: ${message}`)
      throw new PresentableError(message)
    }
    if (scoiaTaelPlayers.length === 1 && player.deck.from?.faction.toString() !== scoiaTaelId) {
      const message = `Setting order not allowed when another player has deck faction of "${FactionKey.ScoiaTael}".`
      SetGameTurnOrder.logger.warn(`${logPrefix} setGameTurnOrder failed: ${message}`)
      throw new PresentableError(message)
    }

    if (userIds && userIds.length > 0) {
      const playerIdsInGame = game.players.map((gamePlayer) => gamePlayer.user.toString())
      const playersIdsNotInGame: string[] = []
      for (const playerId of userIds) {
        if (!playerIdsInGame.includes(playerId.toString())) {
          playersIdsNotInGame.push(playerId)
        }
      }
      if (playersIdsNotInGame.length > 0) {
        const message = `User(s) ${JSON.stringify(playersIdsNotInGame)} are not players on game.`
        SetGameTurnOrder.logger.warn(`${logPrefix} setGameTurnOrder failed: ${message}`)
        throw new PresentableError(message)
      }
      if (userIds.length !== game.players.length) {
        const message = `Users count of "${userIds.length}" does not match required count of "${game.players.length}".`
        SetGameTurnOrder.logger.warn(`${logPrefix} setGameTurnOrder failed: ${message}`)
        throw new PresentableError(message)
      }
      const duplicateUserIds = getDuplicateItems<string>(userIds)
      if (duplicateUserIds.length > 0) {
        const message = `Duplicate user(s) ${JSON.stringify(duplicateUserIds)} not allowed.`
        SetGameTurnOrder.logger.warn(`${logPrefix} setGameTurnOrder failed: ${message}`)
        throw new PresentableError(message)
      }
    }

    let userIdsForOrder: string[] = []
    if (userIds && userIds.length > 0) {
      if (SetGameTurnOrder.logger.isTraceEnabled()) {
        SetGameTurnOrder.logger.trace(`${logPrefix} setGameTurnOrder userIds provided, not randomizing order`)
      }
      userIdsForOrder = userIds
    } else {
      SetGameTurnOrder.logger.trace(`${logPrefix} setGameTurnOrder no userIds provided, randomizing order`)
      userIdsForOrder = randomizeOrder(game.players.map((gamePlayer) => gamePlayer.user.toString()))
    }

    game.players = game.players.map((gamePlayer) => {
      gamePlayer.order = userIdsForOrder.indexOf(gamePlayer.user.toString())
      return gamePlayer
    })
    game.turn = new ObjectId(userIdsForOrder[0])
    game.status = GameStatus.Redrawing

    const updatedGame = await GameStore.save(game)

    if (SetGameTurnOrder.logger.isTraceEnabled()) {
      SetGameTurnOrder.logger.trace(`${logPrefix} setGameTurnOrder updatedGame: "${JSON.stringify(updatedGame)}"`)
    }
    if (!updatedGame) {
      const message = 'Could not set order in probable race condition collision.'
      SetGameTurnOrder.logger.error(`${logPrefix} setGameTurnOrder failed: ${message}`)
      throw new PresentableError(message)
    }

    const resolvedGame = await GameResolver.fromObject({
      game: updatedGame,
    })

    EventManager.pubsub.publish(PubSubEvents.OrderSet, {
      orderSet: resolvedGame,
    } as OrderSetPayload)

    return resolvedGame
  }
}
