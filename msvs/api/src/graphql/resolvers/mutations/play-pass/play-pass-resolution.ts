import { getLogger } from 'log4js'
import { ObjectId } from 'mongodb'

import EventManager from '../../../event-manager'
import { Game } from '@gwent/graphql-schema/resolver-typings'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import GameDeckResolver from '../../types/game-deck-resolver'
import GameResolver from '../../types/game-resolver'
import { PassPlayedPayload, RoundEndedForDeckPayload } from '../../subscription-resolver'
import { PubSubEvents } from '@gwent/constants'

/**
 * A class for resolving the playPass GraphQL Mutation.
 */
export default class PlayPassResolution {
  private static logger = getLogger('PlayPassResolution')

  /**
   * Resolve a game after a user has passed in it, passing it back on the request and publishing it for subscriptions.
   *
   * @param config The configuration used to resolve the game with the pass played.
   * @param config.game The game that was passed on.
   * @param config.logPrefix The prefix which should be prefixed on log statements.
   * @param config.roundOver Whether or not the pass action resulted in the round ending.
   * @param config.userId The ID of the user playing the pass.
   * @returns The Game with the round passed for the user with all fields resolved.
   */
  static async playPassResolution({
    game,
    logPrefix,
    roundOver,
    userId,
  }: {
    game: GameDbObject
    logPrefix: string
    roundOver: boolean
    userId: ObjectId
  }): Promise<Game> {
    const resolvedGame = await GameResolver.fromObject({
      game,
      userId,
    })

    if (PlayPassResolution.logger.isTraceEnabled()) {
      PlayPassResolution.logger.trace(`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`)
    }

    EventManager.pubsub.publish(PubSubEvents.PassPlayed, {
      passPlayed: resolvedGame,
    } as PassPlayedPayload)

    if (roundOver) {
      for (const gamePlayer of game.players) {
        const resolvedGameDeck = await GameDeckResolver.fromObject({
          gameDeck: gamePlayer.deck,
        })

        if (PlayPassResolution.logger.isTraceEnabled()) {
          PlayPassResolution.logger.trace(
            `${logPrefix} resolvedGameDeck for "${gamePlayer.user}": "${JSON.stringify(resolvedGameDeck)}"`
          )
        }

        EventManager.pubsub.publish(PubSubEvents.RoundEndedForDeck, {
          roundEndedForDeck: {
            deck: resolvedGameDeck,
            game: resolvedGame,
          },
        } as RoundEndedForDeckPayload)
      }
    }

    return resolvedGame
  }
}
