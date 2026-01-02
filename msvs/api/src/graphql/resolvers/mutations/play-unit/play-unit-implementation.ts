import { getLogger } from 'log4js'

import BattlefieldUpdates from './modify-battlefield-with-new-unit'
import CalculateGameEffectiveStrengths from './calculate-game-effective-strengths'
import { DeckUnitDbObject, GameDbObject, GameDeckDbObject } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../../../database/stores/game-store'
import getRoundUnits from './get-round-units'
import getUnitEffects from './get-unit-effects'
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
   * @param config.targetId The Unit ID that a potential Decoy card should target.
   * @param config.effects The Effects for the new DeckUnit that have been pre-fetched. If not provided, will be retrieved.
   * @param config.roundUnits The Units for all players in the game round that have been pre-fetched. If not provided, will be retrieved.
   * @returns The Game and GameDeck with the unit played for the user.
   * @throws {PresentableError} if known problem playing unit.
   * @throws {Error} if unforseen problem adding the user.
   */
  static async playUnitImplementation({
    combat,
    deckUnit,
    game,
    logPrefix,
    unit,
    targetId,
    effects,
    roundUnits,
  }: ValidatedPlayUnit): Promise<ImplementedPlayUnit> {
    const playerId = game.turn?.toString() // save current player before any modifications to game turn
    if (!playerId) {
      const message = `No current player for turn on game "${game._id}".`
      PlayUnitImplementation.logger.error(`${logPrefix} failed: ${message}`)
      throw Error(message)
    }

    roundUnits =
      roundUnits ||
      (await getRoundUnits({
        game,
        unitBeingPlayed: unit,
      }))
    effects =
      effects ||
      (await getUnitEffects({
        units: roundUnits,
      }))

    const {
      mardroemes,
      transformedUnits,
      transformedGameUnits,
      mardroemingGameUnit,
      musters,
      musteredUnits,
      musteredOrigins,
      scorches,
      decoys,
      deckUnitsAddedToHand,
    } = await BattlefieldUpdates.modifyBattlefieldWithNewUnit({
      battlefieldUnits: roundUnits,
      combat,
      effects,
      game,
      logPrefix,
      newDeckUnit: deckUnit,
      newUnit: unit,
      targetId,
    })

    const musterEffects = await getUnitEffects({
      units: musteredUnits,
      effects,
    })
    const transformedEffects = await getUnitEffects({
      units: transformedUnits,
      effects,
    })

    const { bonds, horns, morales } = CalculateGameEffectiveStrengths.calculateEffectiveStrengths({
      game,
      units: [unit, ...roundUnits, ...musteredUnits, ...transformedUnits],
      effects: [...effects, ...musterEffects, ...transformedEffects],
      logPrefix,
      newDeckUnit: deckUnit,
      musteredUnitIds: musteredUnits.map((unit) => unit._id.toString()),
      transformedUnitIds: transformedUnits.map((unit) => unit._id.toString()),
    })

    setGameScores(game)

    UpdateHistory.newUnitDeployed({
      combat,
      deckUnit,
      game,
      decoys,
      musters,
      musteredOrigins,
      playerId,
      logPrefix,
      scorches,
      bonds,
      horns,
      morales,
      mardroemes,
      transformedGameUnits,
      mardroemingGameUnit,
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
      handDeckUnitsAdded: deckUnitsAddedToHand,
    }
  }
}

interface ImplementedPlayUnit {
  game: GameDbObject
  gameDeck: GameDeckDbObject
  handDeckUnitsAdded: DeckUnitDbObject[]
}
