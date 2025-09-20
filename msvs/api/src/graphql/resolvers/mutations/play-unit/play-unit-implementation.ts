import { getLogger } from 'log4js'

import CalculateGameEffectiveStrengths from './calculate-game-effective-strengths'
import { GameDbObject, GameDeckDbObject } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../../../database/stores/game-store'
import getRoundUnits from './get-round-units'
import getUnitEffects from './get-unit-effects'
import modifyBattlefieldWithNewUnit from './modify-battlefield-with-new-unit'
import PresentableError from '../../../../util/presentable-error'
import setGameScores from './set-game-scores'
import SetNextTurnForCurrentRound from '../util/set-next-turn-for-current-round'
import UpdateHistory from './update-history'
import { ValidatedPlayUnit } from './play-unit-validation'

/**
 * A class for implementing the playUnit GraphQL Mutation.
 */
export default class PlayUnitImplementation {
  private static logger = getLogger('PlayUnitImplementation')

  /**
   * Play a unit for a user on a game, saving the impacts that has to the game in the database.
   *
   * @param config The configuration used to play the unit.
   * @param config.combat The combat row the unit should be deployed to.
   * @param config.deckUnit The DeckUnit being played.
   * @param config.game The game the unit is being played for.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @param config.unit The Unit being played.
   * @returns The Game and GameDeck with the unit played for the user.
   * @throws PresentableError if known problem playing unit.
   */
  static async playUnitImplementation({
    combat,
    deckUnit,
    game,
    logPrefix,
    unit,
  }: ValidatedPlayUnit): Promise<ImplementedPlayUnit> {
    const playerId = game.turn?.toString() // save current player before any modifications to game turn
    if (!playerId) {
      const message = `No current player for turn on game "${game._id}".`
      PlayUnitImplementation.logger.error(`${logPrefix} failed: ${message}`)
      throw Error(message)
    }

    const roundUnits = await getRoundUnits({
      game,
      unitBeingPlayed: unit,
    })
    const unitEffects = await getUnitEffects({
      units: roundUnits,
    })

    const { mardroemes, transformedUnits, transformedGameUnits, musters, musteredUnits, musteredOrigins, scorches } =
      await modifyBattlefieldWithNewUnit({
        battlefieldUnits: roundUnits,
        combat,
        effects: unitEffects,
        game,
        logPrefix,
        newDeckUnit: deckUnit,
      })

    const musterEffects = await getUnitEffects({
      units: musteredUnits,
      effects: unitEffects,
    })
    const transformedEffects = await getUnitEffects({
      units: transformedUnits,
      effects: unitEffects,
    })

    const { bonds, morales } = CalculateGameEffectiveStrengths.calculateEffectiveStrengths({
      game,
      units: [unit, ...roundUnits, ...musteredUnits, ...transformedUnits],
      effects: [...unitEffects, ...musterEffects, ...transformedEffects],
      logPrefix,
      newDeckUnit: deckUnit,
      musteredUnitIds: musteredUnits.map((unit) => unit._id.toString()),
    })

    setGameScores(game)

    UpdateHistory.newUnitDeployed({
      combat,
      deckUnit,
      game,
      musters,
      musteredOrigins,
      playerId,
      logPrefix,
      scorches,
      bonds,
      morales,
      mardroemes,
      transformedGameUnits,
    })

    SetNextTurnForCurrentRound.setNextTurnForCurrentRound({
      game,
      logPrefix,
    })

    const updatedGame = await GameStore.save(game)

    if (PlayUnitImplementation.logger.isTraceEnabled()) {
      PlayUnitImplementation.logger.trace(`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`)
    }

    if (!updatedGame) {
      const message = 'Could not play unit in probable race condition collision.'
      PlayUnitImplementation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    const player = updatedGame.players.find((player) => player.user.toString() === playerId)
    if (!player) {
      const message = `Could not find player "${game.turn}" in updated game.`
      PlayUnitImplementation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    return {
      game: updatedGame,
      gameDeck: player.deck,
    }
  }
}

interface ImplementedPlayUnit {
  game: GameDbObject
  gameDeck: GameDeckDbObject
}
