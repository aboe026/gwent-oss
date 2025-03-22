import addMoveToCurrentPlayer from '../util/add-move-to-current-player'
import CalculateGameEffectiveStrengths from './calculate-game-effective-strengths'
import { Combat } from '@gwent/graphql-schema/resolver-typings'
import {
  DeckUnitDbObject,
  GameDbObject,
  GameDeckDbObject,
  MoveUnitDbObject,
  UnitDbObject,
} from '@gwent/graphql-schema/database-typings'
import GameStore from '../../../../database/stores/game-store'
import { getLogger } from 'log4js'
import GetNextPlayerIdForCurrentRound from '../util/get-next-player-id-for-current-round'
import getRoundUnits from './get-round-units'
import getUnitEffects from './get-unit-effects'
import modifyBattlefieldWithNewUnit from './modify-battlefield-with-new-unit'
import { MoveType } from '@gwent/graphql-schema'
import PresentableError from '../../../../util/presentable-error'
import setGameScores from './set-game-scores'

/**
 * A class for executing the playUnit GraphQL Mutation.
 */
export default class PlayUnitImplementation {
  private static logger = getLogger('PlayUnitImplementation')

  /**
   * Play a unit for a user on a game.
   *
   * @param args The arguments for playing the unit.
   * @param context The session containing the user playing the unit.
   * @param info The information about the GraphQL request.
   * @returns The Game with the unit played for the user.
   * @throws PresentableError if problem playing unit.
   */
  static async playUnitImplementation({
    combat,
    deckUnit,
    game,
    logPrefix,
    unit,
  }: {
    combat: Combat
    deckUnit: DeckUnitDbObject
    game: GameDbObject
    logPrefix: string
    unit: UnitDbObject
  }): Promise<ImplementedPlayUnit> {
    const roundUnits = await getRoundUnits({
      game,
      unitBeingPlayed: unit,
    })
    const unitEffects = await getUnitEffects(roundUnits)

    modifyBattlefieldWithNewUnit({
      game,
      combat,
      deckUnit,
    })

    CalculateGameEffectiveStrengths.calculateEffectiveStrengths({
      game,
      units: [unit, ...roundUnits],
      effects: unitEffects,
    })

    setGameScores(game)

    addMoveToCurrentPlayer({
      game,
      move: {
        created: new Date(),
        row: combat,
        unit: {
          artStyle: deckUnit.artStyle,
          unit: deckUnit.unit,
        },
        type: MoveType.Unit,
      } as MoveUnitDbObject,
    })

    game.turn = GetNextPlayerIdForCurrentRound.getNextPlayerIdForCurrentRound({
      currentRound: game.round,
      currentTurn: game.turn,
      players: game.players,
      logPrefix,
    })

    const updatedGame = await GameStore.save(game)

    if (!updatedGame) {
      const message = 'Could not play unit in probable race condition collision.'
      PlayUnitImplementation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    const player = updatedGame.players.find((player) => player.user.toString() === game.turn?.toString())
    if (!player) {
      const message = `Could not find player "${game.turn}" in updated game.`
      PlayUnitImplementation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    return {
      game,
      gameDeck: player.deck,
    }
  }
}

interface ImplementedPlayUnit {
  game: GameDbObject
  gameDeck: GameDeckDbObject
}
