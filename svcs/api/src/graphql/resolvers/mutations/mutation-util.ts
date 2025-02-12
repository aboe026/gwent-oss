import { Logger } from 'log4js'
import { ObjectId } from 'mongodb'

import EventManager from '../../event-manager'
import {
  FactionDbObject,
  GameDbObject,
  GamePlayerDbObject,
  GameStatus,
  LeaderDbObject,
  PlayerCombatRowDbObject,
  RoundResult,
} from '@gwent/graphql-schema/database-typings'
import { FactionKey, Game } from '@gwent/graphql-schema/resolver-typings'
import FactionStore from '../../../database/stores/faction-store'
import GameResolver from '../types/game-resolver'
import GameStore from '../../../database/stores/game-store'
import { getDuplicateItems, randomizeOrder, sortObjectArray } from '@gwent/utils'
import LeaderStore from '../../../database/stores/leader-store'
import { OrderSetPayload } from '../subscription-resolver'
import PresentableError from '../../../util/presentable-error'
import { PubSubEvents } from '@gwent/constants'
import ResolverUtil from '../resolver-util'

/**
 * A class containing shared methods used by GraphQL mutations.
 */
export default class MutationUtil {
  private logger: Logger
  private logPrefix: string

  constructor({ logger, logPrefix = '' }: { logger: Logger; logPrefix?: string }) {
    this.logger = logger
    this.logPrefix = logPrefix
  }

  // TODO: move to store
  async getFactionByKey({ key, logPrefix }: { key: FactionKey; logPrefix?: string }): Promise<FactionDbObject> {
    const resolvedLogPrefix = logPrefix || this.logPrefix
    const factions = await FactionStore.get({
      keys: [key],
    })
    if (!factions || factions.length === 0) {
      const message = `Could not find faction with key "${key}".`
      this.logger.error(`${resolvedLogPrefix} failed: ${message}`)
      throw new PresentableError(message)
    } else if (factions.length > 1) {
      const message = `Found more than 1 faction with key "${FactionKey.ScoiaTael}"`
      this.logger.error(`${resolvedLogPrefix} failed: ${message}: "${JSON.stringify(factions)}"`)
      throw new PresentableError(message)
    } else if (factions[0].key !== key) {
      const message = `Faction key of "${factions[0].key}" does not match requestd key of "${key}".`
      this.logger.error(`${resolvedLogPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    return factions[0]
  }

  // TODO: move to store
  async getLeaderById(id: string): Promise<LeaderDbObject> {
    const leaders = await LeaderStore.get({
      ids: [id],
    })
    if (this.logger.isTraceEnabled()) {
      this.logger.trace(`${this.logPrefix} leaders: "${JSON.stringify(leaders)}"`)
    }
    if (!leaders || leaders.length === 0) {
      const message = `Leader with ID "${id}" does not exist.`
      this.logger.warn(`${this.logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    if (leaders.length > 1) {
      const message = `Found more than 1 Leader with ID "${id}"`
      this.logger.error(`${this.logPrefix} failed: ${message}: "${JSON.stringify(leaders)}"`)
      throw new PresentableError(message)
    }
    return leaders[0]
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
  getNextPlayerIdForCurrentRound({
    currentRound,
    players,
    currentTurn,
  }: {
    currentRound: number
    players: GamePlayerDbObject[]
    currentTurn: ObjectId | undefined
  }): ObjectId {
    const usersByOrder: GamePlayerDbObject[] = sortObjectArray({
      array: players,
      sortProperties: ['order'],
    })
    if (this.logger.isTraceEnabled()) {
      this.logger.trace(
        `${this.logPrefix} getNextPlayerIdForCurrentRound usersByOrder: "${JSON.stringify(usersByOrder)}"`
      )
    }
    const currentPlayer = players.find(
      (gamePlayer) => gamePlayer.user.toString() === currentTurn?.toString()
    ) as GamePlayerDbObject
    let nextPlayerId: ObjectId | undefined = undefined
    const currentPlayerOrder = currentPlayer.order
    this.logger.trace(`${this.logPrefix} getNextPlayerIdForCurrentRound currentPlayerOrder: "${currentPlayerOrder}"`)
    if (currentPlayerOrder === undefined || currentPlayerOrder === null) {
      const message = `Could not determine order of current player "${currentPlayer.user}": "${currentPlayerOrder}".`
      this.logger.error(`${this.logPrefix} getNextPlayerIdForCurrentRound failed: ${message}`)
      throw new PresentableError(message)
    }
    for (let i = 0; i < players.length && nextPlayerId === undefined; i++) {
      this.logger.trace(`${this.logPrefix} getNextPlayerIdForCurrentRound i: "${i}"`)
      if (currentPlayer.order !== undefined) {
        const potentialNextPlayer = usersByOrder[(currentPlayerOrder + i + 1) % players.length]
        if (this.logger.isTraceEnabled()) {
          this.logger.trace(
            `${this.logPrefix} getNextPlayerIdForCurrentRound potentialNextPlayer: "${JSON.stringify(
              potentialNextPlayer
            )}"`
          )
        }
        if (potentialNextPlayer.rounds[currentRound - 1].passed) {
          this.logger.trace(
            `${this.logPrefix} getNextPlayerIdForCurrentRound player "${potentialNextPlayer.user}" has already passed, ignoring for next player.`
          )
        } else {
          this.logger.debug(
            `${this.logPrefix} getNextPlayerIdForCurrentRound player "${potentialNextPlayer.user}" has not yet passed, setting as next player.`
          )
          nextPlayerId = potentialNextPlayer.user
        }
      }
    }
    if (!nextPlayerId) {
      const message = `Could not determine next player for round "${currentRound}".`
      this.logger.error(`${this.logPrefix} failed: ${message}`)
      throw new PresentableError(message)
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
  getPlayerIdForNextRound({ game }: { game: GameDbObject }): ObjectId {
    this.logger.trace(`${this.logPrefix} getPlayerIdForNextRound nextRound: "${game.round + 1}"`)
    const usersByOrder: GamePlayerDbObject[] = sortObjectArray({
      array: game.players,
      sortProperties: ['order'],
    })
    if (this.logger.isTraceEnabled()) {
      this.logger.trace(`${this.logPrefix} getPlayerIdForNextRound usersByOrder: "${JSON.stringify(usersByOrder)}"`)
    }

    // see if single winner of last round. If so, they start
    const roundWinners = game.players.filter(
      (gamePlayer) => gamePlayer.rounds[game.round - 1].result === RoundResult.Won
    )
    if (this.logger.isTraceEnabled()) {
      this.logger.trace(
        `${this.logPrefix} getPlayerIdForNextRound roundWinners: "${JSON.stringify(
          roundWinners.map((roundWinner) => roundWinner.user)
        )}"`
      )
    }
    if (roundWinners.length === 1) {
      const nextUser = roundWinners[0].user
      this.logger.debug(
        `${this.logPrefix} getPlayerIdForNextRound single user "${nextUser}" won round "${
          game.round
        }", setting them as player for round "${game.round + 1}"`
      )
      return nextUser
    }

    const nextUser = usersByOrder[game.round % game.players.length].user
    this.logger.debug(
      `${this.logPrefix} getPlayerIdForNextRound no single user won round "${
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
  isRoundOver({ game }: { game: GameDbObject }): boolean {
    const currentRound = game.round
    this.logger.trace(`${this.logPrefix} isRoundOver currentRound: "${currentRound}"`)
    for (const player of game.players) {
      const playerRound = player.rounds[currentRound - 1]
      this.logger.trace(
        `${this.logPrefix} isRoundOver player "${player.user}" round "${currentRound}" passed: "${playerRound.passed}"`
      )
      if (!playerRound.passed) {
        this.logger.debug(
          `${this.logPrefix} isRoundOver player "${player.user}" has not passed, so round "${currentRound}" is not over`
        )
        return false
      }
    }

    this.logger.debug(`${this.logPrefix} isRoundOver all players have passed, so round "${currentRound}" is over`)
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
  isGameOver({ game }: { game: GameDbObject }): boolean {
    const currentRound = game.round
    this.logger.trace(`${this.logPrefix} isGameOver currentRound: "${currentRound}"`)
    this.logger.trace(`${this.logPrefix} isGameOver lives: "${game.config.lives}"`)
    const playersWithLivesLeft: ObjectId[] = []
    for (const player of game.players) {
      const playerLosses = player.rounds.filter(
        (round) => round.result === RoundResult.Lost || round.result === RoundResult.Drew
      ).length
      this.logger.trace(`${this.logPrefix} isGameOver player "${player.user}" losses: "${playerLosses}"`)
      const livesLeft = game.config.lives - playerLosses
      this.logger.trace(`${this.logPrefix} isGameOver player "${player.user}" livesLeft: "${livesLeft}"`)
      if (livesLeft > 0) {
        playersWithLivesLeft.push(player.user)
      }
    }
    if (this.logger.isTraceEnabled()) {
      this.logger.trace(`${this.logPrefix} isGameOver playersWithLivesLeft: "${JSON.stringify(playersWithLivesLeft)}"`)
    }
    const gameOver = playersWithLivesLeft.length <= 1
    this.logger.debug(
      `${this.logPrefix} isGameOver game is ${gameOver ? 'now complete' : 'not yet over'} because there are "${
        playersWithLivesLeft.length
      }" player(s) with lives left.`
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
  initializeNewRound({ players }: { players: GamePlayerDbObject[] }): GamePlayerDbObject[] {
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
            close: {
              ...startingCombatRow,
            },
            moves: [],
            passed: false,
            ranged: {
              ...startingCombatRow,
            },
            score: 0,
            siege: {
              ...startingCombatRow,
            },
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
  async setGameTurnOrder({
    userId,
    gameId,
    userIds,
    allowImplicit,
    logPrefix,
  }: {
    userId: ObjectId
    gameId: string
    userIds?: string[] | null
    allowImplicit: boolean
    logPrefix?: string
  }): Promise<Game> {
    const resolvedLogPrefix = logPrefix || this.logPrefix

    const resolverUtil = new ResolverUtil({
      logger: this.logger,
      logPrefix,
    })

    const { game, player } = await resolverUtil.getGamePlayer({
      gameId,
      userId,
      label: 'set order',
      status: GameStatus.Ordering,
    })

    const scoiaTaelFaction = await this.getFactionByKey({
      key: FactionKey.ScoiaTael,
      logPrefix: resolvedLogPrefix,
    })

    const scoiaTaelId = scoiaTaelFaction._id.toString()
    const scoiaTaelPlayers = game.players.filter((player) => player.deck.from?.faction.toString() === scoiaTaelId)
    if (scoiaTaelPlayers.length > 1 && userIds && userIds.length > 0) {
      const message = `Cannot set explicit order as more than 1 player has chosen a deck of faction "${FactionKey.ScoiaTael}" for game "${gameId}".`
      this.logger.warn(`${resolvedLogPrefix} setGameTurnOrder failed: ${message}`)
      throw new PresentableError(message)
    }
    if (scoiaTaelPlayers.length === 0 && userIds && userIds.length > 0) {
      const message = `Cannot set explicit order as deck faction ID "${player.deck.from?.faction}" does not match "${FactionKey.ScoiaTael}" faction ID of "${scoiaTaelId}".`
      this.logger.warn(`${resolvedLogPrefix} setGameTurnOrder failed: ${message}`)
      throw new PresentableError(message)
    }
    if (scoiaTaelPlayers.length === 1 && (!userIds || userIds.length === 0) && !allowImplicit) {
      const message = `Cannot set order randomly as another player for game "${gameId}" has a deck faction of "${FactionKey.ScoiaTael}" which allows them to set game order.`
      this.logger.debug(`${resolvedLogPrefix} setGameTurnOrder failed: ${message}`)
      throw new PresentableError(message)
    }
    if (scoiaTaelPlayers.length === 1 && player.deck.from?.faction.toString() !== scoiaTaelId) {
      const message = `Cannot set order as another player for game "${gameId}" has a deck faction of "${FactionKey.ScoiaTael}" which allows them to set game order.`
      this.logger.warn(`${resolvedLogPrefix} setGameTurnOrder failed: ${message}`)
      throw new PresentableError(message)
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
        this.logger.warn(`${resolvedLogPrefix} setGameTurnOrder failed: ${message}`)
        throw new PresentableError(message)
      }
      if (userIds.length !== game.players.length) {
        const message = `Cannot set order as users count of "${userIds.length}" does not match player count of "${game.players.length}" for game "${gameId}".`
        this.logger.warn(`${resolvedLogPrefix} setGameTurnOrder failed: ${message}`)
        throw new PresentableError(message)
      }
      const duplicateUserIds = getDuplicateItems<string>(userIds)
      if (duplicateUserIds.length > 0) {
        const message = `Cannot set order for game "${gameId}" due to duplicate user ID(s) ${JSON.stringify(
          duplicateUserIds
        )} specified.`
        this.logger.warn(`${resolvedLogPrefix} setGameTurnOrder failed: ${message}`)
        throw new PresentableError(message)
      }
    }

    let userIdsForOrder: (string | ObjectId)[] = []
    if (userIds && userIds.length > 0) {
      if (this.logger.isTraceEnabled()) {
        this.logger.trace(`${resolvedLogPrefix} setGameTurnOrder userIds provided, not randomizing order`)
      }
      userIdsForOrder = userIds
    } else {
      this.logger.trace(`${resolvedLogPrefix} setGameTurnOrder no userIds provided, randomizing order`)
      userIdsForOrder = randomizeOrder(game.players.map((player) => player.user))
    }

    const updatedGame = await GameStore.setOrder({
      gameId,
      userIds: userIdsForOrder,
    })
    if (this.logger.isTraceEnabled()) {
      this.logger.trace(`${resolvedLogPrefix} setGameTurnOrder updatedGame: "${JSON.stringify(updatedGame)}"`)
    }
    if (!updatedGame) {
      const message = `Could not set order on game "${gameId}" in probable race condition collision.`
      this.logger.error(`${resolvedLogPrefix} setGameTurnOrder failed: ${message}`)
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
