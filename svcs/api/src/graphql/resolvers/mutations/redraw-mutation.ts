import { getLogger } from 'log4js'

import { Context } from '@gwent/graphql-schema/context'
import { DeckUnit, MutationRedrawArgs } from '@gwent/graphql-schema/resolver-typings'
import DeckUnitResolver from '../types/deck-unit-resolver'
import EventManager from '../../event-manager'
import GameDeckResolver from '../types/game-deck-resolver'
import GameResolver from '../types/game-resolver'
import { GameStatus } from '@gwent/graphql-schema/database-typings'
import GameStore from '../../../database/stores/game-store'
import { GraphQLResolveInfo } from 'graphql'
import { MAX_REDRAWS, PubSubEvents } from '@gwent/constants'
import PresentableError from '../../../util/presentable-error'
import RedrawUnit from './util/redraw-unit'
import ResolverUtil from '../resolver-util'
import { UnitRedrawnPayload } from '../subscription-resolver'

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
  static async redraw(args: MutationRedrawArgs, context: Context, info: GraphQLResolveInfo): Promise<DeckUnit> {
    const resolverUtil = new ResolverUtil({
      logger: RedrawMutation.logger,
    })
    const { _id: userId } = resolverUtil.getContextUser({
      context,
      label: 'redraw mutation',
    })
    const gameId = args.game
    const unitId = args.unit

    const logPrefix = `redraw by "${userId}" for unit "${unitId}" on game "${gameId}"`
    resolverUtil.setLogPrefix(logPrefix)
    resolverUtil.logRequestInfo({
      args,
      info,
    })

    resolverUtil.verifyMongoIds({
      ids: [unitId],
      label: 'Unit ID',
    })

    const { game, player } = await resolverUtil.getGamePlayer({
      gameId,
      userId,
      status: GameStatus.Redrawing,
      label: 'redraw',
    })

    if (player.ready) {
      const message = 'Redraw not allowed after game marked as ready.'
      RedrawMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
    if (player.deck.redraws.length >= MAX_REDRAWS) {
      const message = `Cannot exceed maximum redraw limit of "${MAX_REDRAWS}".`
      RedrawMutation.logger.warn(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }

    const { from, to } = RedrawUnit.redrawUnit({
      game,
      logPrefix,
      unitId,
      userId,
    })

    const updatedGame = await GameStore.save(game)

    if (RedrawMutation.logger.isTraceEnabled()) {
      RedrawMutation.logger.trace(`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`)
    }
    if (!updatedGame) {
      const message = 'Could not redraw unit in probable race condition collision.'
      RedrawMutation.logger.error(`${logPrefix} failed: ${message}`)
      throw new PresentableError(message)
    }
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
