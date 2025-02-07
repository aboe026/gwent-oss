import { ObjectId } from 'mongodb'

import { Game, MutationPlayPassArgs } from '@gwent/graphql-schema/resolver-typings'
import { Context } from '@gwent/graphql-schema/context'
import EventManager from '../../event-manager'
import GameDeckResolver from '../types/game-deck-resolver'
import { GameStatus, RoundResult } from '@gwent/graphql-schema/database-typings'
import GameResolver from '../types/game-resolver'
import GameStore from '../../../database/stores/game-store'
import { getLogger } from 'log4js'
import { GraphQLResolveInfo } from 'graphql'
import { MoveType } from '@gwent/graphql-schema'
import MutationUtil from './mutation-util'
import { PassPlayedPayload, RoundEndedForDeckPayload } from '../subscription-resolver'
import PresentableError from '../../../util/presentable-error'
import { PubSubEvents } from '@gwent/constants'
import ResolverUtil from '../resolver-util'

/**
 * A class for executing the playPass GraphQL Mutation.
 */
export default class PlayPassMutation {
  private static logger = getLogger('PlayPassMutation')

  /**
   * Pass the rest of the round for a user. Once a round is passed, the user can no longer play units the rest of the round.
   *
   * @param args The arguments for passing the round.
   * @param context The session containing the user passing.
   * @param info The information about the GraphQL request.
   * @returns The Game with the round passed for the user.
   */
  static async playPass(args: MutationPlayPassArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const resolverUtil = new ResolverUtil({
      logger: PlayPassMutation.logger,
    })
    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'playPass mutation',
    })

    let logPrefix = `playPass by "${userId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.printArgsAndInfo({
      args,
      info,
    })

    const gameId = args.game
    logPrefix += ` on game "${gameId}"`
    resolverUtil.setLogPrefix(logPrefix)

    const { game, player } = await resolverUtil.getGamePlayer({
      gameId,
      userId,
      status: GameStatus.Playing,
      turn: true,
      label: 'pass round',
    })

    const playerRound = player.rounds[game.round - 1]
    if (!playerRound) {
      const message = `Could not get round "${game.round}" for player "${player.user}"`
      PlayPassMutation.logger.error(`${logPrefix} failed: ${message}: "${JSON.stringify(player.rounds)}"`)
      throw new PresentableError(message)
    }
    if (playerRound.passed) {
      const message = `Already passed round "${game.round}"`
      PlayPassMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    const mutationUtil = new MutationUtil({
      logger: PlayPassMutation.logger,
      logPrefix,
    })

    // pass
    game.players = game.players.map((gamePlayer) => {
      if (gamePlayer.user.toString() === player.user.toString()) {
        return {
          ...gamePlayer,
          rounds: gamePlayer.rounds.map((round, index) => {
            if (index === game.round - 1) {
              round.moves = [
                ...round.moves,
                {
                  created: new Date(),
                  type: MoveType.Pass,
                },
              ]
              round.passed = true
            }
            return round
          }),
        }
      }
      return gamePlayer
    })

    let nextPlayerId: ObjectId | undefined = undefined
    const roundOver = mutationUtil.isRoundOver({
      game,
    })
    if (roundOver) {
      // set round winner(s)
      let highestScore = 0
      let usersWithHighestScore = 0
      for (const gamePlayer of game.players) {
        const playerRound = gamePlayer.rounds[game.round - 1]
        const roundScore = playerRound.score
        PlayPassMutation.logger.trace(
          `${logPrefix} player "${gamePlayer.user}" round "${game.round}" score: "${roundScore}"`
        )
        if (roundScore > highestScore) {
          PlayPassMutation.logger.trace(
            `${logPrefix} player "${gamePlayer.user}" round "${game.round}" score "${roundScore}" is greater than previous highestScore of "${highestScore}", setting it to theirs`
          )
          highestScore = roundScore
          usersWithHighestScore = 1
        } else if (roundScore === highestScore) {
          usersWithHighestScore++
        }
      }
      PlayPassMutation.logger.trace(`${logPrefix} round "${game.round}" highestScore: "${highestScore}"`)
      PlayPassMutation.logger.trace(
        `${logPrefix} round "${game.round}" usersWithHighestScore: "${usersWithHighestScore}"`
      )
      const winners: ObjectId[] = []
      game.players = game.players.map((gamePlayer) => {
        return {
          ...gamePlayer,
          rounds: gamePlayer.rounds.map((round, index) => {
            let result = round.result
            if (index === game.round - 1) {
              if (round.score === highestScore) {
                if (usersWithHighestScore > 1) {
                  result = RoundResult.Drew
                } else {
                  result = RoundResult.Won
                }
              } else {
                result = RoundResult.Lost
              }
              PlayPassMutation.logger.trace(
                `${logPrefix} player "${gamePlayer.user}" round "${game.round}" result: "${result}"`
              )
              if (result === RoundResult.Won || result === RoundResult.Drew) {
                winners.push(gamePlayer.user)
              }
            }
            return {
              ...round,
              result,
            }
          }),
        }
      })
      PlayPassMutation.logger.debug(
        `${logPrefix} ends round "${game.round}" in ${winners.length === 1 ? 'win' : 'draw'} for "${JSON.stringify(
          winners
        )}"`
      )

      // add remaining battlefield cards to discards
      game.players = game.players.map((gamePlayer) => {
        const playerRound = gamePlayer.rounds[game.round - 1]
        return {
          ...gamePlayer,
          deck: {
            ...gamePlayer.deck,
            discard: [
              ...gamePlayer.deck.discard,
              ...playerRound.close.units,
              ...playerRound.ranged.units,
              ...playerRound.siege.units,
            ],
          },
        }
      })

      const gameOver = mutationUtil.isGameOver({
        game,
      })
      if (gameOver) {
        // set game victor(s)
        let highestWins = 0
        for (const gamePlayer of game.players) {
          const playerWins = gamePlayer.rounds.filter((round) => round.result === RoundResult.Won).length
          PlayPassMutation.logger.trace(`${logPrefix} player "${gamePlayer.user}" playerWins: "${playerWins}"`)
          if (playerWins > highestWins) {
            PlayPassMutation.logger.trace(
              `${logPrefix} player "${gamePlayer.user}" wins "${playerWins}" is greater than previous highestWins of "${highestWins}", setting high wins to theirs`
            )
            highestWins = playerWins
          }
        }
        PlayPassMutation.logger.trace(`${logPrefix} highestWins: "${highestWins}"`)
        const victorIds: ObjectId[] = []
        for (const gamePlayer of game.players) {
          const playerWins = gamePlayer.rounds.filter((round) => round.result === RoundResult.Won).length
          if (playerWins === highestWins) {
            victorIds.push(gamePlayer.user)
          }
        }
        PlayPassMutation.logger.debug(`${logPrefix} ends game in victory for "${JSON.stringify(victorIds)}"`)
        game.victors = victorIds
      } else {
        // set next player
        nextPlayerId = mutationUtil.getPlayerIdForNextRound({
          game,
        })

        // initialize next round
        game.players = mutationUtil.initializeNewRound({
          players: game.players,
        })

        game.round = game.round + 1
      }
    } else {
      nextPlayerId = mutationUtil.getNextPlayerIdForCurrentRound({
        game,
      })
    }

    game.turn = nextPlayerId ? nextPlayerId : game.turn // TODO: make turn null when game over after change game status to be a database property

    const updatedGame = await GameStore.makeMove({
      game,
      userId,
    })

    if (!updatedGame) {
      const message = `Could not play pass for game "${gameId}" in probable race condition collision.`
      PlayPassMutation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    const resolvedGame = await GameResolver.fromObject({
      game: updatedGame,
    })

    EventManager.pubsub.publish(PubSubEvents.PassPlayed, {
      passPlayed: resolvedGame,
    } as PassPlayedPayload)

    if (roundOver) {
      for (const gamePlayer of updatedGame.players) {
        EventManager.pubsub.publish(PubSubEvents.RoundEndedForDeck, {
          roundEndedForDeck: {
            deck: await GameDeckResolver.fromObject({
              gameDeck: gamePlayer.deck,
            }),
            game: resolvedGame,
          },
        } as RoundEndedForDeckPayload)
      }
    }

    return resolvedGame
  }
}
