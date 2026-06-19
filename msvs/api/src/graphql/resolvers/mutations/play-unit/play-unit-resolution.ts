import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import { DeckUnitDbObject, GameDbObject, GameDeckDbObject } from '@gwent/graphql-schema/database-typings'
import DeckUnitResolver from '../../types/deck-unit-resolver'
import EventManager from '../../../event-manager'
import { Game } from '@gwent/graphql-schema/resolver-typings'
import GameDeckResolver from '../../types/game-deck-resolver'
import GameResolver from '../../types/game-resolver'
import { IntermediateUnitPlayedOnGame, UnitPlayedFromDeckPayload } from '../../subscription-resolver'
import { PlayersToDeckUnitDbObjects } from '../util/players-to-deck-units'
import PlayersToDeckUnitsResolver from '../../types/players-to-deck-units-resolver'
import { PubSubEvents } from '@gwent/constants'

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
   * @param config.discards Any potential DeckUnits added to the discard pile for game players due to the new unit played.
   * @param config.undiscards Any potential DeckUnits removed from the discard pile for game players due to the new unit played.
   * @param config.userId The ID of the user playing the Unit.
   * @returns The Game with the unit played for the user with fields resolved.
   */
  static async playUnitResolution({
    deckUnit,
    game,
    gameDeck,
    handDeckUnitsAdded,
    discards,
    undiscards,
    logPrefix,
    userId,
  }: {
    deckUnit: DeckUnitDbObject
    game: GameDbObject
    gameDeck: GameDeckDbObject
    handDeckUnitsAdded: DeckUnitDbObject[]
    discards: PlayersToDeckUnitDbObjects
    undiscards: PlayersToDeckUnitDbObjects
    logPrefix: string
    userId: ObjectId
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

    const resolvedDiscards = await PlayersToDeckUnitsResolver.fromObject(discards)
    const resolvedUndiscards = await PlayersToDeckUnitsResolver.fromObject(undiscards)
    EventManager.pubsub.publish(PubSubEvents.UnitPlayedOnGame, {
      unitPlayedOnGame: {
        game: resolvedGame,
        unit: resolvedUnit,
        discarded: [], // to be scoped by subscription user later based off "discarded: resolvedDiscards"
        undiscarded: [], // to be scoped by subscription user later based off "undiscarded: resolvedUndiscards"
      },
      discarded: resolvedDiscards,
      undiscarded: resolvedUndiscards,
    } as IntermediateUnitPlayedOnGame)

    const handed = await DeckUnitResolver.fromArray({
      deckUnits: handDeckUnitsAdded,
    })
    if (PlayUnitResolution.logger.isTraceEnabled()) {
      PlayUnitResolution.logger.trace(`${logPrefix} handed: "${JSON.stringify(handed)}"`)
    }
    const discarded = await DeckUnitResolver.fromArray({
      deckUnits: discards[userId.toString()] || [],
    })
    if (PlayUnitResolution.logger.isTraceEnabled()) {
      PlayUnitResolution.logger.trace(`${logPrefix} discarded: "${JSON.stringify(discarded)}"`)
    }
    const undiscarded = await DeckUnitResolver.fromArray({
      deckUnits: undiscards[userId.toString()] || [],
    })
    if (PlayUnitResolution.logger.isTraceEnabled()) {
      PlayUnitResolution.logger.trace(`${logPrefix} undiscarded: "${JSON.stringify(undiscarded)}"`)
    }
    EventManager.pubsub.publish(PubSubEvents.UnitPlayedFromDeck, {
      unitPlayedFromDeck: {
        deck: resolvedGameDeck,
        game: resolvedGame,
        handed,
        discarded,
        undiscarded,
        unit: resolvedUnit,
      },
    } as UnitPlayedFromDeckPayload)

    return GameResolver.maskSpiedHandUnits({
      game: resolvedGame,
      userId,
    })
  }
}
