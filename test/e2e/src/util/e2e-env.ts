import path from 'path'

import getEnv, { NODE_ENV, num, str, url } from '@gwent/env'

export default getEnv({
  dotEnvFilePath: process.env.NODE_ENV === NODE_ENV.Dev ? path.join(__dirname, '..', '.env') : '',
  specs: {
    API_BASE_URL: url({
      desc: 'The base URL the Gwent API is running on (should contain /graphql and /subscribe endpoints)',
      default: 'http://localhost:4000',
    }),
    BASE_URL: url({
      desc: 'The URL the Gwent website is running on',
      default: 'http://localhost:3000',
    }),
    BROWSER: str({
      desc: 'The browser to run tests against.',
      choices: ['chrome', 'edge', 'firefox', 'safari'],
      default: 'edge',
    }),
    BUILD: num({
      desc: 'The build number of the application running',
      default: 0,
    }),
    CONCURRENCY: num({
      desc: 'The number of e2e tests to run simultaneously.',
      default: 2,
    }),
    MONGO_DB: str({
      desc: 'The name of the MongoDB database to interact with',
      default: 'gwent-e2e',
    }),
    MONGO_URL: url({
      desc: 'Connection string for MongoDB instance',
      default: 'mongodb://localhost',
    }),
    SESSION_COOKIE_NAME: str({
      desc: 'The name of the Cookie for the user session.',
      default: 'gwent.sid',
    }),
    SESSION_SECRET: str({
      desc: 'The secret to use for securing user sessions',
      default: 'youshouldreallychangethisforproductionusage',
    }),
    WINDOW_HEIGHT: num({
      desc: 'Width in pixels to size the browser window to',
      default: 1080,
    }),
    WINDOW_WIDTH: num({
      desc: 'Height in pixesl to size the browser window to',
      default: 1920,
    }),
  },
})
