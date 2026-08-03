import { makeExecutableSchema } from '@graphql-tools/schema'

import resolvers from './resolvers/resolvers'
import { typeDefs } from '@gwent-oss/graphql-schema'

/**
 * The executable GraphQL schema.
 */
export default makeExecutableSchema({
  typeDefs,
  resolvers,
})
