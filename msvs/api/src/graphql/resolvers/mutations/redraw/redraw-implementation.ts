import { getLogger } from 'log4js'

import { DeckUnitDbObject, GameDbObject } from '@gwent-oss/graphql-schema/database-typings'
import GameStore from '../../../../database/stores/game-store'
import PresentableError from '../../../../util/presentable-error'
import RedrawUnit from './redraw-unit'
import { ValidatedRedraw } from './redraw-validation'

/**
 * A class for implemeting the redraw GraphQL Mutation.
 */
export default class RedrawImplementation {
  private static logger = getLogger('RedrawImplementation')

  /**
   * Redraw a Unit of a Game for a random Unit from their undrawn Units, saving the new game deck to the database.
   *
   * @param config The configuration used to redraw the unit.
   * @param config.game The game to redraw the unit on.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @param config.unitId The ID of the unit to redraw.
   * @param config.userId The ID of the user performing the redraw.
   * @returns The updated game with both the unit to redraw and the random unit that replaced it.
   * @throws {PresentableError} if known problem redrawing unit.
   */
  static async redrawImplementation({ game, logPrefix, unitId, userId }: ValidatedRedraw): Promise<ImplementedRedraw> {
    const { from, to } = RedrawUnit.redrawUnit({
      game,
      logPrefix,
      unitId,
      userId,
    })

    const updatedGame = await GameStore.save(game)

    if (RedrawImplementation.logger.isTraceEnabled()) {
      RedrawImplementation.logger.trace(`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`)
    }

    if (!updatedGame) {
      const message = 'Could not redraw unit in probable race condition collision.'
      RedrawImplementation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    return {
      from,
      game: updatedGame,
      to,
    }
  }
}

interface ImplementedRedraw {
  from: DeckUnitDbObject
  game: GameDbObject
  to: DeckUnitDbObject
}
