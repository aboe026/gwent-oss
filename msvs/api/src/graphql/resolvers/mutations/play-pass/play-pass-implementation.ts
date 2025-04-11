import { getLogger } from 'log4js'

import addMoveToCurrentPlayer from '../util/add-move-to-current-player'
import clearBattlefieldUnits from './clear-battlefield-units'
import { GameDbObject, MovePassDbObject } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../../../database/stores/game-store'
import initializeNewRound from '../util/initialize-new-round'
import IsGameOver from './is-game-over'
import IsRoundOver from './is-round-over'
import { MoveType } from '@gwent/graphql-schema'
import passCurrentPlayer from './pass-current-player'
import PresentableError from '../../../../util/presentable-error'
import SetGameVictors from './set-game-victors'
import SetNextTurnForCurrentRound from '../util/set-next-turn-for-current-round'
import SetRoundResults from './set-round-results'
import SetTurnForNextRound from './set-turn-for-next-round'
import { ValidatedPlayPass } from './play-pass-validation'

/**
 * A class for implementing the playPass GraphQL Mutation.
 */
export default class PlayPassImplementation {
  private static logger = getLogger('PlayPassImplementation')

  /**
   * Pass the rest of the round for a user, saving the impact that has on the game to the database.
   *
   * @param config The configuration used to pass on the game.
   * @param config.game The game to pass the rest of the round for the current user.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @returns The Game with the round passed for the user as well as if the round is over or not.
   * @throws PresentableError if known problem playing pass.
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
        SetTurnForNextRound.setTurnForNextRound({
          game,
          logPrefix,
        })

        initializeNewRound({
          game,
        })
      }
    } else {
      SetNextTurnForCurrentRound.setNextTurnForCurrentRound({
        game,
        logPrefix,
      })
    }

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
