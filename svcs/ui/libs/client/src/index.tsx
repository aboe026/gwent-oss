import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import '@gwent/client-env' // get typings/access to window.env
import './index.css'
import App from './App'
import HomePage from './pages/Home'
import LoginPage from './pages/Login'
import NotFoundPage from './pages/NotFound'
import ProfilePage from './pages/Profile'

const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <NotFoundPage />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/profile',
        element: <ProfilePage />,
      },
      {
        path: '/',
        element: <HomePage />,
      },
    ],
  },
])

if (typeof window !== 'undefined') {
  const root = createRoot(document.getElementById('root') as Element)
  const client = new ApolloClient({
    uri: window.env.API_URL,
    cache: new InMemoryCache(),
    credentials: process.env.NODE_ENV === 'development' ? 'include' : 'same-origin', // process.env.NODE_ENV overwritten/hard-coded at build time,
    connectToDevTools: process.env.NODE_ENV === 'development' ? true : false, // process.env.NODE_ENV overwritten/hard-coded at build time
  })
  root.render(
    <ApolloProvider client={client}>
      <RouterProvider router={router} />
    </ApolloProvider>
  )
}
