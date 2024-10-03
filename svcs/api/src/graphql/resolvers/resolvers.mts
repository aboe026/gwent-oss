import MutationResolver from './mutation-resolver.mjs'
import QueryResolver from './query-resolver.mjs'
import { Resolvers } from '@gwent/graphql-schema/resolver-typings'
import { scalars } from '@gwent/graphql-schema'

/**
 * The definition of all resolvers defined on the GraphQL schema.
 */
export const resolvers: Resolvers = {
  Mutation: MutationResolver.getResolvers(),
  Query: QueryResolver.getResolvers(),
  ...scalars,
}

export default resolvers
