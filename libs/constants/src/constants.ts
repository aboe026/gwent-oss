import { AppRoute, ROUTES } from './routes'
import { HTML_CLASSES, HTML_IDS } from './html-names'
import { PubSubEvents } from './pub-sub-events'

export const DATE_TIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss.SSSZ'

export const PLAYER_COUNTS = {
  Min: 2,
  Max: 2,
}
export const MAX_REDRAWS = 2
export const STARTING_HAND_SIZE = 10
export const MAX_ROUNDS = 3
export const MAX_SPECIALS = 10

export const NOT_AUTHENTICATED_MESSAGE = 'Not Authenticated. Login or provide credentials.'
export const NOT_AUTHORIZED_MESSAGE = 'Not Authorized. You do not have access to this resource.'

export const GAME_ORDER_COIN_FLIP_DURATION_SECONDS = 5

export { AppRoute, HTML_CLASSES, HTML_IDS, PubSubEvents, ROUTES }
