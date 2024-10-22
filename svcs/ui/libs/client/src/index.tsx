import { createRoot } from 'react-dom/client'

import '@gwent/client-env' // get typings/access to window.env throughout project
import Apollo from './Apollo'
import Router from './Router'
import './index.css'

/**
 * The main entrypoint of the Browser Client.
 */
if (typeof window !== 'undefined') {
  const root = createRoot(document.getElementById('root') as Element)

  root.render(
    <Apollo>
      <Router />
    </Apollo>
  )
}
