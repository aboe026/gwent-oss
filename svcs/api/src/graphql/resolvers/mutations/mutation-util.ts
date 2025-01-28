import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import EventManager from '../../event-manager'
import { FactionKey, Game } from '@gwent/graphql-schema/resolver-typings'
import FactionStore from '../../../database/stores/faction-store'
import {
  GameDbObject,
  GamePlayerDbObject,
  GameStatus,
  PlayerCombatRowDbObject,
  RoundResult,
} from '@gwent/graphql-schema/database-typings'
import GameResolver from '../types/game-resolver'
import GameStore from '../../../database/stores/game-store'
import { getDuplicateItems, randomizeOrder, sortObjectArray } from '@gwent/utils'
import { OrderSetPayload } from '../subscription-resolver'
import { PubSubEvents } from '@gwent/constants'

/**
 * A class containing shared methods used by GraphQL mutations.
 */
export default class MutationUtil {
  private static logger = getLogger('MutationUtil')

  /**
   * Get a game and player on it.
   *
   * @param config The configuration to get the Game and the player on it.
   * @param config.gameId The ID of the game to get.
   * @param config.userId The ID of the player to get on the game.
   * @param config.logPrefix The prefix to add to the beginning of log statements.
   * @param config.status An optional status to require the game to have, otherwise return an error.
   * @param config.turn Whether or not to enforce that the given game player should be the player with the current turn, otherwise return an error.
   * @param config.label The label to use when logging and returning errors.
   * @returns The game and player if they exist, otherwise an Error.
   */
  static async getGamePlayer({
    gameId,
    logPrefix,
    userId,
    status,
    turn,
    label,
  }: {
    gameId: string
    logPrefix: string
    userId: ObjectId
    status?: GameStatus
    turn?: boolean
    label?: string
  }): Promise<GamePlayerResponse | Error> {
    if (!ObjectId.isValid(gameId)) {
      const message = `Game ID "${gameId}" is not a valid MongoDB ObjectId.`
      MutationUtil.logger.warn(`${logPrefix} getGamePlayer failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const game = await GameStore.getById({
      id: gameId,
    })
    if (MutationUtil.logger.isTraceEnabled()) {
      MutationUtil.logger.trace(`${logPrefix} getGamePlayer game: "${JSON.stringify(game)}"`)
    }
    if (!game) {
      const message = `Game with ID "${gameId}" does not exist.`
      MutationUtil.logger.warn(`${logPrefix} getGamePlayer failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const players: GamePlayerDbObject[] = game.players.filter((player) => player.user.toString() === userId.toString())
    if (MutationUtil.logger.isTraceEnabled()) {
      MutationUtil.logger.trace(`${logPrefix} getGamePlayer game "${game._id}" players: "${JSON.stringify(players)}"`)
    }
    if (players.length === 0) {
      const message = `Not a player on game "${gameId}".`
      MutationUtil.logger.warn(`${logPrefix} getGamePlayer failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (players.length > 1) {
      const message = `Found more than 1 player with ID "${userId}" on game "${gameId}"`
      MutationUtil.logger.error(`${logPrefix} getGamePlayer failed: ${message}: "${JSON.stringify(players)}"`)
      return Error(`${message}.`) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    if (status) {
      const gameStatus = GameResolver.getStatus(game)
      if (gameStatus !== status) {
        const message = `Invalid game status "${gameStatus}": Can only ${label} for game with status "${status}".`
        MutationUtil.logger.warn(`${logPrefix} getGamePlayer failed: ${message}`)
        return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    }

    if (turn) {
      if (game.turn?.toString() !== userId.toString()) {
        const message = `Cannot ${label} when it is not your turn.`
        MutationUtil.logger.warn(`${logPrefix} getGamePlayer failed: ${message}`)
        return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
    }

    return {
      game,
      player: players[0],
    }
  }

  /**
   * Gets the ID of the player whose turn it is next in the current round.
   *
   * @param config The configuration of used to determine who the next eligible player is on the game.
   * @param config.game The game to determine the next player of.
   * @param config.currentPlayer The game player whose turn it currently is.
   * @param config.logPrefix The prefix to add to the beginning of log statements.
   * @returns The ID of the player whose turn is next, otherwise an Error.
   */
  static getNextPlayerIdForCurrentRound({
    game,
    logPrefix,
  }: {
    game: GameDbObject
    logPrefix: string
  }): ObjectId | Error {
    const currentRound = game.round
    const usersByOrder: GamePlayerDbObject[] = sortObjectArray({
      array: game.players,
      sortProperties: ['order'],
    })
    if (MutationUtil.logger.isTraceEnabled()) {
      MutationUtil.logger.trace(
        `${logPrefix} getNextPlayerIdForCurrentRound usersByOrder: "${JSON.stringify(usersByOrder)}"`
      )
    }
    const currentPlayer = game.players.find(
      (gamePlayer) => gamePlayer.user.toString() === game.turn?.toString()
    ) as GamePlayerDbObject
    let nextPlayerId: ObjectId | undefined = undefined
    const currentPlayerOrder = currentPlayer.order
    MutationUtil.logger.trace(`${logPrefix} getNextPlayerIdForCurrentRound currentPlayerOrder: "${currentPlayerOrder}"`)
    if (currentPlayerOrder === undefined || currentPlayerOrder === null) {
      const message = `Could not determine order of current player "${currentPlayer.user}": "${currentPlayerOrder}".`
      MutationUtil.logger.error(`${logPrefix} getNextPlayerIdForCurrentRound failed: ${message}`)
      return Error(message)
    }
    for (let i = 0; i < game.players.length && nextPlayerId === undefined; i++) {
      MutationUtil.logger.trace(`${logPrefix} getNextPlayerIdForCurrentRound i: "${i}"`)
      if (currentPlayer.order !== undefined) {
        const potentialNextPlayer = usersByOrder[(currentPlayerOrder + i + 1) % game.players.length]
        if (MutationUtil.logger.isTraceEnabled()) {
          MutationUtil.logger.trace(
            `${logPrefix} getNextPlayerIdForCurrentRound potentialNextPlayer: "${JSON.stringify(potentialNextPlayer)}"`
          )
        }
        if (potentialNextPlayer.rounds[currentRound - 1].passed) {
          MutationUtil.logger.trace(
            `${logPrefix} getNextPlayerIdForCurrentRound player "${potentialNextPlayer.user}" has already passed, ignoring for next player.`
          )
        } else {
          MutationUtil.logger.debug(
            `${logPrefix} getNextPlayerIdForCurrentRound player "${potentialNextPlayer.user}" has not yet passed, setting as next player.`
          )
          nextPlayerId = potentialNextPlayer.user
        }
      }
    }
    if (!nextPlayerId) {
      const message = `Could not determine next player for round "${currentRound}".`
      MutationUtil.logger.error(`${logPrefix} failed: ${message}`)
      return Error(message)
    }
    return nextPlayerId
  }

  /**
   * Gets the ID of the player whose turn it should be for the start of the next round.
   *
   * @param config The configuration of used to determine who should start the next round.
   * @param config.game The game to determine the started of the next round for.
   * @param config.logPrefix The prefix to add to the beginning of log statements.
   * @returns The ID of the player who should start the next round.
   */
  static getPlayerIdForNextRound({ game, logPrefix }: { game: GameDbObject; logPrefix: string }): ObjectId {
    MutationUtil.logger.trace(`${logPrefix} getPlayerIdForNextRound nextRound: "${game.round + 1}"`)
    const usersByOrder: GamePlayerDbObject[] = sortObjectArray({
      array: game.players,
      sortProperties: ['order'],
    })
    if (MutationUtil.logger.isTraceEnabled()) {
      MutationUtil.logger.trace(`${logPrefix} getPlayerIdForNextRound usersByOrder: "${JSON.stringify(usersByOrder)}"`)
    }

    // see if single winner of last round. If so, they start
    const roundWinners = game.players.filter(
      (gamePlayer) => gamePlayer.rounds[game.round - 1].result === RoundResult.Won
    )
    if (MutationUtil.logger.isTraceEnabled()) {
      MutationUtil.logger.trace(
        `${logPrefix} getPlayerIdForNextRound roundWinners: "${JSON.stringify(
          roundWinners.map((roundWinner) => roundWinner.user)
        )}"`
      )
    }
    if (roundWinners.length === 1) {
      const nextUser = roundWinners[0].user
      MutationUtil.logger.debug(
        `${logPrefix} getPlayerIdForNextRound single user "${nextUser}" won round "${
          game.round
        }", setting them as player for round "${game.round + 1}"`
      )
      return nextUser
    }

    const nextUser = usersByOrder[game.round % game.players.length].user
    MutationUtil.logger.debug(
      `${logPrefix} getPlayerIdForNextRound no single user won round "${
        game.round
      }", setting next player as "${nextUser}" for round "${game.round + 1}" based on game order`
    )
    return nextUser
  }

  /**
   * Whether or not the current round is over.
   *
   * @param config The configuration to determine if the round is over or not.
   * @param config.game The game to check if the current round is over.
   * @param config.logPrefix The prefix to add to the beginning of log statements.
   * @returns True if the current round is over, false otherwise.
   */
  static isRoundOver({ game, logPrefix }: { game: GameDbObject; logPrefix: string }): boolean {
    const currentRound = game.round
    MutationUtil.logger.trace(`${logPrefix} isRoundOver currentRound: "${currentRound}"`)
    for (const player of game.players) {
      const playerRound = player.rounds[currentRound - 1]
      MutationUtil.logger.trace(
        `${logPrefix} isRoundOver player "${player.user}" round "${currentRound}" passed: "${playerRound.passed}"`
      )
      if (!playerRound.passed) {
        MutationUtil.logger.debug(
          `${logPrefix} isRoundOver player "${player.user}" has not passed, so round "${currentRound}" is not over`
        )
        return false
      }
    }

    MutationUtil.logger.debug(`${logPrefix} isRoundOver all players have passed, so round "${currentRound}" is over`)
    return true
  }

  /**
   * Whether or not the game is over.
   *
   * @param config The configuration to determine if the game is over or not.
   * @param config.game The game to check if is finished.
   * @param config.logPrefix The prefix to add to the beginning of log statements.
   * @returns True if the game is over, false otherwise.
   */
  static isGameOver({ game, logPrefix }: { game: GameDbObject; logPrefix: string }): boolean {
    const currentRound = game.round
    MutationUtil.logger.trace(`${logPrefix} isGameOver game "${game._id}" currentRound: "${currentRound}"`)
    MutationUtil.logger.trace(`${logPrefix} isGameOver game "${game._id}" lives: "${game.config.lives}"`)
    const playersWithLivesLeft: ObjectId[] = []
    for (const player of game.players) {
      const playerLosses = player.rounds.filter(
        (round) => round.result === RoundResult.Lost || round.result === RoundResult.Drew
      ).length
      MutationUtil.logger.trace(
        `${logPrefix} isGameOver game "${game._id}" player "${player.user}" losses: "${playerLosses}"`
      )
      const livesLeft = game.config.lives - playerLosses
      MutationUtil.logger.trace(
        `${logPrefix} isGameOver game "${game._id}" player "${player.user}" livesLeft: "${livesLeft}"`
      )
      if (livesLeft > 0) {
        playersWithLivesLeft.push(player.user)
      }
    }
    if (MutationUtil.logger.isTraceEnabled()) {
      MutationUtil.logger.trace(
        `${logPrefix} isGameOver game "${game._id}" playersWithLivesLeft: "${JSON.stringify(playersWithLivesLeft)}"`
      )
    }
    const gameOver = playersWithLivesLeft.length <= 1
    MutationUtil.logger.debug(
      `${logPrefix} isGameOver game "${game._id}" ${
        gameOver ? 'is now complete' : 'is not yet over'
      } because there are "${playersWithLivesLeft.length}" player(s) with lives left.`
    )
    return gameOver
  }

  /**
   * Add a new round to each player on a game in a starting state.
   *
   * @param config The configuration used to initialize the new round.
   * @param config.players The game players to initialize the new round for.
   * @returns New game players who have a new round added for them.
   */
  static initializeNewRound({ players }: { players: GamePlayerDbObject[] }): GamePlayerDbObject[] {
    const startingCombatRow: PlayerCombatRowDbObject = {
      score: 0,
      units: [],
    }
    return players.map((gamePlayer) => {
      return {
        ...gamePlayer,
        rounds: [
          ...gamePlayer.rounds,
          {
            close: startingCombatRow,
            moves: [],
            passed: false,
            ranged: startingCombatRow,
            score: 0,
            siege: startingCombatRow,
          },
        ],
      }
    })
  }

  /**
   * Sets the player turn order for a game.
   *
   * @param config The configuration for setting game turn order.
   * @param config.userId The ObjectId of the User which is attempting to set the game turn order.
   * @param config.gameId The ObjectId of the Game to set the turn order for.
   * @param config.userIds The ObjectIds of the users to set the turn order for in the game, in order.
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
    // TODO: have game (and player?) be passed in so don't need to re-query
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
      const message = `Found more than 1 faction with key "${FactionKey.ScoiaTael}"`
      MutationUtil.logger.error(`${logPrefix} failed: ${message}: "${JSON.stringify(factions)}"`)
      return Error(`${message}.`) as any // eslint-disable-line @typescript-eslint/no-explicit-any
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
      MutationUtil.logger.debug(`${logPrefix} failed: ${message}`)
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
    } as OrderSetPayload)

    return resolvedGame
  }
}

export interface GamePlayerResponse {
  game: GameDbObject
  player: GamePlayerDbObject
}
