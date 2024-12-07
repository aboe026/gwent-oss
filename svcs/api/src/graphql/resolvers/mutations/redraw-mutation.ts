import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { Context } from '@gwent/graphql-schema/context'
import { DeckUnit, MutationRedrawArgs } from '@gwent/graphql-schema/resolver-typings'
import DeckUnitResolver from '../types/deck-unit-resolver'
import EventManager from '../../event-manager'
import { GamePlayerDbObject, RedrawDbObject } from '@gwent/graphql-schema/database-typings'
import GameResolver from '../types/game-resolver'
import GameStore from '../../../database/stores/game-store'
import { getRandomSubset } from '@gwent/utils'
import { GraphQLResolveInfo } from 'graphql'
import { MAX_REDRAWS, NOT_AUTHENTICATED_MESSAGE, PubSubEvents } from '@gwent/constants'
import { RequestedFields } from '@gwent/graphql-schema'

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
   */
  static async redraw(args: MutationRedrawArgs, context: Context, info: GraphQLResolveInfo): Promise<DeckUnit> {
    const userId = context.session?.user?._id
    if (!userId) {
      RedrawMutation.logger.error(`No user on context for redraw mutation: "${JSON.stringify(context.session)}".`)
      return Error(NOT_AUTHENTICATED_MESSAGE) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const logPrefix = `redraw by "${userId}"`
    if (RedrawMutation.logger.isTraceEnabled()) {
      RedrawMutation.logger.trace(`${logPrefix} args: "${JSON.stringify(args)}"`)
      RedrawMutation.logger.trace(
        `${logPrefix} requested fields: "${JSON.stringify(RequestedFields.getFieldsRequested(info))}"`
      )
      RedrawMutation.logger.trace(
        `${logPrefix} requested arguments: "${JSON.stringify(RequestedFields.getArguments(info))}"`
      )
    }
    const gameId = args.game
    const unitId = args.unit
    if (!ObjectId.isValid(gameId)) {
      const message = `Game ID "${gameId}" is not a valid MongoDB ObjectId.`
      RedrawMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (!ObjectId.isValid(unitId)) {
      const message = `Unit ID "${unitId}" is not a valid MongoDB ObjectId.`
      RedrawMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const game = await GameStore.getById({
      id: gameId,
    })
    if (RedrawMutation.logger.isTraceEnabled()) {
      RedrawMutation.logger.trace(`${logPrefix} game: "${JSON.stringify(game)}"`)
    }
    if (!game) {
      const message = `Game with ID "${gameId}" does not exist.`
      RedrawMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const player: GamePlayerDbObject | undefined = game.players.find(
      (player) => player.user.toString() === userId.toString()
    )
    if (RedrawMutation.logger.isTraceEnabled()) {
      RedrawMutation.logger.trace(`${logPrefix} player: "${JSON.stringify(player)}"`)
    }
    if (!player) {
      const message = `Not a player on game "${gameId}".`
      RedrawMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (player.ready) {
      const message = `Cannot redraw after game "${gameId}" is marked as ready.`
      RedrawMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (!player.deck.from) {
      const message = `Cannot redraw before deck is set for game "${gameId}".`
      RedrawMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    if (player.deck.redraws.length >= MAX_REDRAWS) {
      const message = `Cannot exceed maximum redraw limit of "${MAX_REDRAWS}" for game "${gameId}".`
      RedrawMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const redrawnIds = player.deck.redraws.map((redraw) => redraw.from.unit.toString())
    const cardToRedraw = player.deck.hand.find((deckUnit) => deckUnit.unit.toString() === unitId)
    if (RedrawMutation.logger.isTraceEnabled()) {
      RedrawMutation.logger.trace(`${logPrefix} cardToRedraw: "${JSON.stringify(cardToRedraw)}"`)
    }
    if (!cardToRedraw) {
      const message = `Unit with ID "${unitId}" does not exist in hand for game "${gameId}".`
      RedrawMutation.logger.warn(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    // make sure we don't redraw card that was previously chosen for redraw
    const redrawPool = player.deck.undrawn.filter((deckUnit) => !redrawnIds.includes(deckUnit.unit.toString()))
    if (RedrawMutation.logger.isTraceEnabled()) {
      RedrawMutation.logger.trace(`${logPrefix} redrawPool: "${JSON.stringify(redrawPool)}"`)
    }
    const newCard = getRandomSubset({
      items: redrawPool,
      size: 1,
    })[0]
    if (RedrawMutation.logger.isTraceEnabled()) {
      RedrawMutation.logger.trace(`${logPrefix} newCard: "${JSON.stringify(newCard)}"`)
    }
    const newUndrawn = player.deck.undrawn.filter((deckUnit) => deckUnit.unit.toString() !== newCard.unit.toString())
    newUndrawn.push(cardToRedraw)
    const newHand = player.deck.hand.filter((deckUnit) => deckUnit.unit.toString() !== unitId)
    newHand.push(newCard)
    const newRedraws: RedrawDbObject[] = [
      ...player.deck.redraws,
      {
        from: cardToRedraw,
        to: newCard,
      },
    ]

    if (RedrawMutation.logger.isTraceEnabled()) {
      RedrawMutation.logger.trace(`${logPrefix} newHand: "${JSON.stringify(newHand)}"`)
      RedrawMutation.logger.trace(`${logPrefix} newRedraws: "${JSON.stringify(newRedraws)}"`)
      RedrawMutation.logger.trace(`${logPrefix} newUndrawn: "${JSON.stringify(newUndrawn)}"`)
    }

    const updatedGame = await GameStore.redraw({
      currentRedraws: player.deck.redraws,
      gameId,
      newHand,
      newRedraws,
      newUndrawn,
      userId,
    })

    if (RedrawMutation.logger.isTraceEnabled()) {
      RedrawMutation.logger.trace(`${logPrefix} updatedGame: "${JSON.stringify(updatedGame)}"`)
    }
    if (!updatedGame) {
      const message = `Could not redraw unit "${unitId}" on game "${gameId}" in probable race condition collision.`
      RedrawMutation.logger.error(`${logPrefix} failed: ${message}`)
      return Error(message) as any // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const resolvedTo = await DeckUnitResolver.fromObject({
      deckUnit: newCard,
      neutralStats: RequestedFields.getArgument(info, 'redraw.unit.faction.stats.neutrals'),
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
      deckUnit: cardToRedraw,
    })
    if (RedrawMutation.logger.isTraceEnabled()) {
      RedrawMutation.logger.trace(`${logPrefix} resolvedFrom: "${JSON.stringify(resolvedFrom)}"`)
    }

    EventManager.pubsub.publish(PubSubEvents.UnitRedrawn, {
      unitRedrawn: {
        from: resolvedFrom,
        game: resolvedGame,
        to: resolvedTo,
        ownerId: userId,
      },
    })

    return resolvedTo
  }
}
