import { createRoot } from 'react-dom/client'

import '@gwent-oss/client-env' // get typings/access to window.env throughout project
import Apollo from './Apollo'
import Router from './Router'
import './index.css'

/**
 * The main entrypoint of the Browser Client.
 */
if (typeof window !== 'undefined') {
  const element = document.getElementById('root')
  if (element) {
    const root = createRoot(element)

    root.render(
      <Apollo>
        <Router />
      </Apollo>
    )
  }
}
