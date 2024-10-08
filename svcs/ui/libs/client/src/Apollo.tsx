import { createClient } from 'graphql-ws'
import { createContext, memo, PropsWithChildren } from 'react'
import { split, HttpLink, ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import urlJoin from 'url-join'

import { getMainDefinition } from '@apollo/client/utilities'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'

/**
 * Need to pass management of WebSocket status to a lower-order component
 * otherwise the state changes of the WebSocket status causes this component to re-render
 * and since it is so high in the component tree it would re-render child pages (such as DecksPage)
 * which would then cause those pages to redo their useEffect (which would create another WebSocket unnecessarily)
 */
export const WebSocketLinkContext = createContext<GraphQLWsLink | undefined>(undefined)
// const [WebSocketLinkContext, WebSocketLinkProvider] = createContextWithoutDefault<GraphQLWsLink>('WebSocketLinkContext')

export default memo(function Apollo({ children }: PropsWithChildren) {
  console.log('TEST Apollo')
  const timeoutMilliseconds = Number(window.env.WEB_SOCKET_PING_INTERVAL_SECONDS) * 1000

  const httpLink = new HttpLink({
    uri: urlJoin(window.env.API_BASE_URL, 'graphql'),
    credentials: process.env.NODE_ENV === 'development' ? 'include' : 'same-origin', // process.env.NODE_ENV overwritten/hard-coded at build time
  })

  const wsLink = new GraphQLWsLink(
    createClient({
      url: urlJoin(window.env.API_BASE_URL.replace(/http:/, 'ws:').replace(/https:/, 'wss:'), 'subscribe'),
      connectionAckWaitTimeout: timeoutMilliseconds, // How long to wait for server to acknowlege the initial connection is established.
      keepAlive: timeoutMilliseconds, // How often to ping server for connection status. Does not actually terminate connection if response not positive, that needs to be done manually.
    })
  )

  const client = new ApolloClient({
    link: split(
      ({ query }) => {
        const definition = getMainDefinition(query)
        return definition.kind === 'OperationDefinition' && definition.operation === 'subscription'
      },
      wsLink,
      httpLink
    ),
    cache: new InMemoryCache(),
    credentials: process.env.NODE_ENV === 'development' ? 'include' : 'same-origin', // process.env.NODE_ENV overwritten/hard-coded at build time,
    connectToDevTools: process.env.NODE_ENV === 'development' ? true : false, // process.env.NODE_ENV overwritten/hard-coded at build time
  })

  return (
    <ApolloProvider client={client}>
      <WebSocketLinkContext.Provider value={wsLink}>{children}</WebSocketLinkContext.Provider>
    </ApolloProvider>
  )
})
