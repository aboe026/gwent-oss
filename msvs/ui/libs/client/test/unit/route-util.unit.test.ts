import { getRouteFromPath } from '../../src/util/route-util'
import { ROUTES } from '@gwent-oss/constants'

describe('route-util', () => {
  describe('getRouteFromPath', () => {
    it('returns undefined if path does not match any known routes', () => {
      expect(getRouteFromPath('invalid')).toEqual(undefined)
    })
    it('returns route if path matches static route', () => {
      expect(getRouteFromPath('/about')).toEqual(ROUTES.About)
    })
    it('returns route if path matches dynamic route with id', () => {
      expect(getRouteFromPath('/decks/123')).toEqual(ROUTES.Deck)
    })
    it('returns route if path matches dynamic route with new', () => {
      expect(getRouteFromPath('/decks/new')).toEqual(ROUTES.Deck)
    })
  })
})
