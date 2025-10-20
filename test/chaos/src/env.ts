import path from 'path'

import getEnv, { NODE_ENV, num, str, url } from '@gwent/env'

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
    LOG_FILE: str({
      desc: 'The path to the file to store log output',
      default: 'output.log',
    }),
  },
})
