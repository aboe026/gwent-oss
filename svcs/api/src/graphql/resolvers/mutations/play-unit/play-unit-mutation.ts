import { Context } from '@gwent/graphql-schema/context'
import DeckUnitResolver from '../../types/deck-unit-resolver'
import EventManager from '../../../event-manager'
import { Game, MutationPlayUnitArgs } from '@gwent/graphql-schema/resolver-typings'
import GameDeckResolver from '../../types/game-deck-resolver'
import GameResolver from '../../types/game-resolver'
import { getLogger } from 'log4js'
import { GraphQLResolveInfo } from 'graphql'
import PlayUnitImplementation from './play-unit-implementation'
import PlayUnitValidation from './play-unit-validation'
import { PubSubEvents } from '@gwent/constants'
import { UnitPlayedFromDeckPayload, UnitPlayedOnGamePayload } from '../../subscription-resolver'

/**
 * A class for executing the playUnit GraphQL Mutation.
 */
export default class PlayUnitMutation {
  private static logger = getLogger('PlayUnitMutation')

  /**
   * Play a unit for a user on a game.
   *
   * @param args The arguments for playing the unit.
   * @param context The session containing the user playing the unit.
   * @param info The information about the GraphQL request.
   * @returns The Game with the unit played for the user.
   * @throws PresentableError if problem playing unit.
   */
  static async playUnitMutation(args: MutationPlayUnitArgs, context: Context, info: GraphQLResolveInfo): Promise<Game> {
    const {
      combat,
      deckUnit,
      game,
      logPrefix,
      unit, //
    } = await PlayUnitValidation.playUnitValidation(args, context, info)

    const {
      game: updatedGame,
      gameDeck, //
    } = await PlayUnitImplementation.playUnitImplementation({
      combat,
      deckUnit,
      game,
      logPrefix,
      unit,
    })

    const resolvedGame = await GameResolver.fromObject({
      game: updatedGame,
    })
    const resolvedUnit = await DeckUnitResolver.fromObject({
      deckUnit,
    })
    const resolvedGameDeck = await GameDeckResolver.fromObject({
      gameDeck,
    })

    EventManager.pubsub.publish(PubSubEvents.UnitPlayedOnGame, {
      unitPlayedOnGame: {
        game: resolvedGame,
        unit: resolvedUnit,
      },
    } as UnitPlayedOnGamePayload)

    EventManager.pubsub.publish(PubSubEvents.UnitPlayedFromDeck, {
      unitPlayedFromDeck: {
        deck: resolvedGameDeck,
        game: resolvedGame,
        unit: resolvedUnit,
      },
    } as UnitPlayedFromDeckPayload)

    return resolvedGame
  }
}
