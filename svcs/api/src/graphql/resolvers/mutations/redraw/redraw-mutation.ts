import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { DeckUnit, MutationRedrawArgs } from '@gwent/graphql-schema/resolver-typings'
import DeckUnitResolver from '../../types/deck-unit-resolver'
import EventManager from '../../../event-manager'
import GameDeckResolver from '../../types/game-deck-resolver'
import GameResolver from '../../types/game-resolver'
import { GraphQLResolveInfo } from 'graphql'
import PresentableError from '../../../../util/presentable-error'
import { PubSubEvents } from '@gwent/constants'
import RedrawImplementation from './redraw-implementation'
import RedrawValidation from './redraw-validation'
import { UnitRedrawnPayload } from '../../subscription-resolver'

/**
 * A class for executing the redraw GraphQL Mutation.
 */
export default class RedrawMutation {
  private static logger = getLogger('RedrawMutation')

  /**
   * Redraw a Unit for a Game for a random Unit from their undrawn Units.
   *
   * @param args The arguments for redrawing a unit.
   * @param context The session containing the user redrawing the unit.
   * @param info The information about the GraphQL request.
   * @returns The random DeckUnit that replaces their redrawn Unit in their hand.
   * @throws PresentableError if problem redrawing unit.
   */
  static async redrawMutation(args: MutationRedrawArgs, context: Context, info: GraphQLResolveInfo): Promise<DeckUnit> {
    const {
      game,
      logPrefix,
      unitId,
      userId, //
    } = await RedrawValidation.redrawValidation(args, context, info)

    const {
      from,
      game: updatedGame,
      to, //
    } = await RedrawImplementation.redrawImplementation({
      game,
      logPrefix,
      unitId,
      userId,
    })

    const resolvedTo = await DeckUnitResolver.fromObject({
      deckUnit: to,
    })
    if (RedrawMutation.logger.isTraceEnabled()) {
      RedrawMutation.logger.trace(`${logPrefix} resolvedTo: "${JSON.stringify(resolvedTo)}"`)
    }

    const resolvedGame = await GameResolver.fromObject({
      game: updatedGame,
    })
    if (RedrawMutation.logger.isTraceEnabled()) {
      RedrawMutation.logger.trace(`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`)
    }
    const resolvedFrom = await DeckUnitResolver.fromObject({
      deckUnit: from,
    })
    if (RedrawMutation.logger.isTraceEnabled()) {
      RedrawMutation.logger.trace(`${logPrefix} resolvedFrom: "${JSON.stringify(resolvedFrom)}"`)
    }

    const updatedGameDeck = updatedGame.players.find((player) => player.user.toString() === userId.toString())?.deck
    if (!updatedGameDeck) {
      const message = 'Could not get updated game deck when redrawing unit.'
      RedrawMutation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    const resolvedGameDeck = await GameDeckResolver.fromObject({
      gameDeck: updatedGameDeck,
    })

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
