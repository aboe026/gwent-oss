import { ObjectId } from 'mongodb'

import AddMoveToPlayer from './util/add-move-to-player'
import ClearBattlefieldCards from './util/clear-battlefield-cards'
import { Context } from '@gwent/graphql-schema/context'
import EventManager from '../../event-manager'
import { Game, MutationPlayPassArgs } from '@gwent/graphql-schema/resolver-typings'
import GameDeckResolver from '../types/game-deck-resolver'
import GameResolver from '../types/game-resolver'
import { GameStatus, MovePassDbObject } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../../database/stores/game-store'
import { getLogger } from 'log4js'
import GetNextPlayerIdForCurrentRound from './util/get-next-player-id-for-current-round'
import GetPlayerIdForNextRound from './util/get-player-id-for-next-round'
import GetVictorIds from './util/get-victor-ids'
import { GraphQLResolveInfo } from 'graphql'
import InitializeNewRound from './util/initialize-new-round'
import IsGameOver from './util/is-game-over'
import IsRoundOver from './util/is-round-over'
import { MoveType } from '@gwent/graphql-schema'
import PassCurrentPlayer from './util/pass-current-player'
import { PassPlayedPayload, RoundEndedForDeckPayload } from '../subscription-resolver'
import PresentableError from '../../../util/presentable-error'
import { PubSubEvents } from '@gwent/constants'
import ResolverUtil from '../resolver-util'
import SetRoundWinners from './util/set-round-winners'

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

    PassCurrentPlayer.passCurrentPlayer({
      game,
    })

    AddMoveToPlayer.addMoveToPlayer({
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
      game.players = SetRoundWinners.setRoundWinners({
        game,
        logPrefix,
      })
      ClearBattlefieldCards.clearBattlefieldCards({
        game,
      })

      const gameOver = IsGameOver.isGameOver({
        game,
        logPrefix,
      })
      if (gameOver) {
        game.victors = GetVictorIds.getVictorIds({
          game,
          logPrefix,
        })
        game.status = GameStatus.Done
      } else {
        nextPlayerId = GetPlayerIdForNextRound.getPlayerIdForNextRound({
          game,
          logPrefix,
        })

        InitializeNewRound.initializeNewRound({
          game,
        })
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
