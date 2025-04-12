import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { GameDbObject, RedrawDbObject } from '@gwent/graphql-schema/database-typings'
import { getRandomSubset } from '@gwent/utils'
import PresentableError from '../../../../util/presentable-error'

/**
 * A class to redraw a unit for a game Deck.
 */
export default class RedrawUnit {
  private static logger = getLogger('RedrawUnit')

  /**
   * Redraw a unit in a game deck with a random one from the discard pile.
   *
   * @param config The configuration used to redraw the unit.
   * @param config.game The game to redraw the unit on.
   * @param config.logPrefix What each log statement should be prefixed with to help identify output.
   * @param config.unitId The ID of the Unit to redraw, replacing it with a random unit from the discard pile.
   * @param config.userId The ID of the player on the game to redraw the unit for.
   * @returns
   */
  static redrawUnit({
    game,
    logPrefix,
    unitId,
    userId,
  }: {
    game: GameDbObject
    logPrefix: string
    unitId: string
    userId: ObjectId
  }): RedrawDbObject {
    const player = game.players.find((player) => player.user.toString() === userId.toString())
    if (player) {
      const redrawFrom = player.deck.hand.find((deckUnit) => deckUnit.unit.toString() === unitId)
      if (RedrawUnit.logger.isTraceEnabled()) {
        RedrawUnit.logger.trace(`${logPrefix} redrawFrom: "${JSON.stringify(redrawFrom)}"`)
      }
      if (!redrawFrom) {
        const message = 'Unit not in hand.'
        RedrawUnit.logger.warn(`${logPrefix} failed: ${message}`)
        throw new PresentableError(message)
      }

      // make sure we don't redraw card that was previously chosen for redraw
      const previouslyRedrawnIds = player.deck.redraws.map((redraw) => redraw.from.unit.toString())
      const redrawPool = player.deck.undrawn.filter(
        (deckUnit) => !previouslyRedrawnIds.includes(deckUnit.unit.toString())
      )
      if (RedrawUnit.logger.isTraceEnabled()) {
        RedrawUnit.logger.trace(`${logPrefix} redrawPool: "${JSON.stringify(redrawPool)}"`)
      }
      const redrawTo = getRandomSubset({
        items: redrawPool,
        size: 1,
      })[0]
      if (RedrawUnit.logger.isTraceEnabled()) {
        RedrawUnit.logger.trace(`${logPrefix} redrawTo: "${JSON.stringify(redrawTo)}"`)
      }

      player.deck.undrawn = [
        ...player.deck.undrawn.filter((deckUnit) => deckUnit.unit.toString() !== redrawTo.unit.toString()),
        redrawFrom,
      ]
      player.deck.hand = [
        ...player.deck.hand.filter((deckUnit) => deckUnit.unit.toString() !== unitId), // to break line for nicer formatting
        redrawTo,
      ]
      player.deck.redraws = [
        ...player.deck.redraws,
        {
          from: redrawFrom,
          to: redrawTo,
        },
      ]

      return {
        from: redrawFrom,
        to: redrawTo,
      }
    } else {
      const message = `Could not find player "${userId}" on game "${game._id}" to redraw unit "${game.round}" for.`
      RedrawUnit.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
  }
}
