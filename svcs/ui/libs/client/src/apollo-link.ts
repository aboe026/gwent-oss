import { split, HttpLink } from '@apollo/client'
import { getMainDefinition } from '@apollo/client/utilities'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import urlJoin from 'url-join'

const httpLink = new HttpLink({
  uri: urlJoin(window.env.API_BASE_URL, 'graphql'),
  credentials: process.env.NODE_ENV === 'development' ? 'include' : 'same-origin', // process.env.NODE_ENV overwritten/hard-coded at build time
})

const wsLink = new GraphQLWsLink(
  createClient({
    url: urlJoin(window.env.API_BASE_URL.replace(/http:/, 'ws:').replace(/https:/, 'wss:'), 'subscribe'),
  })
)

// The split function takes three parameters:
//
// * A function that's called for each operation to execute
// * The Link to use for an operation if the function returns a "truthy" value
// * The Link to use for an operation if the function returns a "falsy" value
export default split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
  },
  wsLink,
  httpLink
)
