const routes: AppRoutes = {
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

export default routes

export function getRouteFromPath(path: string): AppRoute | undefined {
  for (const key of Object.keys(routes)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const route = (routes as any)[key] as AppRoute
    if (route.path === path) {
      return route
    }
  }
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
