import path from 'path'

import getEnv, { NODE_ENV, num, url } from '@gwent/env'

export default getEnv({
  dotEnvFilePath: process.env.NODE_ENV === NODE_ENV.Dev ? path.join(__dirname, '..', '.env') : '',
  specs: {
    API_URL: url({
      desc: 'The URL the GraphQL server running Gwent.',
      default: 'http://localhost:4000/graphql',
    }),
    GAMES_TO_PLAY: num({
      desc: 'The number of games to play.',
      default: 1,
    }),
  },
})
