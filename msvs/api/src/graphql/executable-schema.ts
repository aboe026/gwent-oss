import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from '@graphql-tools/schema'

import Permissions from './permissions'
import resolvers from './resolvers/resolvers'
import { typeDefs } from '@gwent/graphql-schema'

/**
 * The executable GraphQL schema.
 */
export default applyMiddleware(
  makeExecutableSchema({
    typeDefs,
    resolvers,
  }),
  Permissions.shield()
)
