export const DATE_TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ'
export const HTML_CLASSES = {
  FormErrors: 'form-errors',
  Primary: 'primary',
  Secondary: 'secondary',
}
export const HTML_IDS = {
  Banner: 'banner',
  BannerUsername: 'bannerUsername',
  Hamburger: 'hamburger',
  Home: 'home',
  LoginForm: 'loginSignUp',
  LoginPassword: 'password',
  LoginUsername: 'name',
  LogoutForm: 'logoutForm',
  LogoutLogin: 'logoutLogin',
  LogoutMessage: 'logoutMessage',
  MainTitle: 'mainTitle',
  MenuItems: 'menuItems',
  MenuItemsProfile: 'menuProfile',
  MenutItemsHome: 'menuHome',
  NotFound: 'notFound',
  NotFoundHomeLink: 'notFoundHomeLink',
  Profile: 'profile',
  ProfileLogout: 'profileLogout',
  ProfileUsername: 'profileUsername',
  ProfileCreated: 'profileCreated',
}
export const NOT_AUTHENTICATED_MESSAGE = 'Not Authenticated. Login or provide credentials.'

export const ROUTES: AppRoutes = {
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
    secure: false,
  },
  Profile: {
    path: '/profile',
    secure: true,
  },
}

interface AppRoutes {
  Home: AppRoute
  Login: AppRoute
  Logout: AppRoute
  Profile: AppRoute
}

export interface AppRoute {
  path: string
  secure: boolean
}
