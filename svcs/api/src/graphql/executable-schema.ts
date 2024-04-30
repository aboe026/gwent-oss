import { applyMiddleware } from 'graphql-middleware'
import { makeExecutableSchema } from '@graphql-tools/schema'

import { directives, schema } from '@gwent/graphql-schema'
import permissions from './permissions'
import resolvers from './resolvers/resolvers'

export default applyMiddleware(
  makeExecutableSchema({
    typeDefs: [directives, schema],
    resolvers,
  }),
  permissions
)
