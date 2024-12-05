import { PubSub } from 'graphql-subscriptions'

/**
 * A class for managing Publishing and Subscribing to events.
 */
export default class EventManager {
  static pubsub = new PubSub()
}
