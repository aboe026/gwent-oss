import AddDeckMutation from './mutations/add-deck/add-deck-mutation'
import AddGameMutation from './mutations/add-game/add-game-mutation'
import AddUserMutation from './mutations/add-user/add-user-mutation'
import ApplicationQuery from './queries/application-query'
import CurrentUserQuery from './queries/current-user-query'
import DecksQuery from './queries/decks-query'
import FactionsQuery from './queries/factions-query'
import GameDeckQuery from './queries/game-deck-query'
import GameQuery from './queries/game-query'
import GamesQuery from './queries/games-query'
import LeadersQuery from './queries/leaders-query'
import LoginMutation from './mutations/login/login-mutation'
import LogoutMutation from './mutations/logout-mutation'
import PlayPassMutation from './mutations/play-pass-mutation'
import PlayUnitMutation from './mutations/play-unit-mutation'
import ReadyMutation from './mutations/ready-mutation'
import RedrawMutation from './mutations/redraw-mutation'
import { Resolvers } from '@gwent/graphql-schema/resolver-typings'
import { scalars } from '@gwent/graphql-schema'
import SetDeckMutation from './mutations/set-deck-mutation'
import SetOrderMutation from './mutations/set-order-mutation'
import SettingsQuery from './queries/settings-query'
import SubscriptionResolver from './subscription-resolver'
import UnitsQuery from './queries/units-query'

/**
 * The definition of all resolvers defined on the GraphQL schema.
 */
export const resolvers: Resolvers = {
  Mutation: {
    addDeck: async (parent, args, context, info) => AddDeckMutation.addDeckMutation(args, context, info),
    addGame: async (parent, args, context, info) => AddGameMutation.addGameMutation(args, context, info),
    addUser: async (parent, args, context, info) => AddUserMutation.addUserMutation(args, info),
    login: async (parent, args, context, info) => LoginMutation.loginMutation(args, context, info),
    logout: async (parent, args, context, info) => LogoutMutation.logout(context, info),
    playPass: async (parent, args, context, info) => PlayPassMutation.playPass(args, context, info),
    playUnit: async (parent, args, context, info) => PlayUnitMutation.playUnit(args, context, info),
    ready: async (parent, args, context, info) => ReadyMutation.ready(args, context, info),
    redraw: async (parent, args, context, info) => RedrawMutation.redraw(args, context, info),
    setDeck: async (parent, args, context, info) => SetDeckMutation.setDeck(args, context, info),
    setOrder: async (parent, args, context, info) => SetOrderMutation.setOrder(args, context, info),
  },
  Query: {
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
  },
  Subscription: SubscriptionResolver.getResolvers(),
  ...scalars,
}

export default resolvers
