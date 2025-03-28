import { getLogger } from 'log4js'

import { DeckUnit } from '@gwent/graphql-schema/resolver-typings'
import { DeckUnitDbObject, GameDbObject, GameDeckDbObject } from '@gwent/graphql-schema/database-typings'
import DeckUnitResolver from '../../types/deck-unit-resolver'
import EventManager from '../../../event-manager'
import GameDeckResolver from '../../types/game-deck-resolver'
import GameResolver from '../../types/game-resolver'
import PresentableError from '../../../../util/presentable-error'
import { PubSubEvents } from '@gwent/constants'
import { UnitRedrawnPayload } from '../../subscription-resolver'

/**
 * A class for executing the redraw GraphQL Mutation.
 */
export default class RedrawResolution {
  private static logger = getLogger('RedrawResolution')

  /**
   * Redraw a Unit for a Game for a random Unit from their undrawn Units.
   *
   * @param args The arguments for redrawing a unit.
   * @param context The session containing the user redrawing the unit.
   * @param info The information about the GraphQL request.
   * @returns The random DeckUnit that replaces their redrawn Unit in their hand.
   * @throws PresentableError if problem redrawing unit.
   */
  static async redrawResolution({
    from,
    game,
    gameDeck,
    logPrefix,
    to,
  }: {
    from: DeckUnitDbObject
    game: GameDbObject
    gameDeck: GameDeckDbObject | undefined
    logPrefix: string
    to: DeckUnitDbObject
  }): Promise<DeckUnit> {
    const resolvedTo = await DeckUnitResolver.fromObject({
      deckUnit: to,
    })
    if (RedrawResolution.logger.isTraceEnabled()) {
      RedrawResolution.logger.trace(`${logPrefix} resolvedTo: "${JSON.stringify(resolvedTo)}"`)
    }

    const resolvedGame = await GameResolver.fromObject({
      game,
    })
    if (RedrawResolution.logger.isTraceEnabled()) {
      RedrawResolution.logger.trace(`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`)
    }
    const resolvedFrom = await DeckUnitResolver.fromObject({
      deckUnit: from,
    })
    if (RedrawResolution.logger.isTraceEnabled()) {
      RedrawResolution.logger.trace(`${logPrefix} resolvedFrom: "${JSON.stringify(resolvedFrom)}"`)
    }

    if (!gameDeck) {
      const message = 'Could not get updated game deck when redrawing unit.'
      RedrawResolution.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    const resolvedGameDeck = await GameDeckResolver.fromObject({
      gameDeck,
    })
    if (RedrawResolution.logger.isTraceEnabled()) {
      RedrawResolution.logger.trace(`${logPrefix} resolvedGameDeck: "${JSON.stringify(resolvedGameDeck)}"`)
    }

    EventManager.pubsub.publish(PubSubEvents.UnitRedrawn, {
      unitRedrawn: {
        from: resolvedFrom,
        deck: resolvedGameDeck,
        game: resolvedGame,
        to: resolvedTo,
      },
    } as UnitRedrawnPayload)

    return resolvedTo
  }
}
