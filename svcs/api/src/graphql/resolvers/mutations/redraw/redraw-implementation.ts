import { getLogger } from 'log4js'

import { DeckUnitDbObject, GameDbObject } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../../../database/stores/game-store'
import PresentableError from '../../../../util/presentable-error'
import RedrawUnit from './redraw-unit'
import { ValidatedRedraw } from './redraw-validation'

/**
 * A class for executing the redraw GraphQL Mutation.
 */
export default class RedrawImplementation {
  private static logger = getLogger('RedrawImplementation')

  /**
   * Redraw a Unit for a Game for a random Unit from their undrawn Units.
   *
   * @param args The arguments for redrawing a unit.
   * @param context The session containing the user redrawing the unit.
   * @param info The information about the GraphQL request.
   * @returns The random DeckUnit that replaces their redrawn Unit in their hand.
   * @throws PresentableError if problem redrawing unit.
   */
  static async redrawImplementation({ game, logPrefix, unitId, userId }: ValidatedRedraw): Promise<ImplementedRedraw> {
    // TODO: make input reference Validated interface if they are always the same
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
