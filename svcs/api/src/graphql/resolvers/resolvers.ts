import MutationResolver from './mutation-resolver'
import QueryResolver from './query-resolver'
import { Resolvers } from '@gwent/graphql-schema/resolver-typings'
import { scalars } from '@gwent/graphql-schema'

export const resolvers: Resolvers = {
  Mutation: MutationResolver.getResolvers(),
  Query: QueryResolver.getResolvers(),
  ...scalars,
}

export default resolvers
