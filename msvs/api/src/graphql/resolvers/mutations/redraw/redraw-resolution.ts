import { getLogger } from 'log4js'

import { DeckUnit } from '@gwent-oss/graphql-schema/resolver-typings'
import { DeckUnitDbObject, GameDbObject, GameDeckDbObject } from '@gwent-oss/graphql-schema/database-typings'
import DeckUnitResolver from '../../types/deck-unit-resolver'
import EventManager from '../../../event-manager'
import GameDeckResolver from '../../types/game-deck-resolver'
import GameResolver from '../../types/game-resolver'
import PresentableError from '../../../../util/presentable-error'
import { PubSubEvents } from '@gwent-oss/constants'
import { UnitRedrawnPayload } from '../../subscription-resolver'

/**
 * A class for resolving the redraw GraphQL Mutation.
 */
export default class RedrawResolution {
  private static logger = getLogger('RedrawResolution')

  /**
   * Resolve a game with a unit redrawn, passing it back on the request and publishing it for subscriptions.
   *
   * @param config The configuration used to resolve the game with unit redrawn.
   * @param config.from The unit that was chosen to be redrawn.
   * @param config.game The game which had the unit redrawn on.
   * @param config.gameDeck The GameDeck after the unit was redrawn.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @param config.to The deck unit that was randomly selected to replace the from unit.
   * @returns The random DeckUnit that replaces their redrawn Unit in their hand with fields resolved.
   * @throws {PresentableError} if known problem resolving redrawn unit.
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
