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
 * A class for resolving the playUnit GraphQL Mutation.
 */
export default class PlayUnitResolution {
  private static logger = getLogger('PlayUnitResolution')

  /**
   * Resolve a game after a unit has been played, passing it back on the request and publishing it for subscriptions.
   *
   * @param config The configuration used to resolve the game with the unit played.
   * @param config.deckUnit The DeckUnit which was played on the game.
   * @param config.game The game updated with the impact of having the unit played on it.
   * @param config.gameDeck The game deck after the unit has been played.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @param config.handDeckUnitsAdded Any potential DeckUnits added to the players game hand.
   * @returns The Game with the unit played for the user with fields resolved.
   */
  static async playUnitResolution({
    deckUnit,
    game,
    gameDeck,
    handDeckUnitsAdded,
    logPrefix,
  }: {
    deckUnit: DeckUnitDbObject
    game: GameDbObject
    gameDeck: GameDeckDbObject
    handDeckUnitsAdded: DeckUnitDbObject[]
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

    const handed = await DeckUnitResolver.fromArray({
      deckUnits: handDeckUnitsAdded,
    })
    if (PlayUnitResolution.logger.isTraceEnabled()) {
      PlayUnitResolution.logger.trace(`${logPrefix} handed: "${JSON.stringify(handed)}"`)
    }
    EventManager.pubsub.publish(PubSubEvents.UnitPlayedFromDeck, {
      unitPlayedFromDeck: {
        deck: resolvedGameDeck,
        game: resolvedGame,
        handed: handed,
        unit: resolvedUnit,
      },
    } as UnitPlayedFromDeckPayload)

    return resolvedGame
  }
}
