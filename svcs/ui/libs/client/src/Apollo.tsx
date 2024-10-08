import { createClient } from 'graphql-ws'
import { Dispatch, PropsWithChildren, SetStateAction, useState } from 'react'
import { split, HttpLink, ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import urlJoin from 'url-join'
import WebSocket from 'ws'

import { CONNECTION_STATUS } from './util/ConnectionStatus'
import { getMainDefinition } from '@apollo/client/utilities'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'

export default function Apollo({ children, setConnectionStatus }: ApolloProps) {
  const [socket, setSocket] = useState<WebSocket>()
  const timeoutMilliseconds = Number(window.env.WEB_SOCKET_PING_INTERVAL_SECONDS) * 1000
  let timeoutForInterrupts: NodeJS.Timeout
  let timeoutForFailures: NodeJS.Timeout

  const httpLink = new HttpLink({
    uri: urlJoin(window.env.API_BASE_URL, 'graphql'),
    credentials: process.env.NODE_ENV === 'development' ? 'include' : 'same-origin', // process.env.NODE_ENV overwritten/hard-coded at build time
  })

  const wsLink = new GraphQLWsLink(
    createClient({
      url: urlJoin(window.env.API_BASE_URL.replace(/http:/, 'ws:').replace(/https:/, 'wss:'), 'subscribe'),
      connectionAckWaitTimeout: timeoutMilliseconds, // How long to wait for server to acknowlege the initial connection is established.
      keepAlive: timeoutMilliseconds, // How often to ping server for connection status. Does not actually terminate connection if response not positive, that needs to be done manually.
      on: {
        connected: (connectedSocket: unknown) => {
          if (!socket) {
            setConnectionStatus(CONNECTION_STATUS.Connected)
            setSocket(connectedSocket as WebSocket)
          }
        },
        ping: (received) => {
          if (!received) {
            timeoutForInterrupts = setTimeout(() => {
              setConnectionStatus(CONNECTION_STATUS.Interrupted)
            }, timeoutMilliseconds / 2)
            timeoutForFailures = setTimeout(() => {
              setConnectionStatus(CONNECTION_STATUS.Failed)
              // for some reason WebSocket.OPEN was giving undefined here
              // so had to hard code in its value (1)
              if (socket?.readyState === 1) {
                socket.close(4408, 'Request Timeout')
              }
            }, timeoutMilliseconds)
          }
        },
        pong: (received) => {
          if (received) {
            clearTimeout(timeoutForInterrupts)
            clearTimeout(timeoutForFailures)
          }
        },
        closed: () => {
          if (socket) {
            setConnectionStatus(CONNECTION_STATUS.Failed)
            setSocket(undefined)
          }
        },
        error: () => {
          if (socket) {
            setConnectionStatus(CONNECTION_STATUS.Failed)
            setSocket(undefined)
          }
        },
      },
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

  return <ApolloProvider client={client}>{children}</ApolloProvider>
}

interface ApolloProps extends PropsWithChildren {
  setConnectionStatus: Dispatch<SetStateAction<CONNECTION_STATUS>>
}
