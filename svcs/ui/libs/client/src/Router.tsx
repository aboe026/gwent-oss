import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import AboutPage from './pages/About'
import App from './App'
import DeckPage from './pages/Deck'
import DecksPage from './pages/Decks'
import Game from './pages/Game'
import Games from './pages/Games'
import HomePage from './pages/Home'
import LoginPage from './pages/Login'
import LogoutPage from './pages/Logout'
import NotFoundPage from './pages/NotFound'
import ProfilePage from './pages/Profile'
import { ROUTES } from '@gwent/constants'
import SignupPage from './pages/Signup'

/**
 * The URL paths the application supports and their corresponding React components.
 *
 * @returns The router to direct URL paths to their correct component.
 */
export default function Router() {
  return (
    <RouterProvider
      router={createBrowserRouter([
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
      ])}
    />
  )
}
