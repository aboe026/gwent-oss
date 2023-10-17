import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import { createRoot } from 'react-dom/client'

import '@witcher-3-gwent/client-env' // get typings/access to window.env
import './index.css'
import App from './App'

if (typeof window !== 'undefined') {
  const root = createRoot(document.getElementById('root') as Element)
  const client = new ApolloClient({
    uri: window.env.API_URL,
    cache: new InMemoryCache(),
    connectToDevTools: process.env.NODE_ENV === 'development' ? true : false, // process.env.NODE_ENV overwritten/hard-coded at build time
  })
  root.render(
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  )
}
