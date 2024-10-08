import {
  createContext,
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { WebSocketLinkContext } from './Apollo'
import WebSocket from 'ws'

export enum CONNECTION_STATUS {
  Connected = 'Connected',
  Interrupted = 'Interrupted',
  Failed = 'Failed',
}

export const ConnectionStatusContext = createContext({
  connectionStatus: CONNECTION_STATUS.Connected,
  setConnectionStatus: (() => {}) as Dispatch<SetStateAction<CONNECTION_STATUS>>,
})

export default function SubscriptionConnectionStatus({ children }: PropsWithChildren) {
  const graphqlQsLink = useContext(WebSocketLinkContext)
  const [socket, setSocket] = useState<WebSocket>()
  const [connectionStatus, setConnectionStatus] = useState<CONNECTION_STATUS>(CONNECTION_STATUS.Connected)
  const timeoutMilliseconds = Number(window.env.WEB_SOCKET_PING_INTERVAL_SECONDS) * 1000
  let timeoutForInterrupts: NodeJS.Timeout
  let timeoutForFailures: NodeJS.Timeout

  const statusRef = useRef<CONNECTION_STATUS>()
  statusRef.current = connectionStatus // need to refer to this inside ".on" callbacks, otherwise will get a "stale" value that isn't accurate
  const socketRef = useRef<WebSocket>()
  socketRef.current = socket // need to refer to this inside ".on" callbacks, otherwise will get a "stale" value that isn't accurate

  useEffect(() => {
    if (graphqlQsLink) {
      graphqlQsLink.client.on('connected', (connectedSocket) => {
        if (!socketRef.current) {
          setConnectionStatus(CONNECTION_STATUS.Connected)
          setSocket(connectedSocket as WebSocket)
        }
      })
      graphqlQsLink.client.on('ping', (received) => {
        if (!received) {
          timeoutForInterrupts = setTimeout(() => {
            if (statusRef.current === CONNECTION_STATUS.Connected) {
              setConnectionStatus(CONNECTION_STATUS.Interrupted)
            }
          }, timeoutMilliseconds / 2)
          timeoutForFailures = setTimeout(() => {
            setConnectionStatus(CONNECTION_STATUS.Failed)
            if (socketRef.current) {
              socketRef.current.close(4408, 'Request Timeout')
              setSocket(undefined)
            }
          }, timeoutMilliseconds)
        }
      })
      graphqlQsLink.client.on('pong', (received) => {
        if (received) {
          clearTimeout(timeoutForInterrupts)
          clearTimeout(timeoutForFailures)
          setConnectionStatus(CONNECTION_STATUS.Connected)
        }
      })
      graphqlQsLink.client.on('closed', () => {
        if (socketRef.current) {
          setConnectionStatus(CONNECTION_STATUS.Failed)
          setSocket(undefined)
        }
      })
      graphqlQsLink.client.on('error', (error) => {
        if (socketRef.current) {
          setConnectionStatus(CONNECTION_STATUS.Failed)
          setSocket(undefined)
          console.error('Error in Subscription WebSocket: ', error)
        }
      })
    }
  }, [])

  return (
    <ConnectionStatusContext.Provider
      value={{
        connectionStatus,
        setConnectionStatus,
      }}
    >
      {children}
    </ConnectionStatusContext.Provider>
  )
}
