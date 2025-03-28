import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import addMoveToCurrentPlayer from '../util/add-move-to-current-player'
import clearBattlefieldUnits from './clear-battlefield-units'
import { GameDbObject, MovePassDbObject } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../../../database/stores/game-store'
import GetNextPlayerIdForCurrentRound from '../util/get-next-player-id-for-current-round'
import GetPlayerIdForNextRound from './get-player-id-for-next-round'
import initializeNewRound from '../util/initialize-new-round'
import IsGameOver from './is-game-over'
import IsRoundOver from './is-round-over'
import { MoveType } from '@gwent/graphql-schema'
import passCurrentPlayer from './pass-current-player'
import PresentableError from '../../../../util/presentable-error'
import SetGameVictors from './set-game-victors'
import SetRoundResults from './set-round-results'
import { ValidatedPlayPass } from './play-pass-validation'

/**
 * A class for executing the playPass GraphQL Mutation.
 */
export default class PlayPassImplementation {
  private static logger = getLogger('PlayPassImplementation')

  /**
   * Pass the rest of the round for a user. Once a round is passed, the user can no longer play units the rest of the round.
   *
   * @param args The arguments for passing the round.
   * @param context The session containing the user passing.
   * @param info The information about the GraphQL request.
   * @returns The Game with the round passed for the user.
   * @throws PresentableError if problem playing pass.
   */
  static async playPassImplementation({ game, logPrefix }: ValidatedPlayPass): Promise<ImplementedPlayPass> {
    passCurrentPlayer(game)

    addMoveToCurrentPlayer({
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
      SetRoundResults.setRoundResults({
        game,
        logPrefix,
      })
      clearBattlefieldUnits(game)

      const gameOver = IsGameOver.isGameOver({
        game,
        logPrefix,
      })
      if (gameOver) {
        SetGameVictors.setGameVictors({
          game,
          logPrefix,
        })
      } else {
        nextPlayerId = GetPlayerIdForNextRound.getPlayerIdForNextRound({
          game,
          logPrefix,
        })

        initializeNewRound({
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
      PlayPassImplementation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    return {
      game: updatedGame,
      roundOver,
    }
  }
}

interface ImplementedPlayPass {
  game: GameDbObject
  roundOver: boolean
}
