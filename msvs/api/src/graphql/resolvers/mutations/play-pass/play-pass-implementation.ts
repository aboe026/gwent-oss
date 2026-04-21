import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import CalculateGameEffectiveStrengths from '../util/calculate-game-effective-strengths'
import clearBattlefieldUnits from './clear-battlefield-units'
import EffectAvenger from '../play-unit/effect-avenger'
import { GameDbObject, GameUnitOrigin, MovePassDbObject, MoveReasonType } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../../../database/stores/game-store'
import { GameUnitType, MoveType } from '@gwent/graphql-schema'
import getRoundUnits from '../play-unit/get-round-units'
import getUnitEffects from '../play-unit/get-unit-effects'
import initializeNewRound from '../util/initialize-new-round'
import IsGameOver from './is-game-over'
import IsRoundOver from './is-round-over'
import passCurrentPlayer from './pass-current-player'
import PresentableError from '../../../../util/presentable-error'
import setGameScores from '../util/set-game-scores'
import SetGameVictors from './set-game-victors'
import SetNextTurnForCurrentRound from '../util/set-next-turn-for-current-round'
import SetRoundResults from './set-round-results'
import SetTurnForNextRound from './set-turn-for-next-round'
import UpdateHistory from '../util/update-history'
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
   * @throws {PresentableError} if known problem playing pass.
   */
  static async playPassImplementation({ game, logPrefix }: ValidatedPlayPass): Promise<ImplementedPlayPass> {
    const passingDate = new Date()
    const passingPlayer = game.turn
    passCurrentPlayer(game)

    UpdateHistory.addMoveToPlayer({
      game,
      move: {
        created: passingDate,
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

        await PlayPassImplementation.summonAvengers({
          game,
          logPrefix,
          passingDate,
          passingPlayer,
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

  private static async summonAvengers({
    game,
    logPrefix,
    passingDate,
    passingPlayer,
  }: {
    game: GameDbObject
    logPrefix: string
    passingDate: Date
    passingPlayer?: ObjectId
  }) {
    const previousRoundUnits = await getRoundUnits({
      game,
      round: game.round - 2,
    })
    const unitEffects = await getUnitEffects({
      units: previousRoundUnits,
    })
    const removedGameUnits = game.players
      .map((player) => {
        const round = player.rounds[game.round - 2]
        return [...round.close.units, ...round.ranged.units, ...round.siege.units].map((unit) => {
          return {
            unit: {
              ...unit,
              type: GameUnitType.Field,
            },
            user: player.user,
          }
        })
      })
      .flat()

    const { avengedUnits, impacts: avengers } = await EffectAvenger.avengeRemovedUnits({
      battlefieldUnits: previousRoundUnits,
      effects: unitEffects,
      game,
      logPrefix,
      removedGameUnits,
    })
    for (const avengerUnitId of Object.keys(avengers)) {
      const avengees = avengers[avengerUnitId]
      for (const avengee of avengees) {
        UpdateHistory.newUnitIndirect({
          created: passingDate,
          game,
          logPrefix,
          avengers: {
            [avengerUnitId]: [avengee],
          },
          origin: GameUnitOrigin.Nondeck,
          playerId: avengee.user.toString(),
          turnUserId: passingPlayer,
          reason: {
            type: MoveReasonType.Summon,
            unit: avengee.unit,
          },
          unitId: avengerUnitId,
          targetId: avengee.user,
        })
      }
    }

    CalculateGameEffectiveStrengths.calculateEffectiveStrengths({
      game,
      units: [...previousRoundUnits, ...avengedUnits],
      effects: unitEffects,
      logPrefix,
    })

    setGameScores(game)
  }
}

interface ImplementedPlayPass {
  game: GameDbObject
  roundOver: boolean
}
