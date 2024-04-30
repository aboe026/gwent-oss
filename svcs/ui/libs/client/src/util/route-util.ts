import { AppRoute, ROUTES } from '@gwent/constants'

/**
 * Gets potential AppRoute from given path
 *
 * @param path The URL path to get the route it potentially matches
 * @returns The AppRoute for the given path if one exists
 */
export function getRouteFromPath(path: string): AppRoute | undefined {
  for (const key of Object.keys(ROUTES)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const route = (ROUTES as any)[key] as AppRoute
    let matchesDynamicPath = false
    if (route.path.includes('/:')) {
      const routeStaticPath = route.path.substring(0, route.path.indexOf('/:'))
      matchesDynamicPath = path.startsWith(routeStaticPath)
    }
    if (route.path === path || matchesDynamicPath) {
      return route
    }
  }
}
