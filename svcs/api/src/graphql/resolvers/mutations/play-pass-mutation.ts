import { ObjectId } from 'mongodb'

import { Game, MutationPlayPassArgs } from '@gwent/graphql-schema/resolver-typings'
import { Context } from '@gwent/graphql-schema/context'
import EventManager from '../../event-manager'
import GameDeckResolver from '../types/game-deck-resolver'
import GameResolver from '../types/game-resolver'
import { GameStatus, MovePassDbObject, RoundResult } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../../database/stores/game-store'
import { getLogger } from 'log4js'
import { GraphQLResolveInfo } from 'graphql'
import { MoveType } from '@gwent/graphql-schema'
import { PassPlayedPayload, RoundEndedForDeckPayload } from '../subscription-resolver'
import PresentableError from '../../../util/presentable-error'
import { PubSubEvents } from '@gwent/constants'
import ResolverUtil from '../resolver-util'
import PassCurrentPlayer from './util/pass-current-player'
import GetPlayerIdForNextRound from './util/get-player-id-for-next-round'
import IsRoundOver from './util/is-round-over'
import IsGameOver from './util/is-game-over'
import GetNextPlayerIdForCurrentRound from './util/get-next-player-id-for-current-round'
import InitializeNewRound from './util/initialize-new-round'
import AddMoveToPlayer from './util/add-move-to-player'

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
   * @throws PresentableError if problem playing pass.
   */
  static async playPass(args: MutationPlayPassArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const resolverUtil = new ResolverUtil({
      logger: PlayPassMutation.logger,
    })
    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'playPass mutation',
    })
    const gameId = args.game

    const logPrefix = `playPass by "${userId}" on game "${gameId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.logRequestInfo({
      args,
      info,
    })

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

    // pass
    game.players = PassCurrentPlayer.markPassed({
      game,
    })

    game.players = AddMoveToPlayer.addMoveToPlayer({
      game,
      move: {
        created: new Date(),
        type: MoveType.Pass,
      } as MovePassDbObject,
    })

    let nextPlayerId: ObjectId | undefined = undefined
    const roundOver = IsRoundOver.isRoundOver({
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

      const gameOver = IsGameOver.isGameOver({
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
        game.status = GameStatus.Done
      } else {
        // set next player
        nextPlayerId = GetPlayerIdForNextRound.getPlayerIdForNextRound({
          game,
          logPrefix,
        })

        // initialize next round
        game.players = InitializeNewRound.initializeNewRound({
          players: game.players,
        })

        game.round = game.round + 1
      }
    } else {
      nextPlayerId = GetNextPlayerIdForCurrentRound.getNextPlayerIdForCurrentRound({
        currentRound: game.round,
        currentTurn: game.turn,
        players: game.players,
        logPrefix,
      })
    }

    game.turn = nextPlayerId

    const updatedGame = await GameStore.save(game)

    if (!updatedGame) {
      const message = 'Could not play pass in probable race condition collision.'
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
