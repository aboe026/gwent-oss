import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import '@gwent/client-env' // get typings/access to window.env
import AboutPage from './pages/About'
import App from './App'
import DeckPage from './pages/Deck'
import DecksPage from './pages/Decks'
import HomePage from './pages/Home'
import LoginPage from './pages/Login'
import LogoutPage from './pages/Logout'
import NotFoundPage from './pages/NotFound'
import ProfilePage from './pages/Profile'
import { ROUTES } from '@gwent/constants'
import SignupPage from './pages/Signup'
import './index.css'

const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <NotFoundPage />,
    children: [
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
