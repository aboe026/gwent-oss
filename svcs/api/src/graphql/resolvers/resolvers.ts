import MutationResolver from './mutation-resolver'
import QueryResolver from './query-resolver'
import { Resolvers } from '@gwent/graphql-schema/resolver-typings'
import { scalars } from '@gwent/graphql-schema'
import SubscriptionResolver from './subscription-resolver'

/**
 * The definition of all resolvers defined on the GraphQL schema.
 */
export const resolvers: Resolvers = {
  Mutation: MutationResolver.getResolvers(),
  Query: QueryResolver.getResolvers(),
  Subscription: SubscriptionResolver.getResolvers(),
  ...scalars,
}

export default resolvers
