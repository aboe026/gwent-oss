import { createRoot } from 'react-dom/client'
import { useState } from 'react'

import '@gwent/client-env' // get typings/access to window.env
import Apollo from './Apollo'
import { CONNECTION_STATUS } from './util/ConnectionStatus'
import Router from './Router'
import './index.css'

/**
 * The main entrypoint of the Browser Client.
 */
if (typeof window !== 'undefined') {
  const root = createRoot(document.getElementById('root') as Element)

  root.render(<Index />)
}

function Index() {
  const [connectionStatus, setConnectionStatus] = useState<CONNECTION_STATUS>(CONNECTION_STATUS.Connected)

  return (
    <Apollo setConnectionStatus={setConnectionStatus}>
      <Router connectionStatus={connectionStatus} />
    </Apollo>
  )
}
