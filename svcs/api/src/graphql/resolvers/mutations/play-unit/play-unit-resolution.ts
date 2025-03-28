import { getLogger } from 'log4js'

import { DeckUnitDbObject, GameDbObject, GameDeckDbObject } from '@gwent/graphql-schema/database-typings'
import DeckUnitResolver from '../../types/deck-unit-resolver'
import EventManager from '../../../event-manager'
import { Game } from '@gwent/graphql-schema/resolver-typings'
import GameDeckResolver from '../../types/game-deck-resolver'
import GameResolver from '../../types/game-resolver'
import { PubSubEvents } from '@gwent/constants'
import { UnitPlayedFromDeckPayload, UnitPlayedOnGamePayload } from '../../subscription-resolver'

/**
 * A class for executing the playUnit GraphQL Mutation.
 */
export default class PlayUnitResolution {
  private static logger = getLogger('PlayUnitResolution')

  /**
   * Play a unit for a user on a game.
   *
   * @param args The arguments for playing the unit.
   * @param context The session containing the user playing the unit.
   * @param info The information about the GraphQL request.
   * @returns The Game with the unit played for the user.
   * @throws PresentableError if problem playing unit.
   */
  static async playUnitResolution({
    deckUnit,
    game,
    gameDeck,
    logPrefix,
  }: {
    deckUnit: DeckUnitDbObject
    game: GameDbObject
    gameDeck: GameDeckDbObject
    logPrefix: string
  }): Promise<Game> {
    const resolvedGame = await GameResolver.fromObject({
      game,
    })
    if (PlayUnitResolution.logger.isTraceEnabled()) {
      PlayUnitResolution.logger.trace(`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`)
    }

    const resolvedUnit = await DeckUnitResolver.fromObject({
      deckUnit,
    })
    if (PlayUnitResolution.logger.isTraceEnabled()) {
      PlayUnitResolution.logger.trace(`${logPrefix} resolvedUnit: "${JSON.stringify(resolvedUnit)}"`)
    }

    const resolvedGameDeck = await GameDeckResolver.fromObject({
      gameDeck,
    })
    if (PlayUnitResolution.logger.isTraceEnabled()) {
      PlayUnitResolution.logger.trace(`${logPrefix} resolvedGameDeck: "${JSON.stringify(resolvedGameDeck)}"`)
    }

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
