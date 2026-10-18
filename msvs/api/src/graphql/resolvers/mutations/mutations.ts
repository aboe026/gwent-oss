import AddDeckMutation from './add-deck/add-deck-mutation'
import AddGameMutation from './add-game/add-game-mutation'
import AddUserMutation from './add-user/add-user-mutation'
import LoginMutation from './login/login-mutation'
import LogoutMutation from './logout/logout-mutation'
import { MutationResolvers } from '@gwent-oss/graphql-schema/resolver-typings'
import PlayPassMutation from './play-pass/play-pass-mutation'
import PlayUnitMutation from './play-unit/play-unit-mutation'
import ReadyMutation from './ready/ready-mutation'
import RedrawMutation from './redraw/redraw-mutation'
import SetDeckMutation from './set-deck/set-deck-mutation'
import SetOrderMutation from './set-order/set-order-mutation'

/**
 * A class to resolve Mutations defined in the GraphQL Schema.
 */
export default class Mutations {
  /**
   * Gets the function that resolve for every mutation.
   *
   * @returns All the mutations defined in the schema with their corresponding resolving function.
   */
  static getMutations(): MutationResolvers {
    return {
      addDeck: async (parent, args, context, info) => AddDeckMutation.addDeckMutation(args, context, info),
      addGame: async (parent, args, context, info) => AddGameMutation.addGameMutation(args, context, info),
      addUser: async (parent, args, context, info) => AddUserMutation.addUserMutation(args, info),
      login: async (parent, args, context, info) => LoginMutation.loginMutation(args, context, info),
      logout: async (parent, args, context, info) => LogoutMutation.logoutMutation(context, info),
      playPass: async (parent, args, context, info) => PlayPassMutation.playPassMutation(args, context, info),
      playUnit: async (parent, args, context, info) => PlayUnitMutation.playUnitMutation(args, context, info),
      ready: async (parent, args, context, info) => ReadyMutation.readyMutation(args, context, info),
      redraw: async (parent, args, context, info) => RedrawMutation.redrawMutation(args, context, info),
      setDeck: async (parent, args, context, info) => SetDeckMutation.setDeckMutation(args, context, info),
      setOrder: async (parent, args, context, info) => SetOrderMutation.setOrderMutation(args, context, info),
    }
  }
}
