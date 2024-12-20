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
import MutationUtil from './mutation-util'
import { NOT_AUTHENTICATED_MESSAGE, PubSubEvents } from '@gwent/constants'
import { PassPlayedPayload, RoundEndedForDeckPayload } from '../subscription-resolver'
import { RequestedFields } from '@gwent/graphql-schema'

/**
 * A class for executing the playPass GraphQL Mutation.
 */
export default class PlayPassMutation {
  private static logger = getLogger('PlayPassMutation')

  static async playPass(args: MutationPlayPassArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const userId = context.session?.user?._id
    if (!userId) {
      PlayPassMutation.logger.error(`No user on context for playPass mutation: "${JSON.stringify(context.session)}".`)
      return Error(NOT_AUTHENTICATED_MESSAGE) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const logPrefix = `playPass by "${userId}"`
    if (PlayPassMutation.logger.isTraceEnabled()) {
      PlayPassMutation.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
      PlayPassMutation.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      PlayPassMutation.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }

    const gameId = args.game

    const response = await MutationUtil.getGamePlayer({
      gameId,
      logPrefix,
      userId,
    })

    if (response instanceof Error) {
      return response as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const { game, player } = response

    const gameStatus = GameResolver.getStatus(game)
    if (gameStatus !== GameStatus.Playing) {
      const message = `Invalid game status "${gameStatus}": Can only pass for game with status "${GameStatus.Playing}".`
      PlayPassMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    // TODO: ensure it is users turn
    // TODO: ensure user has not already passed

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
                  type: 'PASS', // TODO: make enum
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
    const roundOver = MutationUtil.isRoundOver({
      game,
      logPrefix,
    })
    if (roundOver) {
      // set round winner(s)
      let highestScore = 0
      let usersWithHighestScore = 0
      for (const gamePlayer of game.players) {
        const playerRound = gamePlayer.rounds[game.round - 1]
        const roundScore = playerRound.score
        PlayPassMutation.logger.trace(
          `${logPrefix} game "${game._id}" player "${gamePlayer.user}" round "${game.round}" score: "${roundScore}"`
        )
        if (roundScore > highestScore) {
          PlayPassMutation.logger.trace(
            `${logPrefix} game "${game._id}" player "${gamePlayer.user}" score "${roundScore}" is greater than previous highestScore of "${highestScore}", setting high score to theirs for round "${game.round}"`
          )
          highestScore = roundScore
          usersWithHighestScore = 1
        } else if (roundScore === highestScore) {
          usersWithHighestScore++
        }
      }
      PlayPassMutation.logger.trace(
        `${logPrefix} game "${game._id}" round "${game.round}" highestScore: "${highestScore}"`
      )
      PlayPassMutation.logger.trace(
        `${logPrefix} game "${game._id}" round "${game.round}" usersWithHighestScore: "${usersWithHighestScore}"`
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
                `${logPrefix} game "${game._id}" player "${gamePlayer.user}" round "${game.round}" result: "${result}"`
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
        `${logPrefix} Player(s) "${JSON.stringify(winners)}" ${winners.length === 1 ? 'won' : 'drew'} round "${
          game.round
        }" of game "${game._id}"`
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

      const gameOver = MutationUtil.isGameOver({
        game,
        logPrefix,
      })
      if (gameOver) {
        // set game victor(s)
        let highestWins = 0
        for (const gamePlayer of game.players) {
          const playerWins = gamePlayer.rounds.filter((round) => round.result === RoundResult.Won).length
          PlayPassMutation.logger.trace(
            `${logPrefix} game "${game._id}" player "${gamePlayer.user}" playerWins: "${playerWins}"`
          )
          if (playerWins > highestWins) {
            PlayPassMutation.logger.trace(
              `${logPrefix} game "${game._id}" player "${gamePlayer.user}" wins "${playerWins}" is greater than previous highestWins of "${playerWins}", setting high wins to theirs`
            )
            highestWins = playerWins
          }
        }
        PlayPassMutation.logger.trace(`${logPrefix} game "${game._id}" highestWins: "${highestWins}"`)
        const victorIds: ObjectId[] = []
        for (const gamePlayer of game.players) {
          const playerWins = gamePlayer.rounds.filter((round) => round.result === RoundResult.Won).length
          if (playerWins === highestWins) {
            victorIds.push(gamePlayer.user)
          }
        }
        PlayPassMutation.logger.debug(
          `${logPrefix} Players "${JSON.stringify(victorIds)}" are victors of game "${game._id}"`
        )
        game.victors = victorIds
      } else {
        // set next player
        nextPlayerId = MutationUtil.getPlayerIdForNextRound({
          game,
          logPrefix,
        })

        // initialize next round
        game.players = MutationUtil.initializeNewRound({
          players: game.players,
        })

        game.round = game.round + 1
      }
    } else {
      nextPlayerId = MutationUtil.getNextPlayerIdForCurrentRound({
        game,
        currentPlayer: player,
        logPrefix,
      })
    }

    const updatedGame = await GameStore.makeMove({
      nextTurn: nextPlayerId,
      updatedGame: game,
      userId,
    })

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
