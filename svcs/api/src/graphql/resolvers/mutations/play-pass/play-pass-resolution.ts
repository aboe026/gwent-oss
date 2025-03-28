import { getLogger } from 'log4js'

import EventManager from '../../../event-manager'
import { Game } from '@gwent/graphql-schema/resolver-typings'
import { GameDbObject } from '@gwent/graphql-schema/database-typings'
import GameDeckResolver from '../../types/game-deck-resolver'
import GameResolver from '../../types/game-resolver'
import { PassPlayedPayload, RoundEndedForDeckPayload } from '../../subscription-resolver'
import { PubSubEvents } from '@gwent/constants'

/**
 * A class for executing the playPass GraphQL Mutation.
 */
export default class PlayPassResolution {
  private static logger = getLogger('PlayPassResolution')

  /**
   * Pass the rest of the round for a user. Once a round is passed, the user can no longer play units the rest of the round.
   *
   * @param args The arguments for passing the round.
   * @param context The session containing the user passing.
   * @param info The information about the GraphQL request.
   * @returns The Game with the round passed for the user.
   * @throws PresentableError if problem playing pass.
   */
  static async playPassResolution({
    game,
    logPrefix,
    roundOver,
  }: {
    game: GameDbObject
    logPrefix: string
    roundOver: boolean
  }): Promise<Game> {
    const resolvedGame = await GameResolver.fromObject({
      game,
    })

    if (PlayPassResolution.logger.isTraceEnabled()) {
      PlayPassResolution.logger.trace(`${logPrefix} resolvedGame: "${JSON.stringify(resolvedGame)}"`)
    }

    EventManager.pubsub.publish(PubSubEvents.PassPlayed, {
      passPlayed: resolvedGame,
    } as PassPlayedPayload)

    if (roundOver) {
      for (const gamePlayer of game.players) {
        EventManager.pubsub.publish(PubSubEvents.RoundEndedForDeck, {
          roundEndedForDeck: {
            deck: await GameDeckResolver.fromObject({
              gameDeck: gamePlayer.deck,
            }),
            game: resolvedGame,
          },
        } as RoundEndedForDeckPayload)
      }
    }

    return resolvedGame
  }
}
