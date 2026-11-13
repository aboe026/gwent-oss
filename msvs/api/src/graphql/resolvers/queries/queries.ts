import ApplicationQuery from './application-query'
import CurrentUserQuery from './current-user-query'
import DecksQuery from './decks-query'
import FactionsQuery from './factions-query'
import GameDeckQuery from './game-deck-query'
import GameQuery from './game-query'
import GamesQuery from './games-query'
import LeadersQuery from './leaders-query'
import { QueryResolvers } from '@gwent-oss/graphql-schema/resolver-typings'
import SettingsQuery from './settings-query'
import UnitsQuery from './units-query'
import UsernameAvailableQuery from './username-available'

/**
 * A class to resolve Queries defined in the GraphQL Schema.
 */
export default class Queries {
  /**
   * Gets the function that resolve for every query.
   *
   * @returns All the queries defined in the schema with their corresponding resolving function.
   */
  static getQueries(): QueryResolvers {
    return {
      application: async (parent, args, context, info) => ApplicationQuery.application(context, info),
      currentUser: async (parent, args, context, info) => CurrentUserQuery.currentUser(context, info),
      decks: async (parent, args, context, info) => DecksQuery.decks(context, info),
      factions: async (parent, args, context, info) => FactionsQuery.factions(args, context, info),
      game: async (parent, args, context, info) => GameQuery.game(args, context, info),
      gameDeck: async (parent, args, context, info) => GameDeckQuery.gameDeck(args, context, info),
      games: async (parent, args, context, info) => GamesQuery.games(context, info),
      leaders: async (parent, args, context, info) => LeadersQuery.leaders(args, context, info),
      settings: async (parent, args, context, info) => SettingsQuery.settings(context, info),
      units: async (parent, args, context, info) => UnitsQuery.units(args, context, info),
      usernameAvailable: async (parent, args, context, info) =>
        UsernameAvailableQuery.usernameAvailable(args, context, info),
    }
  }
}
