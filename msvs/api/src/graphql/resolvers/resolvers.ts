import Fields from './fields/fields'
import Mutations from './mutations/mutations'
import Queries from './queries/queries'
import { Resolvers } from '@gwent-oss/graphql-schema/resolver-typings'
import { scalars } from '@gwent-oss/graphql-schema'
import SubscriptionResolver from './subscription-resolver'

/**
 * The definition of all resolvers defined on the GraphQL schema.
 */
export const resolvers: Resolvers = {
  Mutation: Mutations.getMutations(),
  Query: Queries.getQueries(),
  Subscription: SubscriptionResolver.getResolvers(),
  ...Fields.getFields(),
  ...scalars,
}

export default resolvers
