import { createClient } from 'graphql-ws'
import { createContext, PropsWithChildren } from 'react'
import { getMainDefinition } from '@apollo/client/utilities'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { split, HttpLink, ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import urlJoin from 'url-join'

import { mergeCachedGamePlayers } from './util/merge-cached-game-players'

/**
 * Need to pass management of WebSocket status to a lower-order component
 * otherwise the state changes of the WebSocket status causes this component to re-render
 * and since it is so high in the component tree it would re-render child pages (such as DecksPage)
 * which would then cause those pages to redo their useEffect (which would create another WebSocket unnecessarily)
 */
export const WebSocketLinkContext = createContext<GraphQLWsLink | undefined>(undefined)

/**
 * A component which utilizes Apollo to interface the browser client to the backend server.
 *
 * @param config The configuration of the component.
 * @param config.children The children to render underneath this component.
 * @returns A component which configures the browser client to the backend server.
 */
export default function Apollo({ children }: PropsWithChildren) {
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
      lazy: true, // prevent socket from being created until user defined on session (so server can authenticate/authorize via the session cookie)
      shouldRetry: () => true, // always attempt to re-connect
      retryAttempts: Number.MAX_SAFE_INTEGER, // "infinity"
      retryWait: () => new Promise((resolve) => setTimeout(resolve, timeoutMilliseconds)),
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
    cache: new InMemoryCache({
      typePolicies: {
        GamePlayer: {
          fields: {
            user: {
              merge: true,
            },
          },
        },
        Game: {
          fields: {
            players: {
              merge: mergeCachedGamePlayers,
            },
          },
        },
      },
    }),
    credentials: process.env.NODE_ENV === 'development' ? 'include' : 'same-origin', // process.env.NODE_ENV overwritten/hard-coded at build time,
    connectToDevTools: process.env.NODE_ENV === 'development' ? true : false, // process.env.NODE_ENV overwritten/hard-coded at build time
  })

  return (
    <ApolloProvider client={client}>
      <WebSocketLinkContext.Provider value={wsLink}>{children}</WebSocketLinkContext.Provider>
    </ApolloProvider>
  )
}
