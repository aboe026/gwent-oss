import path from 'path'

import getEnv, { bool, NODE_ENV, num, str, url } from '@gwent-oss/env'

export default getEnv({
  dotEnvFilePath: process.env.NODE_ENV === NODE_ENV.Dev ? path.join(__dirname, '..', '.env') : '',
  specs: {
    API_URL: url({
      desc: 'The URL the GraphQL server running gwent-oss.',
      default: 'http://localhost:4000/graphql',
    }),
    GAMES_TO_PLAY: num({
      desc: 'The number of games to play.',
      default: 1,
    }),
    IGNORE_CERTIFICATE_ERRORS: bool({
      desc: 'Whether errors due to invalid/expired/self-signed certificates should be ignored or not.',
      default: false,
    }),
    LOG_FILE: str({
      desc: 'The path to the file to store log output',
      default: 'output.log',
    }),
    WAIT_MS: num({
      desc: 'The number of milliseconds to wait before making each request. Useful for avoiding rate-limiting errors.',
      default: 0,
    }),
  },
})
