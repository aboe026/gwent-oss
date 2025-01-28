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
import { MoveType, RequestedFields } from '@gwent/graphql-schema'
import MutationUtil from './mutation-util'
import { NOT_AUTHENTICATED_MESSAGE, PubSubEvents } from '@gwent/constants'
import { PassPlayedPayload, RoundEndedForDeckPayload } from '../subscription-resolver'

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
    const userId = context.session?.user?._id
    if (!userId) {
      PlayPassMutation.logger.error(`No user on context for playPass mutation: "${JSON.stringify(context.session)}".`)
      return Error(NOT_AUTHENTICATED_MESSAGE) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    let logPrefix = `playPass by "${userId}"`
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
    logPrefix += ` on game "${gameId}"`

    const response = await MutationUtil.getGamePlayer({
      gameId,
      logPrefix,
      userId,
      status: GameStatus.Playing,
      turn: true,
      label: 'pass round',
    })

    if (response instanceof Error) {
      return response as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

    const { game, player } = response

    const playerRound = player.rounds[game.round - 1]
    if (!playerRound) {
      const message = `Could not get round "${game.round}" for player "${player.user}"`
      PlayPassMutation.logger.error(`${logPrefix} failed: ${message}: "${JSON.stringify(player.rounds)}"`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (playerRound.passed) {
      const message = `Already passed round "${game.round}"`
      PlayPassMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }

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

      const gameOver = MutationUtil.isGameOver({
        game,
        logPrefix,
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
      const potentialNextPlayerId = MutationUtil.getNextPlayerIdForCurrentRound({
        game,
        logPrefix,
      })
      if (potentialNextPlayerId instanceof Error) {
        return potentialNextPlayerId as any // eslint-disable-line @typescript-eslint/no-explicit-any
      }
      nextPlayerId = potentialNextPlayerId
    }

    const updatedGame = await GameStore.makeMove({
      game: {
        ...game,
        turn: nextPlayerId ? nextPlayerId : game.turn, // for some reason had to set turn here, if try to just do "game.turn = nextPlayerId" before this unit tests fail due to strange(impossible?) race condition on game turn user
        // TODO: revert back to "normal" (see play-unit-mutation) once errors are thrown instead of returned
      },
      userId,
    })

    if (!updatedGame) {
      const message = `Could not play pass for game "${gameId}" in probable race condition collision.`
      PlayPassMutation.logger.error(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
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
