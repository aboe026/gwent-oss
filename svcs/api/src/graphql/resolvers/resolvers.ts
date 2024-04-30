import DeckResolver from './deck-resolver'
import DlcResolver from './dlc-resolver'
import EffectResolver from './effect-resolver'
import FactionResolver from './faction-resolver'
import LeaderResolver from './leader-resolver'
import MutationResolver from './mutation-resolver'
import QueryResolver from './query-resolver'
import { Resolvers } from '@gwent/graphql-schema/resolver-typings'
import { scalars } from '@gwent/graphql-schema'
import UnitResolver from './unit-resolver'
import UserResolver from './user-resolver'

export const resolvers: Resolvers = {
  Deck: DeckResolver,
  Dlc: DlcResolver,
  Effect: EffectResolver,
  Faction: FactionResolver,
  Leader: LeaderResolver,
  Mutation: MutationResolver,
  Query: QueryResolver,
  ...scalars,
  Unit: UnitResolver,
  User: UserResolver,
}

export default resolvers
