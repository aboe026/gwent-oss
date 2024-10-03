import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { createRoot } from 'react-dom/client'

import '@gwent/client-env' // get typings/access to window.env
import AboutPage from './pages/About.jsx'
import App from './App.jsx'
import DeckPage from './pages/Deck.jsx'
import DecksPage from './pages/Decks.jsx'
import Game from './pages/Game.jsx'
import Games from './pages/Games.jsx'
import HomePage from './pages/Home.jsx'
import LoginPage from './pages/Login.jsx'
import LogoutPage from './pages/Logout.jsx'
import NotFoundPage from './pages/NotFound.jsx'
import ProfilePage from './pages/Profile.jsx'
import { ROUTES } from '@gwent/constants'
import SignupPage from './pages/Signup.jsx'
import './index.css'

/**
 * The main entrypoint of the Browser Client.
 */
const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <NotFoundPage />,
    children: [
      {
        path: ROUTES.Game.path,
        element: <Game />,
      },
      {
        path: ROUTES.Games.path,
        element: <Games />,
      },
      {
        path: ROUTES.Deck.path,
        element: <DeckPage />,
      },
      {
        path: ROUTES.Decks.path,
        element: <DecksPage />,
      },
      {
        path: ROUTES.Home.path,
        element: <HomePage />,
      },
      {
        path: ROUTES.Login.path,
        element: <LoginPage />,
      },
      {
        path: ROUTES.Signup.path,
        element: <SignupPage />,
      },
      {
        path: ROUTES.Logout.path,
        element: <LogoutPage />,
      },
      {
        path: ROUTES.Profile.path,
        element: <ProfilePage />,
      },
      {
        path: ROUTES.About.path,
        element: <AboutPage />,
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
