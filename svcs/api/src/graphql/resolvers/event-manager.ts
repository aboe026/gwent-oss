import { PubSub } from 'graphql-subscriptions'

export default class EventManager {
  static pubsub = new PubSub()
}
