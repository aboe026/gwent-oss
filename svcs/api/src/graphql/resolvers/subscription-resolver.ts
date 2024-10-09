import { SubscriptionResolvers } from '@gwent/graphql-schema/resolver-typings'
import EventManager from './event-manager'
import { PubSubEvents } from '@gwent/constants'

export default class SubscriptionResolver {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getResolvers(): SubscriptionResolvers<any, any> {
    return {
      deckAdded: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subscribe: () => EventManager.pubsub.asyncIterator([PubSubEvents.DeckAdded]) as unknown as AsyncIterable<any>,
      },
      gameAdded: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        subscribe: () => EventManager.pubsub.asyncIterator([PubSubEvents.GameAdded]) as unknown as AsyncIterable<any>,
      },
    }
  }
}
