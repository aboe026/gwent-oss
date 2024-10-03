export const ROUTES: AppRoutes = {
  About: {
    path: '/about',
    secure: false,
  },
  Deck: {
    path: '/decks/:deckId',
    secure: true,
  },
  Decks: {
    path: '/decks',
    secure: true,
  },
  Game: {
    path: '/games/:gameId',
    secure: true,
  },
  Games: {
    path: '/games',
    secure: true,
  },
  Home: {
    path: '/',
    secure: true,
  },
  Login: {
    path: '/login',
    secure: false,
  },
  Logout: {
    path: '/logout',
    secure: true,
  },
  Profile: {
    path: '/profile',
    secure: true,
  },
  Signup: {
    path: '/signup',
    secure: false,
  },
}

interface AppRoutes {
  About: AppRoute
  Deck: AppRoute
  Decks: AppRoute
  Game: AppRoute
  Games: AppRoute
  Home: AppRoute
  Login: AppRoute
  Logout: AppRoute
  Profile: AppRoute
  Signup: AppRoute
}

export interface AppRoute {
  path: string
  secure: boolean
}
