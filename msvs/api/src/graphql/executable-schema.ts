import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from '@graphql-tools/schema'

import { directives, schema } from '@gwent/graphql-schema'
import Permissions from './permissions'
import resolvers from './resolvers/resolvers'

/**
 * The executable GraphQL schema.
 */
export default applyMiddleware(
  makeExecutableSchema({
    typeDefs: [directives, schema],
    resolvers,
  }),
  Permissions.shield()
)
